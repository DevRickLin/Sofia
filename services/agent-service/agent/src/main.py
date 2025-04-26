import logging
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any, AsyncIterable, List, Union
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage, BaseMessage
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
from langchain_mcp_adapters.client import MultiServerMCPClient
import sys

# 添加对Sofia根目录的引用
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.append(ROOT_DIR)

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

# Create memory saver for LangGraph
memory = MemorySaver()

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

class SofiaAgent:
    SYSTEM_INSTRUCTION = (
        "You are a versatile assistant with access to various tools from MCP servers. "
        "Use the tools available to you to respond to user queries and perform tasks. "
        "Be concise and informative in your responses, focusing on providing the most relevant information. "
        "If you can't complete a request with your available tools, explain what capabilities you'd need."
    )
     
    def __init__(self):
        self.model = ChatOpenAI(
            model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        # Initialize with empty tools list - all tools will come from MCP servers
        self.tools = []
        # Initialize MCP client and executor
        self.mcp_client = None
        self.executor = None

    async def initialize(self):
        """Initialize the agent with MCP tools"""
        try:
            # Initialize MCP client with server configs from common/mcp_config.py
            self.mcp_client = MultiServerMCPClient(MCP_SERVERS)
            await self.mcp_client.__aenter__()
            
            # Get MCP tools and add them to the agent's tools
            self.tools = self.mcp_client.get_tools()
            logger.info(f"Loaded {len(self.tools)} tools from MCP servers")
            
            if not self.tools:
                logger.warning("No tools were loaded from MCP servers")
            
            # Create the prompt for the OpenAI tools agent
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.SYSTEM_INSTRUCTION),
                MessagesPlaceholder(variable_name="messages"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ])
            
            # Create the OpenAI tools agent
            agent = create_openai_tools_agent(self.model, self.tools, prompt)
            
            # Create the agent executor
            self.executor = AgentExecutor(
                agent=agent,
                tools=self.tools,
                verbose=True,
                return_intermediate_steps=True
            )
            
            logger.info("Sofia Agent initialized with MCP tools")
        except Exception as e:
            logger.error(f"Error initializing MCP client: {e}")
            # If MCP initialization fails completely, create a basic executor with no tools
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a basic assistant without tools. You can only have conversations."),
                MessagesPlaceholder(variable_name="messages"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ])
            agent = create_openai_tools_agent(self.model, [], prompt)
            self.executor = AgentExecutor(
                agent=agent,
                tools=[],
                verbose=True,
                return_intermediate_steps=True
            )
            logger.info("Sofia Agent initialized with no tools (MCP failed)")

    async def cleanup(self):
        """Clean up MCP client resources"""
        if self.mcp_client:
            try:
                await self.mcp_client.__aexit__(None, None, None)
                logger.info("MCP client cleaned up")
            except Exception as e:
                logger.error(f"Error cleaning up MCP client: {e}")

    async def invoke(self, query: str, sessionId: str) -> Dict[str, Any]:
        if not self.executor:
            await self.initialize()
            
        messages = [HumanMessage(content=query)]
        result = await self.executor.ainvoke({"messages": messages})
        return self._format_response(result)

    async def stream(self, query: str, sessionId: str) -> AsyncIterable[Dict[str, Any]]:
        if not self.executor:
            await self.initialize()
            
        messages = [HumanMessage(content=query)]
        
        # Handle intermediate steps
        async for chunk in self.executor.astream({"messages": messages}):
            if "intermediate_steps" in chunk and chunk["intermediate_steps"]:
                step = chunk["intermediate_steps"][-1]
                if isinstance(step[0], dict) and "tool" in step[0]:
                    tool_name = step[0].get("tool", "unknown")
                    yield {
                        "is_task_complete": False,
                        "require_user_input": False,
                        "content": f"Using {tool_name} tool...",
                    }
        
        # Final result
        result = await self.executor.ainvoke({"messages": messages})
        yield self._format_response(result)
        
    def _format_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        if not result or "output" not in result:
            return {
                "is_task_complete": False,
                "require_user_input": True,
                "content": "We are unable to process your request at the moment. Please try again.",
            }
            
        content = result["output"]
        
        # Parse the content to determine if more input is needed
        if "I need more information" in content or "Could you provide" in content:
            return {
                "is_task_complete": False,
                "require_user_input": True,
                "content": content
            }
        elif "error" in content.lower():
            return {
                "is_task_complete": False,
                "require_user_input": True,
                "content": content
            }
        else:
            return {
                "is_task_complete": True,
                "require_user_input": False,
                "content": content
            }

# Create the general-purpose agent
sofia_agent = SofiaAgent()

async def process_message(message: Message) -> Union[str, Dict[str, Any]]:
    """Process incoming messages using the LangGraph-based agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Processing message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Use the agent to process the request
        response = await sofia_agent.invoke(text_content, session_id)
        
        # The TaskManager expects either a string (to be wrapped in a TextPart)
        # or a dictionary (to be wrapped in a DataPart)
        # Return the response directly - don't extract just the content
        return response

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return f"Sorry, I encountered an error: {str(e)}"

async def stream_message(message: Message) -> AsyncIterable[Union[str, Dict[str, Any]]]:
    """Stream responses for incoming messages using the LangGraph-based agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Streaming response for message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Use the agent to stream responses for the request
        async for response in sofia_agent.stream(text_content, session_id):
            # The TaskManager expects either a string (to be wrapped in a TextPart)
            # or a dictionary (to be wrapped in a DataPart)
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