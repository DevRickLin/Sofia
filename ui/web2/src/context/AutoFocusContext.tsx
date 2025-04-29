import type React from 'react';
import { createContext, useContext, useState } from 'react';

interface AutoFocusContextType {
  isAutoFocusEnabled: boolean;
  toggleAutoFocus: () => void;
}

const AutoFocusContext = createContext<AutoFocusContextType | undefined>(undefined);

export const AutoFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAutoFocusEnabled, setIsAutoFocusEnabled] = useState(false);

  const toggleAutoFocus = () => {
    setIsAutoFocusEnabled(prev => !prev);
  };

  return (
    <AutoFocusContext.Provider value={{ isAutoFocusEnabled, toggleAutoFocus }}>
      {children}
    </AutoFocusContext.Provider>
  );
};

export const useAutoFocus = () => {
  const context = useContext(AutoFocusContext);
  if (context === undefined) {
    throw new Error('useAutoFocus must be used within an AutoFocusProvider');
  }
  return context;
}; 