import asyncio
import logging
import os
from dotenv import load_dotenv
from common.client import A2AClient
from common.a2a.protocol import AgentCard, AgentSkill

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """Run the demo client"""
    # Get agent URL from environment variable with default fallback
    agent_url = os.getenv("AGENT_URL", "http://localhost:8000")
    
    # Create agent card (or you could fetch it from the agent)
    agent_card = AgentCard(
        name="SOFIA Arithmetic Agent",
        description="A simple agent that can perform basic arithmetic operations",
        url=agent_url,
        version="0.1.0",
        skills=[
            AgentSkill(
                id="arithmetic",
                name="Arithmetic",
                description="Perform basic arithmetic operations (add, subtract, multiply, divide)",
                examples=[],
            )
        ],
    )
    
    # Create client
    client = A2AClient(agent_card=agent_card)
    
    # Test queries
    test_queries = [
        "What is 5 + 3?",
        "Calculate 10 * 7",
        "Divide 100 by 2",
        "What is the sum of 4, 8, and 12?",
        "Tell me a joke",  # Non-arithmetic query
    ]
    
    # Process each query
    for query in test_queries:
        try:
            logger.info(f"Sending query: {query}")
            
            # Send the query
            response = await client.send_task(query)
            
            # Check for error
            if response.error:
                logger.error(f"Error: {response.error.message}")
                continue
                
            # Process response
            if response.result and response.result.artifacts:
                for artifact in response.result.artifacts:
                    for part in artifact.parts:
                        if part.type == "text":
                            logger.info(f"Response: {part.text}")
                        elif part.type == "data":
                            logger.info(f"Data: {part.data}")
            else:
                logger.info("No artifacts in response")
                
        except Exception as e:
            logger.error(f"Error processing query: {e}")
    
    # Interactive mode
    print("\n=== Interactive Mode ===")
    print("Type your arithmetic queries (or 'exit' to quit)")
    
    while True:
        try:
            # Get user input
            user_input = input("> ")
            
            # Check for exit command
            if user_input.lower() in ("exit", "quit", "q"):
                break
                
            # Send the query
            response = await client.send_task(user_input)
            
            # Check for error
            if response.error:
                print(f"Error: {response.error.message}")
                continue
                
            # Process response
            if response.result and response.result.artifacts:
                for artifact in response.result.artifacts:
                    for part in artifact.parts:
                        if part.type == "text":
                            print(f"Agent: {part.text}")
                        elif part.type == "data":
                            print(f"Data: {part.data}")
            else:
                print("No response from agent")
                
        except Exception as e:
            print(f"Error: {e}")
    
    print("Goodbye!")

if __name__ == "__main__":
    asyncio.run(main())