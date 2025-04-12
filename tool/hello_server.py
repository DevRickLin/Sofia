from mcp.server.fastmcp import FastMCP

mcp = FastMCP("HelloWorld")

@mcp.tool()
def hello_world(name: str = "world") -> str:
    """Returns a greeting."""
    return f"Hello, {name}!" 