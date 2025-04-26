# A2A Client

A TypeScript/JavaScript client library for the A2A (Agent-to-Agent) protocol.

## Installation

```bash
npm install a2a-client
```

## Features

- Support for both browser and Node.js environments
- TypeScript definitions included
- Stream responses support
- Error handling with specific error types
- Lightweight with minimal dependencies

## Usage

### Basic Usage

```javascript
const { A2AClient } = require('a2a-client');

// Create client with URL
const client = new A2AClient(null, 'https://your-agent-url.com/api');

// Send a text message
const response = await client.sendTask('Hello, agent!');
console.log(response);

// Send data
const dataResponse = await client.sendTask({ key: 'value' });
console.log(dataResponse);

// Stream responses
for await (const chunk of client.sendTaskStreaming('Tell me a story')) {
  console.log('Received chunk:', chunk);
}
```

### TypeScript Usage

```typescript
import { A2AClient, TaskState } from 'a2a-client';

// Create client with agent card
const agentCard = {
  url: 'https://your-agent-url.com/api'
};
const client = new A2AClient(agentCard);

// Type your data
interface MyData {
  name: string;
  value: number;
}

const data: MyData = { name: 'test', value: 42 };
const response = await client.sendTask(data);
```

### Browser Usage

```html
<!-- Include dependencies from CDN -->
<script src="https://cdn.jsdelivr.net/npm/uuid@9.0.0/dist/umd/uuid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/eventsource-parser@1.0.0/dist/index.umd.js"></script>

<!-- Include the library -->
<script src="https://cdn.jsdelivr.net/npm/a2a-client/dist/client.browser.js"></script>

<script>
  // Create client instance
  const client = new A2AClient.A2AClient(null, 'https://your-agent-url.com/api');
  
  // Use the client
  client.sendTask('Hello from browser!')
    .then(response => console.log(response))
    .catch(error => console.error(error));
</script>
```

## API Reference

### Constructor

```javascript
new A2AClient(agentCard, url)
```

Parameters:
- `agentCard` (optional): Object containing agent information with a `url` property
- `url` (optional): String URL for the agent (used if agentCard is not provided)

Note: One of `agentCard` or `url` must be provided

### Methods

#### sendTask(message, id)

Sends a task to the agent and returns a Promise with the response.

Parameters:
- `message`: String or object to send
- `id` (optional): Request ID

Returns: Promise<JSONRPCResponse>

#### sendTaskStreaming(message, id)

Sends a task to the agent and returns an AsyncGenerator that yields streaming responses.

Parameters:
- `message`: String or object to send
- `id` (optional): Request ID

Returns: AsyncGenerator<JSONRPCResponse>

### Error Classes

- `A2AClientError`: Base error class
- `A2AClientHTTPError`: HTTP-related errors with a status code
- `A2AClientJSONError`: JSON parsing errors

## License

MIT 