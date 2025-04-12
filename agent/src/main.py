import logging
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any, AsyncIterable, List
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage, BaseMessage
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
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
    name="SOFIA Arithmetic Agent",
    description="A smart agent that can perform arithmetic operations using LLM",
    url=f"http://{os.getenv('A2A_SERVER_HOST', '0.0.0.0')}:{os.getenv('A2A_SERVER_PORT', '8000')}",
    version="0.2.0",
    skills=[
        AgentSkill(
            id="arithmetic",
            name="Arithmetic",
            description="Perform arithmetic operations (add, subtract, multiply, divide)",
            examples=[
                "What is 5 + 3?",
                "Calculate 10 * 7",
                "Divide 100 by 2",
                "What is the sum of 4, 8, and 12?",
            ],
        )
    ],
)

@tool
def calculate(expression: str):
    """Use this to calculate arithmetic expressions.
    
    Args:
        expression: The arithmetic expression to calculate.
        
    Returns:
        The result of the calculation or an error message.
    """
    try:
        # Simple arithmetic evaluation with basic security checks
        # In a real implementation, you'd want a more secure approach
        if any(keyword in expression for keyword in ['import', 'eval', 'exec', 'open', '__']):
            return {"error": "Invalid expression: contains forbidden keywords"}
        
        # Safe evaluation of arithmetic expression
        # Remove any non-arithmetic characters
        clean_expr = ''.join(c for c in expression if c.isdigit() or c in '+-*/().% ')
        result = eval(clean_expr)
        return {
            "expression": clean_expr,
            "result": result
        }
    except Exception as e:
        return {"error": f"Failed to calculate: {str(e)}"}

class ArithmeticAgent:
    SYSTEM_INSTRUCTION = (
        "You are a specialized assistant for arithmetic calculations. "
        "Your purpose is to help users solve arithmetic problems. "
        "Use the 'calculate' tool for any calculations. "
        "If the user asks about anything other than arithmetic calculations, "
        "politely state that you can only assist with arithmetic queries."
    )
     
    def __init__(self):
        self.model = ChatOpenAI(
            model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.tools = [calculate]

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

    def invoke(self, query: str, sessionId: str) -> Dict[str, Any]:
        messages = [HumanMessage(content=query)]
        result = self.executor.invoke({"messages": messages})
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
                        "content": "Calculating...",
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

# Create the arithmetic agent
arithmetic_agent = ArithmeticAgent()

async def process_message(message: Message) -> str:
    """Process incoming messages using the LangGraph-based arithmetic agent"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Processing message: {text_content}")

        # Generate a session ID based on message
        session_id = f"session_{hash(text_content)}"
        
        # Use the arithmetic agent to process the request
        response = arithmetic_agent.invoke(text_content, session_id)
        
        return response["content"]

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return f"Sorry, I encountered an error: {str(e)}"

async def main():
    """Start the agent server"""
    # Create task manager
    task_manager = TaskManager()
    
    # Register message handler
    task_manager.register_handler(process_message)
    
    # Create and start server
    server = A2AServer(
        host=os.getenv("A2A_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("A2A_SERVER_PORT", "8000")),
        agent_card=agent_card,
        task_manager=task_manager,
    )
    
    logger.info(f"Starting SOFIA Arithmetic Agent on port {os.getenv('A2A_SERVER_PORT', '8000')}")
    # Use the async start method instead of the blocking one
    await server.start_async()

if __name__ == "__main__":
    asyncio.run(main()) 