import pathlib

def get_project_root():
    """
    Get the root directory path of the project
    
    Returns:
        pathlib.Path: Path object of the project root directory
    """
    # Get the path of the current file
    current_file = pathlib.Path(__file__).resolve()
    
    # Search upwards from the current file until finding a directory containing .git or .env files
    # This typically indicates the project root directory
    for parent in current_file.parents:
        if (parent / '.git').exists() or (parent / '.env').exists():
            return parent
    
    # If no clear indicator is found, return the parent directory of the current file's directory
    # This is a fallback option and may not be accurate
    return current_file.parent.parent.parent.parent

def talk_llm(messages=None, system_message="You are a helpful assistant.",json_mode=False):
    """
    Function to communicate with LLM, supporting single and multi-turn conversations
    
    Parameters:
        messages (list, optional): List of conversation history, each element is a dictionary containing role and content
                                  If None, default single-turn conversation is used
        system_message (str, optional): System message content, default is "You are a helpful assistant."
    
    Returns:
        str: LLM's response
    """
    import os
    from openai import OpenAI
    
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