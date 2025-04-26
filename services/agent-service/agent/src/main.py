import logging
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any, AsyncIterable, List, Union, Iterator, Optional
from pydantic import BaseModel, Field
import sys

# 添加对Sofia根目录的引用
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.append(ROOT_DIR)

# Import Agno libraries
from agno.agent import Agent, RunResponse
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MultiMCPTools
# Update memory imports to use v2 structure
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.schema import UserMemory
from agno.storage.sqlite import SqliteStorage
# Remove MemoryManager import since we're not using it
from datetime import datetime

# 从项目根目录导入
from common.a2a.protocol import (
    AgentCard,
    AgentSkill,
    Message,
)
from common.server import A2AServer, TaskManager
from common.mcp_config import MCP_SERVERS

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the agent card - updated for general purpose agent
agent_card = AgentCard(
    name="SOFIA General Agent",
    description="A versatile agent with various capabilities provided by MCP servers",
    url=f"http://{os.getenv('A2A_SERVER_HOST', '0.0.0.0')}:{os.getenv('A2A_SERVER_PORT', '8000')}",
    version="0.1.0",
    skills=[
        AgentSkill(
            id="general",
            name="General Assistant",
            description="Handle various tasks through MCP server tools",
            examples=[
                "Perform calculations",
                "Get information from different sources",
                "Execute specialized tasks",
                "Use various integrated tools",
            ],
        )
    ],
)

class MemoryConfig(BaseModel):
    """配置Agno Memory的参数"""
    db_file: str = Field(
        default=os.getenv("MEMORY_DB_FILE", "tmp/memory.db")
    )
    table_name: str = Field(
        default=os.getenv("MEMORY_TABLE_NAME", "user_memories")
    )
    storage_db_file: str = Field(
        default=os.getenv("STORAGE_DB_FILE", "tmp/agent_storage.db")
    )
    storage_table_name: str = Field(
        default=os.getenv("STORAGE_TABLE_NAME", "agent_sessions")
    )

