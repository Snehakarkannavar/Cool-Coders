import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  chatWidth: number;
  minChatWidth: number;
  maxChatWidth: number;
  toggleChat: () => void;
  setChatWidth: (width: number) => void;
  setChatOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidthState] = useState(400); // Default width
  
  const minChatWidth = 300;
  const maxChatWidth = 600;

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const setChatOpen = (open: boolean) => {
    setIsChatOpen(open);
  };

  const setChatWidth = (width: number) => {
    const constrainedWidth = Math.max(minChatWidth, Math.min(maxChatWidth, width));
    setChatWidthState(constrainedWidth);
  };

  return (
    <ChatContext.Provider value={{
      isChatOpen,
      chatWidth,
      minChatWidth,
      maxChatWidth,
      toggleChat,
      setChatWidth,
      setChatOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}