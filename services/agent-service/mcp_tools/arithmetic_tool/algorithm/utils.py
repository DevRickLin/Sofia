import pathlib

def get_project_root():
    """
    获取项目的根目录路径
    
    返回:
        pathlib.Path: 项目根目录的路径对象
    """
    # 获取当前文件的路径
    current_file = pathlib.Path(__file__).resolve()
    
    # 从当前文件开始向上查找，直到找到包含.git或.env文件的目录
    # 这通常表示项目的根目录
    for parent in current_file.parents:
        if (parent / '.git').exists() or (parent / '.env').exists():
            return parent
    
    # 如果没有找到明确的标志，则返回当前文件所在目录的父目录
    # 这是一个备选方案，可能不准确
    return current_file.parent.parent.parent.parent

def talk_llm(messages=None, system_message="你是一个有帮助的助手。",json_mode=False):
    """
    与LLM进行对话的函数，支持单轮和多轮对话
    
    参数:
        messages (list, optional): 对话历史记录列表，每个元素为包含role和content的字典
                                  如果为None，则使用默认的单轮对话
        system_message (str, optional): 系统消息内容，默认为"你是一个有帮助的助手。"
    
    返回:
        str: LLM的响应
    """
    import os
    from openai import OpenAI
    
    # 获取API密钥
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("未找到OPENAI_API_KEY环境变量")
    
    # 创建OpenAI客户端
    client = OpenAI(api_key=api_key)
    
    # 准备消息列表
    if messages is None:
        # 默认单轮对话
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": "你好，请给我一些帮助。"}
        ]
    elif isinstance(messages, list) and all(isinstance(msg, str) for msg in messages):
        # 如果传入的是字符串列表，将其转换为适当的消息格式
        formatted_messages = [{"role": "system", "content": system_message}]
        for i, msg in enumerate(messages):
            role = "user" if i % 2 == 0 else "assistant"
            formatted_messages.append({"role": role, "content": msg})
        messages = formatted_messages
    elif not isinstance(messages, list) or not all(isinstance(msg, dict) and "role" in msg and "content" in msg for msg in messages):
        # 确保系统消息存在
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
            # 调用OpenAI API
            response = client.chat.completions.create(
                model=os.environ.get("LLM_MODEL", "gpt-3.5-turbo"),
                messages=messages
            )
        
        # 返回LLM的响应
        return response.choices[0].message.content
    except Exception as e:
        print(f"调用OpenAI API时出错: {e}")
        return f"错误: {str(e)}"