class SofiaAgent:
    SYSTEM_INSTRUCTION = (
        "You are a versatile assistant with access to various tools from MCP servers. "
        "Use the tools available to you to respond to user queries and perform tasks. "
        "Be concise and informative in your responses, focusing on providing the most relevant information. "
        "If you can't complete a request with your available tools, explain what capabilities you'd need. "
        "You have memory of previous interactions with users. Use this to provide more personalized responses. "
        "When appropriate, refer to past conversations to provide context and continuity. "
        "You can also manage your own memories - if users ask you to forget something, remove specific memories, "
        "or clear all memories, you can handle these requests directly."
    )
     
    def __init__(self):
        self.model_name = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.agent = None
        self.mcp_tools = None
        self.memory = None
        self.memory_config = MemoryConfig()
        
        # Convert MCP_SERVERS to a format usable by MultiMCPTools
        self.mcp_server_commands = self._convert_mcp_servers_to_commands()
        
    def _convert_mcp_servers_to_commands(self):
        """Convert MCP_SERVERS configuration to command format for MultiMCPTools."""
        commands = []
        try:
            # This conversion depends on the format of MCP_SERVERS
            # Adjust this logic based on your actual configuration
            for server in MCP_SERVERS:
                # Assuming MCP_SERVERS contains information like host, port, etc.
                # You might need to adjust this based on your actual configuration
                if 'command' in server:
                    commands.append(server['command'])
                    
            if not commands:
                logger.warning("No MCP server commands could be derived from MCP_SERVERS")
                
            return commands
        except Exception as e:
            logger.error(f"Error converting MCP servers to commands: {e}")
            return []
        
    async def initialize(self):
        """Initialize the agent with MCP tools"""
        try:
            # Initialize the model
            model = OpenAIChat(id=self.model_name, api_key=self.api_key)
            
            # Ensure the directory for the database files exists
            db_dir = os.path.dirname(self.memory_config.db_file)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir)
                logger.info(f"Created directory for database files: {db_dir}")
            
            # Create SQLite memory database
            memory_db = SqliteMemoryDb(
                table_name=self.memory_config.table_name,
                db_file=self.memory_config.db_file
            )
            logger.info(f"Created SQLite memory database at {self.memory_config.db_file}")
            
            # Create the Memory instance with database storage directly (no memory_manager)
            self.memory = Memory(db=memory_db)
            logger.info("Memory component initialized successfully with SQLite persistence")
            
            # Create agent storage
            agent_storage = SqliteStorage(
                table_name=self.memory_config.storage_table_name,
                db_file=self.memory_config.storage_db_file
            )
            logger.info(f"Created SQLite agent storage at {self.memory_config.storage_db_file}")
            
            # If no MCP server commands were found, create a basic agent
            if not self.mcp_server_commands:
                logger.warning("No MCP servers configured, creating basic agent without tools")
                self.agent = Agent(
                    model=model,
                    description=self.SYSTEM_INSTRUCTION,
                    memory=self.memory,
                    storage=agent_storage,
                    enable_user_memories=True,
                    enable_agentic_memory=True,  # Enable agentic memory management
                )
                return
                
            # Initialize MultiMCPTools with the server commands
            self.mcp_tools = MultiMCPTools(self.mcp_server_commands)
            await self.mcp_tools.__aenter__()
            
            # Create Agno agent with MCP tools
            self.agent = Agent(
                model=model,
                description=self.SYSTEM_INSTRUCTION,
                tools=[self.mcp_tools],
                show_tool_calls=True,
                memory=self.memory,
                storage=agent_storage,
                enable_user_memories=True,
                enable_agentic_memory=True,  # Enable agentic memory management
            )
            
            logger.info(f"Sofia Agent initialized with MCP tools from {len(self.mcp_server_commands)} servers and memory")
        except Exception as e:
            logger.error(f"Error initializing agent: {e}")
            # If initialization fails, create a basic agent with no tools
            model = OpenAIChat(id=self.model_name, api_key=self.api_key)
            self.agent = Agent(
                model=model,
                description=self.SYSTEM_INSTRUCTION
            )
            logger.info("Sofia Agent initialized with no tools (initialization failed)")

    async def cleanup(self):
        """Clean up MCP tools resources"""
        if self.mcp_tools:
            try:
                await self.mcp_tools.__aexit__(None, None, None)
                logger.info("MCP tools cleaned up")
            except Exception as e:
                logger.error(f"Error cleaning up MCP tools: {e}")

    async def add_user_memory(self, content: str, user_id: str, topics: List[str] = None) -> Optional[str]:
        """添加用户记忆，可以指定主题"""
        if not self.memory:
            logger.warning("Memory component not initialized, skipping memory creation")
            return None
            
        try:
            # Create a UserMemory object with the content and optional topics
            memory_obj = UserMemory(
                memory=content,
                topics=topics or []
            )
            
            # Add the memory to the database
            memory_id = self.memory.add_user_memory(
                memory=memory_obj,
                user_id=user_id
            )
            logger.info(f"Added memory {memory_id} for user {user_id}")
            return memory_id
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return None

    async def delete_user_memory(self, user_id: str, memory_id: str) -> bool:
        """删除特定用户记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, cannot delete memory")
            return False
            
        try:
            self.memory.delete_user_memory(user_id=user_id, memory_id=memory_id)
            logger.info(f"Deleted memory {memory_id} for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False
            
    async def replace_user_memory(self, memory_id: str, content: str, user_id: str, topics: List[str] = None) -> bool:
        """更新/替换用户记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, cannot update memory")
            return False
            
        try:
            # Create a UserMemory object with the updated content and topics
            updated_memory = UserMemory(
                memory=content,
                topics=topics or []
            )
            
            # Replace the existing memory
            self.memory.replace_user_memory(
                memory_id=memory_id,
                memory=updated_memory,
                user_id=user_id
            )
            logger.info(f"Updated memory {memory_id} for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating memory: {e}")
            return False
            
    async def clear_all_memories(self) -> bool:
        """清除所有记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, cannot clear memories")
            return False
            
        try:
            self.memory.clear()
            logger.info("Cleared all memories")
            return True
        except Exception as e:
            logger.error(f"Error clearing memories: {e}")
            return False
            
    async def clear_user_memories(self, user_id: str) -> bool:
        """清除指定用户的所有记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, cannot clear user memories")
            return False
            
        try:
            # Get all memories for the user
            memories = self.memory.get_user_memories(user_id=user_id)
            
            # Delete each memory
            for memory in memories:
                self.memory.delete_user_memory(user_id=user_id, memory_id=memory.id)
                
            logger.info(f"Cleared all memories for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing user memories: {e}")
            return False
            
    async def create_user_memory(self, content: str, user_id: str) -> Optional[str]:
        """使用Agno Memory创建用户记忆 (调用add_user_memory实现向后兼容)"""
        return await self.add_user_memory(content, user_id)

    async def get_user_memories(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户的所有记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, returning empty memories")
            return []
            
        try:
            memories = self.memory.get_user_memories(user_id)
            logger.info(f"Retrieved {len(memories)} memories for user {user_id}")
            return memories
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return []
            
    async def search_user_memories(self, query: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """基于查询语义搜索用户记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, returning empty memories")
            return []
            
        try:
            memories = self.memory.search_user_memories(
                query=query,
                limit=limit,
                retrieval_method="semantic",
                user_id=user_id
            )
            logger.info(f"Found {len(memories)} relevant memories for query '{query}'")
            return memories
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return []
            
    async def find_memories_by_topic(self, topic: str, user_id: str) -> List[Dict[str, Any]]:
        """根据主题查找用户记忆"""
        if not self.memory:
            logger.warning("Memory component not initialized, returning empty memories")
            return []
            
        try:
            # Get all memories for the user
            all_memories = self.memory.get_user_memories(user_id=user_id)
            
            # Filter memories by topic
            topic_memories = [m for m in all_memories if topic.lower() in [t.lower() for t in m.topics]]
            
            logger.info(f"Found {len(topic_memories)} memories with topic '{topic}' for user {user_id}")
            return topic_memories
        except Exception as e:
            logger.error(f"Error finding memories by topic: {e}")
            return []

    async def invoke(self, query: str, sessionId: str, user_id: str = None) -> Dict[str, Any]:
        if not self.agent:
            await self.initialize()

        if not self.agent:
            raise Exception("Agent not initialized")

<<<<<<< HEAD
        # Use agent.run() to get a complete response
        response: RunResponse = self.agent.run(query, session_id=sessionId)
        formatted_response = self._format_response(response.content if response else "")
        logger.info(f"Response for session {sessionId}: {formatted_response}")
        return formatted_response
=======
        # Create a user ID if not provided
        if not user_id:
            user_id = f"user_{sessionId}"
>>>>>>> 8ee5987 (add memory)

        try:
            # Check if this is a memory management command
            if any(keyword in query.lower() for keyword in ["forget", "remove memory", "delete memory", "clear memory"]):
                if "all" in query.lower() or "completely clear" in query.lower():
                    await self.clear_user_memories(user_id)
                    return self._format_response("I've removed all memories as requested.")
                elif "name" in query.lower():
                    # Find memories about name and delete them
                    memories = await self.search_user_memories("name", user_id)
                    for memory in memories:
                        await self.delete_user_memory(user_id, memory.id)
                    return self._format_response("I've removed memories about your name as requested.")
            
            # Use agent.run() with memory integration
            response: RunResponse = self.agent.run(
                query, 
                session_id=sessionId, 
                user_id=user_id
            )
            
            logger.info(f"SofiaAgent received query:{query}")
            logger.info(f"SofiaAgent response:{response.content if response else 'None'}")
            
            return self._format_response(response.content if response else "")
        except Exception as e:
            logger.error(f"Error in invoke: {e}")
            return {
                "is_task_complete": False,
                "require_user_input": True,
                "content": f"An error occurred while processing your request: {str(e)}"
            }

    async def stream(self, query: str, sessionId: str, user_id: str = None) -> AsyncIterable[Dict[str, Any]]:
        if not self.agent:
            await self.initialize()
            
<<<<<<< HEAD
        # Use agent.run(stream=True) to get a streaming response
        for chunk in self.agent.run(query, stream=True, session_id=sessionId):
            if chunk.tool_calls and chunk.tool_calls[-1]:
                tool_call = chunk.tool_calls[-1]
                response_chunk = {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": f"Using {tool_call.name if hasattr(tool_call, 'name') else 'unknown'} tool...",
                }
                logger.info(f"Tool call chunk for session {sessionId}: {response_chunk}")
                yield response_chunk
            elif chunk.content:
                response_chunk = {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": chunk.content,
                }
                logger.info(f"Content chunk for session {sessionId}: {response_chunk}")
                yield response_chunk
        
        # Get the final complete response
        final_response: RunResponse = self.agent.run(query, session_id=sessionId)
        formatted_response = self._format_response(final_response.content if final_response else "")
        logger.info(f"Final streaming response for session {sessionId}: {formatted_response}")
        yield formatted_response
=======
        # Create a user ID if not provided
        if not user_id:
            user_id = f"user_{sessionId}"
        
        try:
            # Check if this is a memory management command
            if any(keyword in query.lower() for keyword in ["forget", "remove memory", "delete memory", "clear memory"]):
                if "all" in query.lower() or "completely clear" in query.lower():
                    await self.clear_user_memories(user_id)
                    yield self._format_response("I've removed all memories as requested.")
                    return
                elif "name" in query.lower():
                    # Find memories about name and delete them
                    memories = await self.search_user_memories("name", user_id)
                    for memory in memories:
                        await self.delete_user_memory(user_id, memory.id)
                    yield self._format_response("I've removed memories about your name as requested.")
                    return
            
            # Use agent.run(stream=True) to get a streaming response
            for chunk in self.agent.run(
                query, 
                stream=True, 
                session_id=sessionId,
                user_id=user_id
            ):
                if chunk.tool_calls and chunk.tool_calls[-1]:
                    tool_call = chunk.tool_calls[-1]
                    content = f"Using {tool_call.name if hasattr(tool_call, 'name') else 'unknown'} tool..."
                    yield {
                        "is_task_complete": False,
                        "require_user_input": False,
                        "content": content,
                    }
                elif chunk.content:
                    yield {
                        "is_task_complete": False,
                        "require_user_input": False,
                        "content": chunk.content,
                    }
            
            # The final response is already handled in streaming
        except Exception as e:
            logger.error(f"Error in stream: {e}")
            yield {
                "is_task_complete": False,
                "require_user_input": True,
                "content": f"An error occurred while processing your request: {str(e)}"
            }
>>>>>>> 8ee5987 (add memory)
        
    def _format_response(self, result: str) -> Dict[str, Any]:
        if not result:
            response = {
                "is_task_complete": False,
                "require_user_input": True,
                "content": "We are unable to process your request at the moment. Please try again.",
            }
            logger.info(f"Empty result response: {response}")
            return response
            
        content = result
        
        # Parse the content to determine if more input is needed
        if "I need more information" in content or "Could you provide" in content:
            response = {
                "is_task_complete": False,
                "require_user_input": True,
                "content": content
            }
            logger.info(f"Need more info response: {response}")
            return response
        elif "error" in content.lower():
            response = {
                "is_task_complete": False,
                "require_user_input": True,
                "content": content
            }
            logger.info(f"Error response: {response}")
            return response
        else:
            response = {
                "is_task_complete": True,
                "require_user_input": False,
                "content": content
            }
            logger.info(f"Successful response: {response}")
            return response

# Create the general-purpose agent
sofia_agent = SofiaAgent()

async def process_message(message: Message) -> Union[str, Dict[str, Any]]:
    """Process incoming messages using the Agno-based agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Processing message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Extract user ID if available, otherwise create one
        user_id = message.user_id if hasattr(message, 'user_id') and message.user_id else f"user_{session_id}"
        
        # Use the agent to process the request
        response = await sofia_agent.invoke(text_content, session_id, user_id)
        
        # Return the response directly
        return response

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return f"Sorry, I encountered an error: {str(e)}"

async def stream_message(message: Message) -> AsyncIterable[Union[str, Dict[str, Any]]]:
    
    """Stream responses for incoming messages using the Agno-based agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Streaming response for message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Extract user ID if available, otherwise create one
        user_id = message.user_id if hasattr(message, 'user_id') and message.user_id else f"user_{session_id}"
        
        # Use the agent to stream responses for the request
        logger.info("--------------------------------")
        logger.info(f"SofiaAgent stream_message text_content:{text_content}")
        logger.info("--------------------------------")
        async for response in sofia_agent.stream(text_content, session_id, user_id):
            yield response.get('content', 'Processing...')

    except Exception as e:
        logger.error(f"Error streaming message: {e}")
        yield f"Sorry, I encountered an error: {str(e)}"

async def main():
    """Start the agent server"""
    try:
        # Initialize agent with MCP tools
        await sofia_agent.initialize()
        
        # Create task manager
        task_manager = TaskManager()
        
        # Register message handler
        task_manager.register_handler(process_message)
        
        # Register streaming handler
        task_manager.register_streaming_handler(stream_message)
        
        # Create and start server
        server = A2AServer(
            host=os.getenv("A2A_SERVER_HOST", "0.0.0.0"),
            port=int(os.getenv("A2A_SERVER_PORT", "8000")),
            agent_card=agent_card,
            task_manager=task_manager,
        )
        
        logger.info(f"Starting SOFIA General Agent on port {os.getenv('A2A_SERVER_PORT', '8000')}")
        # Use the async start method instead of the blocking one
        await server.start_async()
    finally:
        # Clean up MCP client when server stops
        await sofia_agent.cleanup()

if __name__ == "__main__":
    asyncio.run(main()) 