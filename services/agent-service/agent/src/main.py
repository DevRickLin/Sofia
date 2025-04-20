import logging
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any, AsyncIterable, List, Union
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage, BaseMessage
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
import sys
# 添加对Sofia根目录的引用
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))
from common.a2a.protocol import (
    AgentCard,
    AgentSkill,
    Message,
)
from common.server import A2AServer, TaskManager

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create memory saver for LangGraph
memory = MemorySaver()

# Create the agent card
agent_card = AgentCard(
    name="SOFIA Search Agent",
    description="A smart agent that can perform internet searches to answer questions",
    url=f"http://{os.getenv('A2A_SERVER_HOST', '0.0.0.0')}:{os.getenv('A2A_SERVER_PORT', '8000')}",
    version="0.1.0",
    skills=[
        AgentSkill(
            id="search",
            name="Search",
            description="Search the internet for information",
            examples=[
                "Who is the president of United States?",
                "What is the capital of France?",
                "Find information about climate change",
                "Search for recent news about AI developments",
            ],
        )
    ],
)

@tool
async def search(query: str):
    """Use this to search for information on the internet.
    
    Args:
        query: The search query.
        
    Returns:
        The search results.
    """
    try:
        # This is a mock implementation - in a real application, you would 
        # connect to an actual search API
        logger.info(f"Searching for: {query}")
        
        # Simulate some delay to mimic a real search
        await asyncio.sleep(1)
        
        # Return mock search results based on query keywords
        if "president" in query.lower() and "united states" in query.lower():
            return "Joe Biden is the current President of the United States, serving since January 20, 2021."
        elif "capital" in query.lower() and "france" in query.lower():
            return "Paris is the capital of France."
        elif "climate change" in query.lower():
            return "Climate change refers to long-term shifts in temperatures and weather patterns, mainly caused by human activities, especially the burning of fossil fuels."
        elif "ai" in query.lower() or "artificial intelligence" in query.lower():
            return "Recent AI developments include advancements in large language models, multimodal AI systems, and AI regulation frameworks across various countries."
        else:
            return f"Search results for: {query}\n- This is a mock search result.\n- In a production environment, this would connect to a real search API.\n- The query would return relevant information from the internet."
    except Exception as e:
        logger.error(f"Error searching for information: {e}")
        return {"error": f"Failed to search: {str(e)}"}

class SearchAgent:
    SYSTEM_INSTRUCTION = (
        "You are a specialized assistant for internet searches. "
        "Your purpose is to help users find information by searching the internet. "
        "Use the 'search' tool to look up information. "
        "Be concise and informative in your responses, focusing on providing the most relevant information. "
        "If the search doesn't return useful results, suggest refining the search query."
    )
     
    def __init__(self):
        self.model = ChatOpenAI(
            model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.tools = [search]

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

    async def invoke(self, query: str, sessionId: str) -> Dict[str, Any]:
        messages = [HumanMessage(content=query)]
        result = await self.executor.ainvoke({"messages": messages})
        return self._format_response(result)

    async def stream(self, query: str, sessionId: str) -> AsyncIterable[Dict[str, Any]]:
        messages = [HumanMessage(content=query)]
        
        # Handle intermediate steps
        async for chunk in self.executor.astream({"messages": messages}):
            if "intermediate_steps" in chunk and chunk["intermediate_steps"]:
                step = chunk["intermediate_steps"][-1]
                if isinstance(step[0], dict) and "tool" in step[0]:
                    yield {
                        "is_task_complete": False,
                        "require_user_input": False,
                        "content": "Searching...",
                    }
        
        # Final result
        result = await self.executor.ainvoke({"messages": messages})
        yield self._format_response(result)
        
    def _format_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        if not result or "output" not in result:
            return {
                "is_task_complete": False,
                "require_user_input": True,
                "content": "We are unable to process your search request at the moment. Please try again.",
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

# Create the search agent
search_agent = SearchAgent()

async def process_message(message: Message) -> Union[str, Dict[str, Any]]:
    """Process incoming messages using the LangGraph-based search agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Processing message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Use the search agent to process the request
        response = await search_agent.invoke(text_content, session_id)
        
        # The TaskManager expects either a string (to be wrapped in a TextPart)
        # or a dictionary (to be wrapped in a DataPart)
        # Return the response directly - don't extract just the content
        return response

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return f"Sorry, I encountered an error: {str(e)}"

async def stream_message(message: Message) -> AsyncIterable[Union[str, Dict[str, Any]]]:
    """Stream responses for incoming messages using the LangGraph-based search agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Streaming response for message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Use the search agent to stream responses for the request
        async for response in search_agent.stream(text_content, session_id):
            # The TaskManager expects either a string (to be wrapped in a TextPart)
            # or a dictionary (to be wrapped in a DataPart)
            yield response.get('content', 'Processing...')

    except Exception as e:
        logger.error(f"Error streaming message: {e}")
        yield f"Sorry, I encountered an error: {str(e)}"

async def main():
    """Start the agent server"""
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
    
    logger.info(f"Starting SOFIA Search Agent on port {os.getenv('A2A_SERVER_PORT', '8000')}")
    # Use the async start method instead of the blocking one
    await server.start_async()

if __name__ == "__main__":
    asyncio.run(main()) 