import os
from dotenv import load_dotenv
import pathlib
from tool import get_project_root, talk_llm
import requests
import json
from exa_py import Exa


load_dotenv(dotenv_path=get_project_root() / '.env')

# # Load environment variables
# load_dotenv()

# Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)




class SearchToolClient:
    """Client for the search tool service"""
    
    def __init__(self, base_url: str = None):
        """Initialize the client with the service URL"""
        self.base_url = base_url or os.getenv("SEARCH_TOOL_URL", "http://localhost:5002")
        self.operate_url = f"{self.base_url}/operate"
        # pass
    
    def _get_summary(self, text):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'search_tool', 'src', 'prompt', 'get_summary.txt')
        with open(prompt_path, 'r', encoding='utf-8') as file:
            prompt = file.read().format(text=text)
        ans = talk_llm(prompt)
        return ans
    
    def guide_user_detail(self, query):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'search_tool','src', 'prompt', 'guide_user_detail.txt')
        with open(prompt_path, 'r', encoding='utf-8') as file:
            prompt = file.read().format(question=query)
        ans = talk_llm(prompt)
        return ans

    def split_query_to_dimension(self, query):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'search_tool', 'src','prompt', 'split_query_to_dimension.txt')
        with open(prompt_path, 'r',encoding='utf-8') as file:
            prompt = file.read().format()
        ans = talk_llm(messages=query, system_message=prompt)
        return ans

    def search_website(self, query):
        exa = Exa(api_key = os.getenv("EXA_API_KEY"))
        result = exa.search_and_contents(
            query,
            text=True,
            num_results=10
        )
        
        # Convert SearchResponse to JSON
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
                    "summary": self._get_summary(item.text[:16384])
                }
                results_json.append(result_item)
        result = json.dumps(results_json)
        result_path = os.path.join(get_project_root(), 'mcp_tools', 'search_tool', 'src', 'result.json')
        with open(result_path, 'w', encoding='utf-8') as file:
            file.write(result)
        return result
if __name__ == "__main__":
    client = SearchToolClient()
    # print(client.guide_user_detail("who are you?"))
    # print(client.split_query_to_dimension("你好"))
    print(client.search_exa("what is the ai breakpoint recently?"))
