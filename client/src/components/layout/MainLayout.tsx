import React, { ReactNode } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isChatOpen, chatWidth } = useChat();

  return (
    <div className="min-h-screen bg-gray-50">
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          isChatOpen ? "mr-[var(--chat-width)]" : "mr-0"
        )}
        style={{
          '--chat-width': isChatOpen ? `${chatWidth}px` : '0px'
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}