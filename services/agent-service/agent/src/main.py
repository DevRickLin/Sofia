import logging
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any, AsyncIterable, List, Union, Iterator
from pydantic import BaseModel
import sys

# 添加对Sofia根目录的引用
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.append(ROOT_DIR)

# Import Agno libraries
from agno.agent import Agent, RunResponse
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MultiMCPTools

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

class SofiaAgent:
    SYSTEM_INSTRUCTION = (
        "You are a versatile assistant with access to various tools from MCP servers. "
        "Use the tools available to you to respond to user queries and perform tasks. "
        "Be concise and informative in your responses, focusing on providing the most relevant information. "
        "If you can't complete a request with your available tools, explain what capabilities you'd need."
    )
     
    def __init__(self):
        self.model_name = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.agent = None
        self.mcp_tools = None
        
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
            # If no MCP server commands were found, create a basic agent
            if not self.mcp_server_commands:
                logger.warning("No MCP servers configured, creating basic agent without tools")
                self.agent = Agent(
                    model=OpenAIChat(id=self.model_name, api_key=self.api_key),
                    description="You are a basic assistant without tools. You can only have conversations."
                )
                return
                
            # Initialize MultiMCPTools with the server commands
            self.mcp_tools = MultiMCPTools(self.mcp_server_commands)
            await self.mcp_tools.__aenter__()
            
            # Create Agno agent with MCP tools
            self.agent = Agent(
                model=OpenAIChat(id=self.model_name, api_key=self.api_key),
                description=self.SYSTEM_INSTRUCTION,
                tools=[self.mcp_tools],
                show_tool_calls=True
            )
            
            logger.info(f"Sofia Agent initialized with MCP tools from {len(self.mcp_server_commands)} servers")
        except Exception as e:
            logger.error(f"Error initializing MCP tools: {e}")
            # If MCP initialization fails, create a basic agent with no tools
            self.agent = Agent(
                model=OpenAIChat(id=self.model_name, api_key=self.api_key),
                description="You are a basic assistant without tools. You can only have conversations."
            )
            logger.info("Sofia Agent initialized with no tools (MCP failed)")

    async def cleanup(self):
        """Clean up MCP tools resources"""
        if self.mcp_tools:
            try:
                await self.mcp_tools.__aexit__(None, None, None)
                logger.info("MCP tools cleaned up")
            except Exception as e:
                logger.error(f"Error cleaning up MCP tools: {e}")

    async def invoke(self, query: str, sessionId: str) -> Dict[str, Any]:
        if not self.agent:
            await self.initialize()

        if not self.agent:
            raise Exception("Agent not initialized")

        # Use agent.run() to get a complete response
        response: RunResponse = self.agent.run(query, session_id=sessionId)
        formatted_response = self._format_response(response.content if response else "")
        logger.info(f"Response for session {sessionId}: {formatted_response}")
        return formatted_response

    async def stream(self, query: str, sessionId: str) -> AsyncIterable[Dict[str, Any]]:
        if not self.agent:
            await self.initialize()
            
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
        
        # Use the agent to process the request
        response = await sofia_agent.invoke(text_content, session_id)
        
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
        
        # Use the agent to stream responses for the request
        async for response in sofia_agent.stream(text_content, session_id):
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