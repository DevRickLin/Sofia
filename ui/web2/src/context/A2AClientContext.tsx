import type React from 'react';
import { createContext, useContext } from 'react';
import type { A2AClient } from 'a2a-client';

interface A2AClientContextType {
  client: A2AClient | null;
}

const A2AClientContext = createContext<A2AClientContextType>({ client: null });

export const useA2AClient = () => useContext(A2AClientContext);

interface A2AClientProviderProps {
  client: A2AClient;
  children: React.ReactNode;
}

export const A2AClientProvider: React.FC<A2AClientProviderProps> = ({ client, children }) => {
  return (
    <A2AClientContext.Provider value={{ client }}>
      {children}
    </A2AClientContext.Provider>
  );
}; 