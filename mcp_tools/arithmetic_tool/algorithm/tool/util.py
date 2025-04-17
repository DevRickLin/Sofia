import os.path
import sys
from pathlib import Path
import pathlib
import httpx
import re
import os
from dotenv import load_dotenv
from openai import OpenAI
# 加载环境变量
load_dotenv()

# 获取项目根目录路径
BASE_DIR = str(Path(__file__).resolve().parent.parent)
sys.path.append(BASE_DIR)

def _talk_gpt(text_list: list):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_BASE_URL")

    client = OpenAI(api_key=api_key, base_url=api_base)

    message = []
    message.append({"role": "system", "content": "You are a helpful assistant."})
    for i, text in enumerate(text_list):
        if i % 2 == 0:
            role = "user"
        else:
            role = "assistant"
        message.append({"role": role, "content": text})
    # print(message)
    completion = client.chat.completions.create(
        model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
        # model="gpt-3.5-turbo",
        # stream: False,
        messages=message,
    )
    return completion.choices[0].message.content

def _talk_gpt_json(text_list: list):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_BASE_URL")

    client = OpenAI(api_key=api_key, base_url=api_base)

    message = []
    message.append({"role": "system", "content": "You are a helpful assistant."})
    for i, text in enumerate(text_list):
        if i % 2 == 0:
            role = "user"
        else:
            role = "assistant"
        message.append({"role": role, "content": text})
    # print(message)
    completion = client.chat.completions.create(
        model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
        # model="gpt-3.5-turbo",
        # stream: False,
        messages=message,
        response_format={"type": "json_object"}
    )
    return completion.choices[0].message.content


def talk_llm(text_list, llm_name=os.getenv("LLM_NAME", "openai"),json_mode=False):

    if llm_name == "openai":
        if json_mode:
            result = _talk_gpt_json(text_list)
        else:
            result = _talk_gpt(text_list)
    else:
        raise ValueError("Invalid LLM name.")

    return result




if __name__ == "__main__":
    file_path = r"E:\E盘我的cursor项目\Sofia\mcp_tools\arithmetic_tool\algorithm\data\tt.txt"
    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()
    # 读取prompt文件
    prompt_path = r"E:\E盘我的cursor项目\Sofia\mcp_tools\arithmetic_tool\algorithm\prompt\eval_quality.txt"

    with open(prompt_path, "r", encoding="utf-8") as prompt_file:
        prompt = prompt_file.read().format(artical=text)

    # except FileNotFoundError:
    #     print(f"警告: prompt文件未找到: {prompt_path}")
    ans = talk_llm([prompt])
    print(ans)
