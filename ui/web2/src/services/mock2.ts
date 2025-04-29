import type { A2AClient } from 'a2a-client';
import type { NodeData } from '../components/MindMap/types';

// Interface for different message types in chat history
export interface ChatMessage {
  id: string;
  type: "user" | "assistant-thinking" | "assistant-answer";
  content: string;
  cards?: ResponseCard[];
}

// Interface for response cards that can be added to the mind map
export interface ResponseCard {
  id: string;
  content: string;
  type: 'info' | 'insight' | 'summary' | 'action' | 'node';
  title?: string;
  nodeData?: NodeData;
}

// 用于每个 nodeId 的 generator 管理
const generators: Record<string, Generator<{type: string; content?: string; cards?: ResponseCard[]; nodeCard?: ResponseCard}, void, unknown>> = {};

// 生成器工厂：每次 yield 不同类型的 response
function* getChatResponseGenerator(nodeData: NodeData, userQuestion: string) {
  // 补充 mock keyInsights（如无）
  const mockKeyInsights = [
    {
      id: 'insight-1',
      content: '模型能自我反思，提升推理能力',
      implications: '有助于复杂问题的分步求解和自我修正',
      relatedTechnologies: ['Reinforcement Learning', 'Knowledge Graphs'],
      visible: true,
    },
    {
      id: 'insight-2',
      content: '小模型多步推理能力强',
      implications: '提升AI系统效率，降低算力消耗',
      relatedTechnologies: ['Model Compression', 'Efficient AI'],
      visible: true,
    },
    {
      id: 'insight-3',
      content: '自监督与符号知识图谱结合',
      implications: '实现更强的自洽性和泛化能力',
      relatedTechnologies: ['Self-supervision', 'Chain-of-Thought'],
      visible: true,
    },
  ];
  // 如果 nodeData 没有 keyInsights，则补充
  if (!nodeData.keyInsights || nodeData.keyInsights.length === 0) {
    nodeData.keyInsights = mockKeyInsights;
  }
  // 第一次 yield 普通文本
  yield {
    type: 'text',
    content: generateContextualAnswer(userQuestion, nodeData),
  };
  // 第二次 yield summary/insight/action 卡片
  yield {
    type: 'cards',
    cards: generateResponseCards(generateContextualAnswer(userQuestion, nodeData)),
  };


  // 第三次及以后 yield node 卡片

  const nodeCard: ResponseCard = {
      id: `node-card-${Date.now()}`,
      type: 'node',
      title: nodeData.title || 'AI节点',
      content: nodeData.summary || 'AI生成的节点内容',
      nodeData: {
        id: `ai-node-${Date.now()}`,
        title: nodeData.title || 'AI节点',
        summary: nodeData.summary || 'AI生成的节点内容',
        details: nodeData.details || '',
        date: nodeData.date || '',
        organization: nodeData.organization || '',
        source: nodeData.source || '',
        keyInsights: nodeData.keyInsights || [],
        position: nodeData.position || { x: 0, y: 0 },
        color: nodeData.color || 'blue',
      }
    };
   
    yield {
      type: 'node',
      nodeCard: nodeCard,
      // cards: [nodeCard]
    };
  }


