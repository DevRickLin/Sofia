import os
from dotenv import load_dotenv
import pathlib
from utils import get_project_root, talk_llm
import requests
import json
from exa_py import Exa


load_dotenv(dotenv_path=get_project_root() / '.env')

os.environ.get("LLM_MODEL")


class Node:
    def __init__(self, node_id, node_url, node_abstract):
        self.node_id = node_id
        self.node_url = node_url
        self.node_abstract = node_abstract


class Spider:
    def __init__(self):
        self.api_key = os.environ.get("SERPAPI_KEY")
        self.base_url = "https://serpapi.com/search"
        
    def google_search(self, query, num_results=10, location="China"):
        """
        使用SerpApi进行Google搜索
        
        参数:
            query (str): 搜索关键词
            num_results (int): 返回结果数量
            location (str): 搜索位置
            
        返回:
            dict: 搜索结果
        """
        if not self.api_key:
            raise ValueError("未设置SERPAPI_KEY环境变量，请在.env文件中添加")
            
        params = {
            "engine": "google",
            "q": query,
            "api_key": self.api_key,
            "num": num_results,
            "location": location,
            "gl": "cn",
            "hl": "zh-cn"
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"搜索请求失败: {e}")
            return {"error": str(e)}
    
    def exa_search(self, query):
        EXA_API_KEY = os.environ.get("EXA_API_KEY")
        exa = Exa(api_key = EXA_API_KEY)
        result = exa.search_and_contents(
            query,
            text = { "max_characters": 1000 }
        )
        print(result)
    
    def extract_search_results(self, search_response):
        """
        从搜索响应中提取有用的搜索结果
        
        参数:
            search_response (dict): SerpApi返回的完整响应
            
        返回:
            list: 包含标题、链接和摘要的搜索结果列表
        """
        results = []
        
        # 提取有机搜索结果
        if "organic_results" in search_response:
            for result in search_response["organic_results"]:
                item = {
                    "title": result.get("title", ""),
                    "link": result.get("link", ""),
                    "snippet": result.get("snippet", "")
                }
                results.append(item)
                
        # 提取知识图谱结果
        if "knowledge_graph" in search_response:
            kg = search_response["knowledge_graph"]
            item = {
                "title": kg.get("title", ""),
                "type": kg.get("type", ""),
                "description": kg.get("description", ""),
                "link": kg.get("website", "")
            }
            results.append(item)
            
        return results

    def crawl_node(self, node_id):
        """
        爬取特定节点的内容，使用节点ID作为搜索关键词
        
        参数:
            node_id (str): 节点ID，将用作搜索关键词
            
        返回:
            Node: 包含搜索结果的节点对象
        """
        search_results = self.google_search(node_id)
        extracted_results = self.extract_search_results(search_results)
        
        if extracted_results:
            # 使用第一个结果创建节点
            first_result = extracted_results[0]
            abstract = first_result.get("snippet", "") or first_result.get("description", "")
            url = first_result.get("link", "")
            
            # 创建新节点
            node = Node(node_id=node_id, node_url=url, node_abstract=abstract)
            return node
        
        return None


class QueryTree:
    def __init__(self):
        pass

    def guide_user_detail(self, query):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'arithmetic_tool', 'algorithm','prompt', 'guide_user_detail.txt')
        with open(prompt_path, 'r') as file:
            prompt = file.read().format(question=query)
        ans = talk_llm(prompt)
        return ans

    def split_query_to_dimension(self, query):
        prompt_path = os.path.join(get_project_root(), 'mcp_tools', 'arithmetic_tool', 'algorithm','prompt', 'split_query_to_dimension.txt')
        with open(prompt_path, 'r') as file:
            prompt = file.read().format()
        ans = talk_llm(messages=query, system_message=prompt)
        return ans
    
    def save_to_database(self, node):
        self.tree.save_node(node)

    def load_node(self, node):
        self.tree.load_node(node)
        
if __name__ == "__main__":
    # mock_talk = [
    #     '''
    #     给我agent的最新进展
    #     '''
    #     ,
    #     '''
    #     为了更好地帮助您获取关于"agent"的最新进展，我需要了解一些信息：

    #     1. 您提到的"agent"具体是指哪种类型的代理？是人工智能助手（如聊天机器人）、软件代理、游戏中的角色，还是某种商业代理或中介？

    #     2. 您是对技术进展感兴趣，还是对某个特定项目或产品的更新感兴趣？

    #     3. 您希望获取什么样的"最新进展"？是近期的重大更新、性能提升、或新功能介绍，还是其他方面的信息？

    #     如果您不想回答这些问题，我可以为您提供一个通用的场景，例如，假设我们在谈论人工智能助手的最新技术进展。
    #     ''',
    #     '''
    #     1. 我提到的agent是人工智能的agent
    #     2. 我对技术进展感兴趣
    #     3. 我希望能获取最新的技术进展
    #     '''
    # ]
    # qt = QueryTree()
    # ans = qt.split_query_to_dimension(mock_talk)
    # print(ans)
    
    # 示例：使用Spider进行搜索
    spider = Spider()
    # 注意：运行此示例前需要在.env文件中设置SERPAPI_KEY
    # search_results = spider.google_search("人工智能agent最新技术")
    # print(json.dumps(spider.extract_search_results(search_results), ensure_ascii=False, indent=2))
    spider.exa_search("人工智能agent最新技术")