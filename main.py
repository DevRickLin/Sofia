import asyncio
from dotenv import load_dotenv
from core.agent import create_hello_agent
from tool.hello_server import mcp

async def main():
    """Main entry point for the application."""
    # Load environment variables
    load_dotenv()
    
    # Start the MCP server
    async with mcp.run_server():
        # Create and run the agent
        async with create_hello_agent() as agent:
            # Invoke the tool with a parameter
            result = await agent.ainvoke({"input": "Alice"})
            print(result["output"]) 