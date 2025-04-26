"""
Configuration for MCP servers.

This file contains configuration for Model Context Protocol (MCP) servers
that provide tools for the agent service.
"""

# Dictionary defining MCP server configurations
# Each entry specifies a server with its transport type and connection details
MCP_SERVERS = {
    # Arithmetic server configuration
    "arithmetic": {
        "command": "python",
        "args": ["services/mcp-service/arithmetic/arithmetic_server.py"],
        "transport": "stdio",
    },
    
    # Search server configuration
    "search": {
        "command": "python",
        "args": ["services/mcp-service/search/search_server.py"],
        "transport": "stdio",
    },
    
    # Add more MCP server configurations as needed
} 