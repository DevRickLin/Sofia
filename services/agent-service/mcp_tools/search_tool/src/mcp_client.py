import os
from dotenv import load_dotenv
import pathlib
from tool import get_project_root, talk_llm
import requests
import json
# from exa_py import Exa


load_dotenv(dotenv_path=get_project_root() / '.env')

# # Load environment variables
# load_dotenv()

# Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

class SearchToolClient:
    """Client for the search tool service"""
    
    def __init__(self, base_url: str = None):
        # """Initialize the client with the service URL"""
        # self.base_url = base_url or os.getenv("SEARCH_TOOL_URL", "http://localhost:5002")
        # self.operate_url = f"{self.base_url}/operate"
        pass
    
    def guide_user_detail(self, query):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'search_tool','src', 'prompt', 'guide_user_detail.txt')
        with open(prompt_path, 'r', encoding='utf-8') as file:
            prompt = file.read().format(question=query)
        ans = talk_llm(prompt)
        return ans

    def split_query_to_dimension(self, query):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'arithmetic_tool', 'algorithm','prompt', 'split_query_to_dimension.txt')
        with open(prompt_path, 'r',encoding='utf-8') as file:
            prompt = file.read().format()
        ans = talk_llm(messages=query, system_message=prompt)
        return ans

if __name__ == "__main__":
    client = SearchToolClient()
    print(client.guide_user_detail("who are you?"))
    print(client.split_query_to_dimension("你好"))

