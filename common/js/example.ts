/**
 * A2A Client Example Usage
 */
import { A2AClient, TaskState } from './client';

/**
 * Example 1: Simple text message
 */
async function sendSimpleTextMessage() {
  try {
    // Initialize client with agent URL
    const client = new A2AClient(null, 'https://agent-endpoint.example.com/api');

    // Send a simple text message
    const task = await client.sendTask('Hello, agent. What can you do?');
    console.log('Task ID:', task.id);
    console.log('Task Status:', task.status.state);
    
    if (task.status.message) {
      console.log('Agent Response:', task.status.message.parts
        .filter(part => part.type === 'text')
        .map(part => (part.type === 'text' ? part.text : ''))
        .join('\n'));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Complex message with multiple parts
 */
async function sendComplexMessage() {
  try {
    // Initialize client with agent URL
    const client = new A2AClient(null, 'https://agent-endpoint.example.com/api');

    // Create message parts
    const textPart = client.createTextPart('Please analyze this data:');
    const dataPart = client.createDataPart({
      temperature: 25.5,
      humidity: 65,
      pressure: 1013.2,
      timestamp: new Date().toISOString()
    });

    // Create message with multiple parts
    const message = client.createMessage('user', [textPart, dataPart]);

    // Send the message
    const task = await client.sendTask(message);
    console.log('Task ID:', task.id);
    console.log('Task Status:', task.status.state);
    
    // Check for artifacts
    if (task.artifacts && task.artifacts.length > 0) {
      console.log('Artifacts:');
      for (const artifact of task.artifacts) {
        console.log(`- ${artifact.name || 'Unnamed'}: ${
          artifact.parts
            .filter(part => part.type === 'text')
            .map(part => (part.type === 'text' ? part.text : ''))
            .join('\n')
        }`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Streaming response
 */
async function streamingExample() {
  try {
    // Initialize client with agent URL
    const client = new A2AClient(null, 'https://agent-endpoint.example.com/api');
    
    // Use streaming API to get real-time updates
    const streamingIterator = client.sendTaskStreaming('Generate a report about climate change');
    
    let taskId: string | undefined;
    let finalState = false;
    
    for await (const update of streamingIterator) {
      // Store task ID from first update
      taskId = taskId || update.id;
      
      // Print status updates
      if ('status' in update) {
        console.log(`Task ${update.id} - Status: ${update.status.state}`);
        
        if (update.status.message) {
          console.log('Message:', update.status.message.parts
            .filter(part => part.type === 'text')
            .map(part => (part.type === 'text' ? part.text : ''))
            .join('\n'));
        }
        
        // Check if this is the final update
        if (update.final) {
          finalState = true;
          console.log('Task completed!');
        }
      }
      
      // Print artifact updates
      if ('artifact' in update) {
        console.log(`Task ${update.id} - New artifact:`, 
          update.artifact.name || 'Unnamed',
          update.artifact.parts
            .filter(part => part.type === 'text')
            .map(part => (part.type === 'text' ? part.text : ''))
            .join('\n')
        );
      }
    }
    
    // If we have a task ID and it completed, fetch the final result
    if (taskId && finalState) {
      console.log('Getting final task result...');
      const finalTask = await client.getTask(taskId);
      console.log('Final status:', finalTask.status.state);
      console.log('History length:', finalTask.history?.length || 0);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Get an existing task
 */
async function getExistingTask() {
  try {
    // Initialize client with agent URL
    const client = new A2AClient(null, 'https://agent-endpoint.example.com/api');
    
    // Get an existing task by ID
    const task = await client.getTask('task-id-123456');
    
    console.log('Task status:', task.status.state);
    
    // Print conversation history if available
    if (task.history && task.history.length > 0) {
      console.log('Conversation:');
      for (const message of task.history) {
        console.log(`${message.role}:`, message.parts
          .filter(part => part.type === 'text')
          .map(part => (part.type === 'text' ? part.text : ''))
          .join('\n'));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
async function main() {
  console.log('=== Example 1: Simple Text Message ===');
  await sendSimpleTextMessage();
  
  console.log('\n=== Example 2: Complex Message with Multiple Parts ===');
  await sendComplexMessage();
  
  console.log('\n=== Example 3: Streaming Response ===');
  await streamingExample();
  
  console.log('\n=== Example 4: Get Existing Task ===');
  await getExistingTask();
}

// Uncomment to run the examples
// main().catch(console.error);

export { sendSimpleTextMessage, sendComplexMessage, streamingExample, getExistingTask }; 