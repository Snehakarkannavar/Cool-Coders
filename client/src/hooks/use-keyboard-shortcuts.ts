import { useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';

export function useKeyboardShortcuts() {
  const { toggleChat } = useChat();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle chat with Ctrl+Shift+I (or Cmd+Shift+I on Mac)
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        toggleChat();
        return;
      }

      // Alternative: Ctrl+` (like VS Code terminal)
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        toggleChat();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleChat]);
}

export function useEscapeToClose() {
  const { isChatOpen, setChatOpen } = useChat();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isChatOpen) {
        setChatOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isChatOpen, setChatOpen]);
}