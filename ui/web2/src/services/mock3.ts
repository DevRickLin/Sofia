import type { NodeData } from '../components/MindMap/types';
import type { ChatMessage } from './mock2';

// freeNode 专属 generator 管理
interface FreeNodeGenYield {
  type: 'text' | 'replace-node';
  content?: string;
  nodeData?: NodeData;
}
const generators: Record<string, Generator<FreeNodeGenYield, void, unknown>> = {};

export function* getFreeNodeChatResponseGenerator(nodeData: NodeData, userQuestion: string): Generator<FreeNodeGenYield, void, unknown> {
  // 1. yield 欢迎语
  yield {
    type: 'text' as const,
    content: 'Hi! This is a free node. Let\'s start exploring your topic!'
  };
  // 2. yield 替换节点信号
  yield {
    type: 'replace-node' as const,
    nodeData: {
      ...nodeData,
      type: 'breakthrough',
      title: userQuestion || 'AI Topic',
      summary: 'This is an auto-generated breakthrough node based on your input.',
      details: 'You can now continue the conversation as a regular node.',
      color: 'emerald',
    }
  };
  // 3. 后续 yield 普通内容
  let count = 1;
  while (true) {
    yield {
      type: 'text' as const,
      content: `This is a follow-up message #${count++} for your topic.`
    };
  }
}

export const generateFreeNodeChatResponse = async (
  nodeData: NodeData,
  userQuestion: string,
  setHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
): Promise<FreeNodeGenYield | undefined> => {
  const nodeId = typeof nodeData.id === 'string' ? nodeData.id : 'default-free-node';
  if (!generators[nodeId]) {
    generators[nodeId] = getFreeNodeChatResponseGenerator(nodeData, userQuestion);
  }
  const gen = generators[nodeId];

  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  setHistory(prev => [
    ...prev,
    { type: 'user', content: userQuestion, id: `user-${Date.now()}` }
  ]);
  await new Promise(resolve => setTimeout(resolve, 800));
  setHistory(prev => [
    ...prev,
    { type: 'assistant-thinking', content: 'Thinking...', id: `thinking-${Date.now()}` }
  ]);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 获取 generator 的下一个 response
  const { value } = gen.next();
  if (value && value.type === 'text') {
    setHistory(prev => [
      ...prev,
      { type: 'assistant-answer', content: value.content || '', id: `answer-${Date.now()}` }
    ]);
  } else if (value && value.type === 'replace-node') {
    // 返回特殊信号，供外部处理节点替换
    return value;
  }
}; 