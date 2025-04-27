import type { A2AClient } from 'a2a-client';
import type { Dispatch, SetStateAction } from 'react';
import type { NodeData } from '../components/MindMap/types';

export const generateChatResponse = async (
  client: A2AClient,
  nodeData: NodeData,
  userQuestion: string,
  setChatHistory?: Dispatch<SetStateAction<Array<{ type: "user" | "assistant"; content: string; id: string }>>>
): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log the parameters to satisfy linter
  console.log("Using client:", client);
  console.log("Processing node data:", nodeData);
  
  // Check if this is likely a second message (we'll look at the history length if setChatHistory is available)
  let isSecondMessage = false;
  if (setChatHistory) {
    setChatHistory(prev => {
      // Check if this will be the second user message
      isSecondMessage = prev.filter(msg => msg.type === "user").length === 1;
      return prev;
    });
  }
  
  // For demonstration, check if question is about AI agent technology
  const isAboutAIAgent = userQuestion.toLowerCase().includes('ai agent') || 
                        userQuestion.toLowerCase().includes('agent technology');
  
  // Special handling for the second message - initialize default nodes
  if (isSecondMessage) {
    const secondMessageResponse = "Thank you for your second message! I've initialized the mind map with some AI agent breakthroughs for you to explore. Feel free to ask me any questions about the content or how to work with the map.";
    
    if (setChatHistory) {
      setChatHistory(prev => [
        ...prev,
        { type: "assistant", content: secondMessageResponse, id: `assistant-${Date.now()}` }
      ]);
    }
    
    return secondMessageResponse;
  }
  
  // If related to AI agents, first ask clarification questions
  if (isAboutAIAgent && setChatHistory) {
    const clarificationQuestions = [
      "Could you specify which aspect of AI agent technology you're interested in?",
      "Are you looking for recent research papers or practical applications?",
      "Would you like to know about specific companies working on AI agents?"
    ];
    
    // Add clarification questions to chat history
    const randomQuestion = clarificationQuestions[Math.floor(Math.random() * clarificationQuestions.length)];
    setChatHistory(prev => [
      ...prev,
      { type: "assistant", content: randomQuestion, id: `assistant-${Date.now()}` }
    ]);
    
    return randomQuestion;
  }
  
  // Default response if not about AI agents or if setChatHistory is not provided
  const defaultResponse = `I'm a mock AI assistant. This is a simulated response to your question: "${userQuestion}". In a real application, I would provide a helpful answer based on the context.`;
  
  // Add the response to chat history if setChatHistory is provided
  if (setChatHistory) {
    setChatHistory(prev => [
      ...prev,
      { type: "assistant", content: defaultResponse, id: `assistant-${Date.now()}` }
    ]);
  }
  
  return defaultResponse;
};