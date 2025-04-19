import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Import the chat interface
import { ChatInterface } from '../components/chat/ChatInterface';

// Import the canvas interface with dynamic loading (no SSR)
const CanvasInterface = dynamic(
  () => import('../components/canvas/CanvasInterface').then(mod => ({ default: mod.CanvasInterface })),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Knowledge Graph Assistant</title>
        <meta name="description" content="Interactive knowledge graph assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex h-screen bg-secondary-100 dark:bg-secondary-950">
        {/* Left panel: Chat interface */}
        <div className="w-2/5 border-r border-secondary-200 dark:border-secondary-800 h-full">
          <ChatInterface />
        </div>

        {/* Right panel: Knowledge graph canvas */}
        <div className="w-3/5 h-full">
          <CanvasInterface />
        </div>
      </main>
    </>
  );
}
