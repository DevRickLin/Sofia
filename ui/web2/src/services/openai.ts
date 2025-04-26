import type { A2AClient } from 'a2a-client';
import type { Dispatch, SetStateAction } from 'react';
import type { NodeData } from '../components/MindMap/types';

export const generateChatResponse = async (
  client: A2AClient,
  nodeData: NodeData,
  userQuestion: string,
  setChatHistory?: Dispatch<SetStateAction<Array<{ type: "user" | "assistant"; content: string; id: string }>>>
): Promise<string> => {
  try {
    // Prepare context from node data
    const context = JSON.stringify(nodeData);
    
    // Prepare the prompt with the node data context and user question
    const prompt = `You are an AI assistant helping with information about technological breakthroughs.
Context about the current breakthrough: ${context}
User question: ${userQuestion}`;

    // If streaming is supported, use it to update chat history incrementally
    if (setChatHistory && client.sendTaskStreaming) {
      let fullResponse = '';
      
      // Create an ID for this conversation turn
      const messageId = `assistant-stream-${Date.now()}`;
      
      // Create initial assistant message in the chat history
      setChatHistory(prev => [
        ...prev,
        { type: "assistant", content: "", id: messageId }
      ]);
      
      // Use asyncGenerator pattern with for-await-of
      const streamGenerator = client.sendTaskStreaming({ prompt });
      
      for await (const chunk of streamGenerator) {
        // Extract text content based on the type of event
        let textContent = '';
        
        // Handle TaskStatusUpdateEvent (has status with possibly a message)
        if ('status' in chunk && chunk.status) {
          const message = chunk.status.message;
          if (message?.parts && message.parts.length > 0) {
            // Look for text parts in the message
            const textParts = message.parts.filter(part => part.type === 'text');
            textContent = textParts.map(part => (part as { text: string }).text).join('');
          }
        }
        // Handle TaskArtifactUpdateEvent (has artifact with parts)
        else if ('artifact' in chunk && chunk.artifact) {
          const parts = chunk.artifact.parts;
          if (parts && parts.length > 0) {
            // Look for text parts in the artifact
            const textParts = parts.filter(part => part.type === 'text');
            textContent = textParts.map(part => (part as { text: string }).text).join('');
          }
        }
        
        fullResponse += textContent;
        
        // Update the message with the accumulated response
        setChatHistory(prev => {
          const newHistory = [...prev];
          const messageIndex = newHistory.findIndex(msg => msg.id === messageId);
          
          if (messageIndex >= 0) {
            newHistory[messageIndex].content = fullResponse;
          }
          
          return newHistory;
        });
      }
      
      return fullResponse;
    }
    
    // Use non-streaming API if streaming not available or setChatHistory not provided
    const response = await client.sendTask({ prompt });
    return response.toString();
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I apologize, but I encountered an error while processing your request.";
  }
};