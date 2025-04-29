import type { A2AClient } from 'a2a-client';
import type { Dispatch, SetStateAction } from 'react';
import type { NodeData } from '../components/MindMap/types';

export interface MockResponse {
  type: 'text' | 'mindmap' | 'error';
  content: string;
}

// Generator to manage the response sequence
function* responseGenerator() {
  // First call - clarification questions
  yield {
    type: 'text',
    content: `
Could you please clarify what kind of AI agent updates you're most interested in? For example:

**1. Autonomous agents (e.g., AutoGPT, BabyAGI)**

**2. Multi-agent systems**

**3. Embodied AI agents (e.g., robotics)**

**4. AI assistants for specific domains (e.g., customer support, healthcare)**

**5. General research breakthroughs**

Also, would you like updates from a specific time frame (e.g., past 6 months, past year)?`
  
    
  };
  
  // Second call - mind map setup
  yield {
    type: 'mindmap',
    content: 'Got it. I will look into major research breakthroughs and updates in AI agents from the past 6 months, focusing on developments in autonomous systems, multi-agent frameworks, embodied agents, and general-purpose assistants. I will gather insights from academic research, major tech company publications, and reputable AI news sources. I will update you soon with a summary of the most notable advancements.'
  };
  
  // Any subsequent calls
  while (true) {
    yield {
      type: 'text',
      content: "Is there anything specific about the AI agent breakthroughs in the mind map that you'd like me to explain further?"
    };
  }
}

// Create and store the generator instance
const responseIterator = responseGenerator();

export const generateChatResponse = async (
  client: A2AClient,
  nodeData: NodeData,
  userQuestion: string,
  setChatHistory?: Dispatch<SetStateAction<Array<{ type: "user" | "assistant"; content: string; id: string }>>>
): Promise<MockResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log the parameters to satisfy linter
  console.log("Using client:", client);
  console.log("Processing node data:", nodeData);
  
  try {
    // Get the next response from the generator
    const response = responseIterator.next().value as MockResponse;
    
    // Update chat history if setChatHistory is provided
    if (setChatHistory) {
      setChatHistory(prev => [
        ...prev,
        { type: "assistant", content: response.content, id: `assistant-${Date.now()}` }
      ]);
    }
    
    return response;
  } catch (error) {
    return {
      type: 'error',
      content: 'An error occurred while generating the response.'
    };
  }
};