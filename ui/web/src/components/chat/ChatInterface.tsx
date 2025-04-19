import { useRef, useEffect } from 'react';
import type { FC } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { MessageItem, MessageInput } from './components';

const ChatInterface: FC = () => {
  const { 
    messages, 
    isLoading, 
    status, 
    error, 
    sendMessage, 
    resetChat 
  } = useChatStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      sendMessage(content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary-50 dark:bg-secondary-900">
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 px-4 py-3 border-b border-secondary-200 dark:border-secondary-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Knowledge Assistant</h2>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              Ask questions about your knowledge graph
            </p>
          </div>
          <button
            type="button"
            onClick={resetChat}
            className="px-3 py-1.5 text-sm bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-md dark:bg-secondary-700 dark:hover:bg-secondary-600 dark:text-secondary-200 transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <title>Chat Message</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-medium text-secondary-700 dark:text-secondary-300">
              Start a conversation
            </h3>
            <p className="mt-2 text-secondary-500 dark:text-secondary-400 max-w-sm">
              Ask questions about your knowledge base to explore connections and relationships
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={`${message.role}-${message.timestamp}`} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Thinking...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 dark:bg-red-900 dark:border-red-800 dark:text-red-300">
            <p className="font-medium">Error: {error.message || 'Something went wrong'}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isDisabled={isLoading || status === 'failed'}
        />
        <p className="mt-2 text-xs text-center text-secondary-500 dark:text-secondary-400">
          {status === 'input-required' 
            ? 'Waiting for your response...' 
            : 'Ask a question about your knowledge graph'}
        </p>
      </div>
    </div>
  );
};

export { ChatInterface }; 