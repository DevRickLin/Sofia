import os
from dotenv import load_dotenv
import pathlib
from utils import get_project_root, talk_llm

load_dotenv(dotenv_path=get_project_root() / '.env')

os.environ.get("LLM_MODEL")


class Node:
    def __init__(self, node_id, node_url, node_abstract):
        self.node_id = node_id
        self.node_url = node_url
        self.node_abstract = node_abstract


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
    mock_talk = [
        '''
        给我agent的最新进展
        '''
        ,
        '''
        为了更好地帮助您获取关于“agent”的最新进展，我需要了解一些信息：

        1. 您提到的“agent”具体是指哪种类型的代理？是人工智能助手（如聊天机器人）、软件代理、游戏中的角色，还是某种商业代理或中介？

        2. 您是对技术进展感兴趣，还是对某个特定项目或产品的更新感兴趣？

        3. 您希望获取什么样的“最新进展”？是近期的重大更新、性能提升、或新功能介绍，还是其他方面的信息？

        如果您不想回答这些问题，我可以为您提供一个通用的场景，例如，假设我们在谈论人工智能助手的最新技术进展。
        ''',
        '''
        1. 我提到的agent是人工智能的agent
        2. 我对技术进展感兴趣
        3. 我希望能获取最新的技术进展
        '''
    ]
    qt = QueryTree()
    ans = qt.split_query_to_dimension(mock_talk)
    print(ans)