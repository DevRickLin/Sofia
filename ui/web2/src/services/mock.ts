import type { A2AClient } from 'a2a-client';
import type { Dispatch, SetStateAction } from 'react';
import type { NodeData } from '../components/MindMap/types';

// Generator to manage the response sequence
function* responseGenerator() {
  // First call - clarification questions
  yield `To better address your question about recent AI agent technology breakthroughs, I need to clarify a few key aspects:

1. Domain Focus: Are you interested in a specific application area (e.g., robotics, healthcare, customer service) or general advancements in AI agents?
2. Timeframe: How recent? The last 6 months, 1 year, or a broader period?
3. Technical Depth: Do you want high-level summaries (e.g., "AI agents can now do X") or detailed technical insights (e.g., architectures like Mixture of Experts)?
4. Type of Breakthrough: Are you looking for improvements in capabilities (e.g., planning, tool use), scalability, or real-world deployments?

If you'd prefer not to specify, I'll assume a general scenario—covering notable advances in the past year across capabilities like multi-agent collaboration, memory/context handling, and real-world integration.`;
  
  // Second call - mind map setup
  yield "Thank you for providing those details. I've set up a mind map with recent AI agent technology breakthroughs based on your preferences. You can now explore the different nodes to learn more about each breakthrough.";
  
  // Any subsequent calls
  while (true) {
    yield "Is there anything specific about the AI agent breakthroughs in the mind map that you'd like me to explain further?";
  }
}

// Create and store the generator instance
const responseIterator = responseGenerator();

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
  
  // Get the next response from the generator
  const response = responseIterator.next().value as string;
  
  // Update chat history if setChatHistory is provided
  if (setChatHistory) {
    setChatHistory(prev => [
      ...prev,
      { type: "assistant", content: response, id: `assistant-${Date.now()}` }
    ]);
  }
  
  return response;
};