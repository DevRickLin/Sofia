import os
import json
import pathlib
from fastmcp import FastMCP
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from openai import OpenAI

try:
    from exa_py import Exa
    EXA_AVAILABLE = True
except ImportError:
    EXA_AVAILABLE = False

# Create FastMCP app
mcp = FastMCP("Search Tool")

def get_file_path(file_name: str) -> str:
    """Get the full path to a file in the prompt directory"""
    return os.path.join(os.path.dirname(__file__), "prompt", file_name)

def talk_llm(messages=None, system_message="You are a helpful assistant.", json_mode=False):
    """
    Function to communicate with LLM, supporting single and multi-turn conversations
    
    Parameters:
        messages (list, optional): List of conversation history, each element is a dictionary containing role and content
                                  If None, default single-turn conversation is used
        system_message (str, optional): System message content, default is "You are a helpful assistant."
        json_mode (bool, optional): Whether to request JSON output format, default is False
    
    Returns:
        str: LLM's response
    """
    # Get API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not found")
    
    # Create OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Prepare message list
    if messages is None:
        # Default single-turn conversation
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": "Hello, please provide me with some help."}
        ]
    elif isinstance(messages, list) and all(isinstance(msg, str) for msg in messages):
        # If the input is a list of strings, convert it to the appropriate message format
        formatted_messages = [{"role": "system", "content": system_message}]
        for i, msg in enumerate(messages):
            role = "user" if i % 2 == 0 else "assistant"
            formatted_messages.append({"role": role, "content": msg})
        messages = formatted_messages
    elif not isinstance(messages, list) or not all(isinstance(msg, dict) and "role" in msg and "content" in msg for msg in messages):
        # Ensure system message exists
        has_system = any(msg.get("role") == "system" for msg in messages) if isinstance(messages, list) else False
        if not has_system:
            messages = [{"role": "system", "content": system_message}] + (messages if isinstance(messages, list) else [{"role": "user", "content": str(messages)}])
    
    try:
        if json_mode:
            response = client.chat.completions.create(
                model=os.environ.get("LLM_MODEL", "gpt-3.5-turbo"),
                messages=messages,
                response_format={"type": "json_object"}
            )
        else:
            # Call OpenAI API
            response = client.chat.completions.create(
                model=os.environ.get("LLM_MODEL", "gpt-3.5-turbo"),
                messages=messages
            )
        
        # Return LLM's response
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return f"Error: {str(e)}"

def _get_summary(text: str) -> str:
    """Generate a summary for the given text using LLM"""
    with open(get_file_path("get_summary.txt"), 'r', encoding='utf-8') as file:
        prompt = file.read().format(text=text)
    return talk_llm(prompt)

@mcp.tool()
def guide_user_detail(query: str) -> str:
    """
    Guide the user to provide more details about their query by asking them relevant questions.
    
    Args:
        query: The user's initial search query
        
    Returns:
        A response with questions to help narrow down the search query
    """
    with open(get_file_path("guide_user_detail.txt"), 'r', encoding='utf-8') as file:
        prompt = file.read().format(question=query)
    return talk_llm(prompt)

@mcp.tool()
def split_query_to_dimension(query: str) -> dict:
    """
    Split a query into multiple dimensions for comprehensive analysis.
    
    Args:
        query: The user's search query
        
    Returns:
        A dictionary containing different dimensions of the query and their explanations
    """
    with open(get_file_path("split_query_to_dimension.txt"), 'r', encoding='utf-8') as file:
        prompt = file.read()
    response = talk_llm(messages=query, system_message=prompt, json_mode=True)
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"error": "Failed to parse response as JSON", "response": response}

@mcp.tool()
def search_web(query: str) -> List[Dict[str, Any]]:
    """
    Search the web for information related to the query.
    
    Args:
        query: The search query
        
    Returns:
        A list of search results with URLs, titles, and text content
    """
    if not EXA_AVAILABLE:
        return [{"error": "Exa library is not available. Please install it with 'pip install exa-py'"}]
    
    exa_api_key = os.environ.get("EXA_API_KEY")
    if not exa_api_key:
        return [{"error": "EXA_API_KEY environment variable not found"}]
    
    try:
        exa = Exa(api_key=exa_api_key)
        result = exa.search_and_contents(
            query,
            text=True,
            num_results=10
        )
        
        results_json = []
        for item in result.results:
            # Only include results with text longer than 1000 characters
            if item.text and len(item.text) > 1000:
                result_item = {
                    "url": item.url,
                    "id": item.id,
                    "title": item.title,
                    "score": item.score,
                    "publishedDate": item.published_date,
                    "author": item.author,
                    "text": item.text,
                    "summary": _get_summary(item.text[:16384])
                }
                results_json.append(result_item)
        
        return results_json
    
    except Exception as e:
        return [{"error": f"Error searching web: {str(e)}"}]

if __name__ == "__main__":
    mcp.run(transport="stdio") 