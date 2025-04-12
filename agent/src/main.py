import logging
import asyncio
import re
from common.a2a.protocol import (
    AgentCard,
    AgentSkill,
    Message,
)
from common.server import A2AServer, TaskManager
from mcp_tools.arithmetic_tool.src.mcp_client import ArithmeticToolClient

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the agent card
agent_card = AgentCard(
    name="SOFIA Arithmetic Agent",
    description="A simple agent that can perform basic arithmetic operations",
    url="http://localhost:8000",
    version="0.1.0",
    skills=[
        AgentSkill(
            id="arithmetic",
            name="Arithmetic",
            description="Perform basic arithmetic operations (add, subtract, multiply, divide)",
            examples=[
                "What is 5 + 3?",
                "Calculate 10 * 7",
                "Divide 100 by 2",
                "What is the sum of 4, 8, and 12?",
            ],
        )
    ],
)

# Create arithmetic tool client
arithmetic_client = ArithmeticToolClient(base_url="http://localhost:5001")

# Pattern to detect arithmetic expressions
ARITHMETIC_PATTERN = re.compile(r'(add|sum|plus|\+|subtract|minus|\-|multiply|product|times|\*|divide|quotient|by|\/)', re.IGNORECASE)

async def process_message(message: Message) -> str:
    """Process incoming messages and respond accordingly"""
    try:
        # Extract text from message parts
        text_content = ""
        for part in message.parts:
            if part.type == "text":
                text_content += part.text

        logger.info(f"Processing message: {text_content}")

        # Check if message contains arithmetic expressions
        if ARITHMETIC_PATTERN.search(text_content) and re.search(r'\d', text_content):
            # Use arithmetic tool for calculation
            try:
                # Call the arithmetic tool
                result = await arithmetic_client.calculate(text_content)
                
                # Format response
                operation_names = {
                    "add": "addition",
                    "subtract": "subtraction",
                    "multiply": "multiplication",
                    "divide": "division"
                }
                
                operation_name = operation_names.get(result["operation"], result["operation"])
                number_str = ", ".join(str(n) for n in result["numbers"])
                
                return f"The result of the {operation_name} operation on {number_str} is {result['result']}."
                
            except Exception as e:
                logger.error(f"Error using arithmetic tool: {e}")
                return f"Sorry, I encountered an error while trying to calculate: {str(e)}"
        else:
            # Handle non-arithmetic queries
            return "I'm an arithmetic agent. Please ask me to perform basic calculations like addition, subtraction, multiplication, or division."

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
        host="0.0.0.0",
        port=8000,
        agent_card=agent_card,
        task_manager=task_manager,
    )
    
    logger.info("Starting SOFIA Arithmetic Agent on port 8000")
    # Use the async start method instead of the blocking one
    await server.start_async()

if __name__ == "__main__":
    asyncio.run(main()) 