export const generateChatResponse = async (
  client: A2AClient,
  nodeData: NodeData,
  userQuestion: string,
  setHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
): Promise<void> => {
  // 获取 nodeId
  const nodeId = typeof nodeData.id === 'string' ? nodeData.id : 'default-node';
  // 获取或创建 generator
  if (!generators[nodeId]) {
    generators[nodeId] = getChatResponseGenerator(nodeData, userQuestion);
  }
  const gen = generators[nodeId];

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Log the parameters to satisfy linter
  console.log("Using client:", client);
  console.log("Processing node data:", nodeData);
  // Add user message to history
  setHistory(prev => [
    ...prev,
    { 
      type: "user", 
      content: userQuestion, 
      id: `user-${Date.now()}` 
    }
  ]);
  // Simulate AI thinking with a delay
  await new Promise(resolve => setTimeout(resolve, 800));
  // Generate a thinking message based on user question
  const thinkingContent = `*I'm analyzing your question about* **"${userQuestion.substring(0, 30)}${userQuestion.length > 30 ? '...' : ''}"**\n\n_Let me process this in the context of the current node information..._`;
  // Add thinking message to history
  const thinkingId = `thinking-${Date.now()}`;
  setHistory(prev => [
    ...prev,
    { 
      type: "assistant-thinking", 
      content: thinkingContent, 
      id: thinkingId 
    }
  ]);
  // Simulate processing with another delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // 获取 generator 的下一个 response
  const { value } = gen.next();
  if (value && value.type === 'text') {
    setHistory(prev => [
      ...prev,
      { 
        type: "assistant-answer", 
        content: value.content || '', 
        id: `answer-${Date.now()}`
      }
    ]);
  } else if (value && value.type === 'cards') {
    setHistory(prev => [
      ...prev,
      {
        type: "assistant-answer",
        content: '以下是对你的问题的结构化解答：',
        id: `answer-${Date.now()}`,
        cards: value.cards
      }
    ]);
  } else if (value && value.type === 'node') {
    setHistory(prev => [
      ...prev,
      {
        type: "assistant-answer",
        content: '我为你生成了一个新节点，可以拖拽到画布中。',
        id: `answer-${Date.now()}`,
        cards: value.nodeCard ? [value.nodeCard] : []
      }
    ]);
  }
};

// Helper function to generate a contextual answer based on the query
function generateContextualAnswer(query: string, nodeData: NodeData): string {
  const lowercaseQuery = query.toLowerCase();
  let answer = '';
  
  if (lowercaseQuery.includes('what') || lowercaseQuery.includes('explain') || lowercaseQuery.includes('describe')) {
    answer = `**${nodeData.title || 'This topic'}** is a significant development in the field. ${nodeData.summary || 'It represents an important advancement that has implications across multiple domains.'}`;
  } else if (lowercaseQuery.includes('why') || lowercaseQuery.includes('reason')) {
    answer = `The significance of **${nodeData.title || 'this development'}** lies in its ability to transform how we approach problems in the field. ${nodeData.details || 'The underlying principles represent a paradigm shift in thinking.'}`; 
  } else if (lowercaseQuery.includes('how') || lowercaseQuery.includes('method') || lowercaseQuery.includes('approach')) {
    answer = `The methodology behind **${nodeData.title || 'this advancement'}** involves innovative approaches to problem-solving. ${nodeData.details || 'It combines multiple techniques to achieve breakthrough results.'}`;
  } else if (lowercaseQuery.includes('tell me about recent')) {
    answer = `Could you please clarify what kind of AI agent updates you're most interested in? For example: **1. Autonomous agents** (e.g., AutoGPT, BabyAGI) 
    2. **Multi-agent systems**
    3. **Embodied AI agents** (e.g., robotics)
    4. **AI assistants for specific domains** (e.g., customer support, healthcare)
    5. **General research breakthroughs**`;
  } 
  else if (lowercaseQuery.includes('claude 3.5')) {
    answer = `To tailor this better, could you let me know what you're most interested in regarding Claude 3.5's 'computer use'? For example: 1. **Technical implementation details**
    2. **Real-world applications and use cases**
    3. **Comparison to similar agents** (like AutoGPT or OpenAI's function calling)
    4. **Limitations and risks**
Let me know which areas you'd like me to dig into.
`;
  }
  else if (lowercaseQuery.includes('implementation details')) {
    answer = `Great, I’ll gather comprehensive information on Technical implementation details and Limitations and risks of Claude 3.5 'Computer Use' feature. Would yould like me to sumarise in key insight boxes or share a report?`;
  }
  else {
    answer = `Based on the available information about **${nodeData.title || 'this topic'}**, I can provide the following insights: ${nodeData.summary || 'This represents a significant development with wide-ranging implications.'} ${nodeData.details || ''}`;
  }
  
  return answer;
}

// Helper function to generate cards from answer content
function generateResponseCards(answerContent: string): ResponseCard[] {
  // Split the answer into sections for different card types
  const contentLength = answerContent.length;
  const firstThird = Math.floor(contentLength / 3);
  const secondThird = Math.floor(contentLength * 2 / 3);
  
  return [
    {
      id: `card-summary-${Date.now()}`,
      type: 'summary',
      title: '',
      content: `Great, I’ll gather comprehensive information on Technical implementation details and Limitations and risks of Claude 3.5 'Computer Use' feature. Would yould like me to sumarise in key insight boxes or share a report?`
    },
  ];
} 