export const generateChatResponse = async (nodeData: any, question: string) => {
  try {
    // In a real implementation, this would make an API call to OpenAI
    // For now, we'll return a simulated response based on the node data
    const response = `Based on the ${nodeData.title || nodeData.label}, ${question}
    
Here's what we know from the available information:
${nodeData.details || nodeData.description}

This breakthrough was developed by ${nodeData.organization} in ${nodeData.date}.`;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return response;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};