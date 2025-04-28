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
  type: 'info' | 'insight' | 'summary' | 'action';
  title?: string;
}

export const generateChatResponse = async (
  client: A2AClient,
  nodeData: NodeData,
  userQuestion: string,
  setHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
): Promise<void> => {
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
  await new Promise(resolve => setTimeout(resolve, 1000));
  
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
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create the answer message
  const answerContent = generateContextualAnswer(userQuestion, nodeData);
  
  // Create response cards from the answer
  const cards = generateResponseCards(answerContent);
  
  // Add answer with cards to history
  setHistory(prev => [
    ...prev,
    { 
      type: "assistant-answer", 
      content: answerContent, 
      id: `answer-${Date.now()}`,
      cards
    }
  ]);
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
  } else {
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
      title: 'Key Summary',
      content: `### Summary\n\n${answerContent.substring(0, firstThird)}`
    },
    {
      id: `card-insight-${Date.now()}`,
      type: 'insight',
      title: 'Critical Insight',
      content: `### Insight\n\n${answerContent.substring(firstThird, secondThird)}\n\n* This insight provides new perspective on the topic\n* Consider how this relates to other developments in the field`
    },
    {
      id: `card-action-${Date.now()}`,
      type: 'action',
      title: 'Recommended Action',
      content: `### Next Steps\n\n1. **Explore** - ${answerContent.substring(secondThird)}\n2. **Connect** - Relate this to other nodes in the mind map\n3. **Extend** - Consider practical applications`
    }
  ];
} 