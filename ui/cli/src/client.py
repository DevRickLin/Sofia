import argparse
import json
import logging
import os
import sys
import uuid
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional

from common.client.client import A2AClient
from common.a2a.protocol import SendTaskStreamingResponse

# 添加ANSI颜色代码常量
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
RED = "\033[91m"
UNDERLINE = "\033[4m"
BG_BLACK = "\033[40m"
BRIGHT_GREEN = "\033[92;1m"  # 明亮的绿色

# 默认禁用日志输出（仅显示WARNING及以上级别）
logging.basicConfig(level=logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("common.client").setLevel(logging.ERROR)
logging.getLogger("__main__").setLevel(logging.ERROR)

# 创建日志记录器
logger = logging.getLogger(__name__)
logger.setLevel(logging.ERROR)

# 解析命令行参数
parser = argparse.ArgumentParser(description="A2A Client")
parser.add_argument("--verbose", "-v", action="store_true", help="启用详细日志输出")
args = parser.parse_args()

# 如果指定了verbose参数，则启用详细日志
if args.verbose:
    logging.getLogger().setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("common.client").setLevel(logging.INFO)
    logging.getLogger("__main__").setLevel(logging.INFO)
    logger.setLevel(logging.INFO)
    logger.info("已启用详细日志模式")

# Create A2A client
client = A2AClient(url="http://localhost:8000")

async def send_query(query: str) -> Dict[str, Any]:
    """Send a query to the agent server and get a response."""
    try:
        # 生成一个唯一的字符串ID而不是使用None
        request_id = str(uuid.uuid4())
        logger.info(f"Sending query with ID: {request_id}")
        response = await client.send_task(query, id=request_id)
        return response.model_dump()
    except Exception as e:
        logger.error(f"Error sending request: {e}")
        return {"error": str(e)}

async def send_streaming_query(query: str):
    """Send a query to the agent server and get a streaming response."""
    try:
        # 生成一个唯一的字符串ID并传递给send_task_streaming
        # 现在send_task_streaming方法已修改为支持id参数
        request_id = str(uuid.uuid4())
        logger.info(f"Sending streaming query with request ID: {request_id}")
        # 使用async for来正确处理异步生成器，传递id参数
        async for chunk in client.send_task_streaming(query, id=request_id):
            logger.debug(f"Received chunk: {chunk}")
            yield chunk.model_dump()
    except Exception as e:
        logger.error(f"Error in streaming request: {e}")
        yield {"error": f"Error in streaming request: {e}"}

async def interactive_mode():
    """Run the client in interactive mode."""
    print("\n=== Interactive Mode ===")
    print("Type your arithmetic queries (or 'exit' to quit)")
    
    while True:
        query = input(f"{BOLD}> {RESET}")
        if query.lower() == 'exit':
            break
        
        response = await send_query(query)
        
        # Process and display the response
        if "result" in response:
            content = response.get("result", {}).get("content", "No content")
            print(f"{BOLD}Agent:{RESET} {GREEN}{content}{RESET}")
        else:
            print(f"{BOLD}Error:{RESET} {YELLOW}{response.get('error', 'Unknown error')}{RESET}")

def is_response_artifact(artifact: Dict[str, Any]) -> bool:
    """
    检查一个artifact是否为'response'类型
    
    检查条件:
    1. name字段值为'response'
    2. 或metadata中type字段为'response'
    """
    if not isinstance(artifact, dict):
        return False
        
    # 检查name字段
    if artifact.get("name") == "response":
        return True
        
    # 检查metadata字段中的type
    metadata = artifact.get("metadata")
    if isinstance(metadata, dict) and metadata.get("type") == "response":
        return True
        
    return False

async def streaming_interactive_mode():
    """Run the client in streaming interactive mode."""
    print("\n=== Streaming Interactive Mode ===")
    print("Type your arithmetic queries (or 'exit' to quit)")
    print("You'll see responses as they are generated.")
    
    while True:
        query = input(f"{BOLD}> {RESET}")
        if query.lower() == 'exit':
            break
        
        print(f"{BOLD}Agent:{RESET} ", end="", flush=True)
        
        # 跟踪是否有输出，以便在没有输出时显示提示信息
        has_output = False
        # 跟踪任务状态
        current_state = None
        
        # Process streaming response
        async for chunk in send_streaming_query(query):
            # 记录原始chunk以便调试
            logger.info(f"Received SSE chunk: {json.dumps(chunk)}")  # 截断长日志
            
            if "error" in chunk and chunk["error"] is not None:
                print(f"{YELLOW}Error: {chunk['error']}{RESET}")
                has_output = True
                continue
                
            # Extract and display content from different types of chunks
            if "result" in chunk:
                result = chunk["result"]
                logger.info(f"Result type: {type(result)}, keys: {result.keys() if isinstance(result, dict) else 'not a dict'}")
                
                # 处理状态更新事件
                if "status" in result:
                    # 处理状态对象
                    status = result["status"]
                    
                    if isinstance(status, dict):
                        # 记录状态信息
                        if "state" in status:
                            new_state = status.get("state")
                            if new_state != current_state:
                                current_state = new_state
                                # 只在状态变化时显示状态，使用浅色
                                logger.info(f"Task state changed to: {new_state}")
                                if new_state == "working":
                                    print(f"{BLUE}[Working...]{RESET} ", end="", flush=True)
                                elif new_state == "completed":
                                    print(f"{BLUE}[Completed]{RESET} ", end="", flush=True)
                        
                        # 检查状态中是否有消息
                        if "message" in status and status["message"]:
                            message = status["message"]
                            
                            # 检查消息中是否有部分
                            if isinstance(message, dict) and "parts" in message:
                                for part in message.get("parts", []):
                                    if isinstance(part, dict) and part.get("type") == "text" and "text" in part:
                                        text = part["text"]
                                        print(f"{GREEN}{text}{RESET}", end="", flush=True)
                                        has_output = True
                                        
                        # 检查直接的内容字段
                        elif "content" in status and status["content"]:
                            print(f"{GREEN}{status['content']}{RESET}", end="", flush=True)
                            has_output = True
                    
                # 处理Artifact更新事件（主要响应内容）
                elif "artifact" in result:
                    artifact = result["artifact"]
                    logger.info(f"Processing artifact: {artifact}")
                    
                    # 检查是否是response类型的artifact
                    is_response = is_response_artifact(artifact)
                    if is_response:
                        logger.info("Detected response artifact")
                        
                    if isinstance(artifact, dict) and "parts" in artifact:
                        # 渲染artifact中的各个部分
                        for part in artifact.get("parts", []):
                            if isinstance(part, dict) and part.get("type") == "text" and "text" in part:
                                text = part["text"]
                                
                                # 使用特殊格式渲染response类型的文本部分
                                if is_response:
                                    # 特殊渲染response类型文本：使用明亮的绿色、加粗和下划线
                                    print(f"{BRIGHT_GREEN}{BOLD}{text}{RESET}", end="", flush=True)
                                else:
                                    # 普通artifact使用常规绿色
                                    print(f"{GREEN}{text}{RESET}", end="", flush=True)
                                    
                                has_output = True
                
                # 直接处理包含content的结果
                elif "content" in result and result["content"]:
                    print(f"{GREEN}{result['content']}{RESET}", end="", flush=True)
                    has_output = True
                
                # 处理artifacts数组
                elif "artifacts" in result and result["artifacts"]:
                    for artifact in result.get("artifacts", []):
                        # 检查是否是response类型的artifact
                        is_response = is_response_artifact(artifact)
                        if is_response:
                            logger.info("Detected response artifact in artifacts array")
                            
                        if isinstance(artifact, dict) and "parts" in artifact:
                            for part in artifact.get("parts", []):
                                if isinstance(part, dict) and part.get("type") == "text" and "text" in part:
                                    text = part["text"]
                                    
                                    # 特殊渲染response类型的文本部分
                                    if is_response:
                                        print(f"{BRIGHT_GREEN}{BOLD}{text}{RESET}", end="", flush=True)
                                    else:
                                        print(f"{GREEN}{text}{RESET}", end="", flush=True)
                                        
                                    has_output = True
                
                # 对于其他未处理的格式，尝试提取任何文本内容
                else:
                    logger.info(f"Unhandled result format: {result}")
                    # 如果result本身是字符串，直接输出
                    if isinstance(result, str):
                        print(f"{CYAN}{result}{RESET}", end="", flush=True)
                        has_output = True
                    # 如果result是字典，尝试从中提取文本内容
                    elif isinstance(result, dict):
                        # 递归搜索字典中的任何文本内容
                        def extract_text_from_dict(d, depth=0):
                            if depth > 5:  # 限制递归深度
                                return False
                                
                            found_text = False
                            for key, value in d.items():
                                if isinstance(value, str) and value.strip():
                                    logger.info(f"Found text in key '{key}': {value[:50]}...")
                                    print(f"{CYAN}{value}{RESET}", end="", flush=True)
                                    found_text = True
                                elif isinstance(value, dict):
                                    if extract_text_from_dict(value, depth+1):
                                        found_text = True
                                elif isinstance(value, list):
                                    for item in value:
                                        if isinstance(item, dict):
                                            if extract_text_from_dict(item, depth+1):
                                                found_text = True
                            return found_text
                            
                        if extract_text_from_dict(result):
                            has_output = True
        
        # 如果没有输出，显示提示信息
        if not has_output:
            print(f"{YELLOW}No content received from the server.{RESET}")
            
        print()  # Add a new line after the complete response

async def run_test_queries():
    """Run test queries silently."""
    test_queries = [
        "What is 5 + 3?",
        "Calculate 10 * 7",
        "Divide 100 by 2",
        "What is the sum of 4, 8, and 12?",
        "Tell me a joke"
    ]
    
    logger.info("Running test queries...")
    for query in test_queries:
        await send_query(query)
    logger.info("Test queries completed")

async def main_async():
    """Async main entry point for the client."""
    # Run test queries silently
    await run_test_queries()
    
    # Prompt user to select mode
    print(f"\n{BOLD}=== Select Mode ==={RESET}")
    print(f"1. {CYAN}Regular Mode{RESET} (complete responses)")
    print(f"2. {CYAN}Streaming Mode{RESET} (see responses as they come in)")
    
    while True:
        mode = input(f"{BOLD}Select mode (1 or 2):{RESET} ")
        if mode == "1":
            await interactive_mode()
            break
        elif mode == "2":
            await streaming_interactive_mode()
            break
        else:
            print(f"{YELLOW}Invalid selection. Please enter 1 or 2.{RESET}")

def main():
    """Main entry point for the client."""
    # 命令行参数已在全局作用域中解析
    asyncio.run(main_async())

if __name__ == "__main__":
    main()