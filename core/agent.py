from contextlib import asynccontextmanager
from langgraph.graph import Graph
from langchain_openai import ChatOpenAI
from mcp.server.fastmcp import FastMCP

@asynccontextmanager
async def create_hello_agent():
    """Creates a LangGraph agent connected to the Hello World MCP server."""
    # Initialize the language model
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0
    )
    
    # Create a simple graph with one node
    workflow = Graph()
    
    # Add the single node that calls the model
    workflow.add_node("agent", lambda x: {"output": llm.invoke(x["input"])})
    
    # Set the entry point
    workflow.set_entry_point("agent")
    
    # Compile the graph
    agent = workflow.compile()
    
    try:
        yield agent
    finally:
        # Cleanup code here if needed
        pass 