import React from 'react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  visualization?: any;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-[#2E8B57] text-white'
            : 'bg-[#f3f2f1] text-[#323130]'
        )}
      >
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
        {message.visualization && (
          <div className="mt-2 p-2 bg-white/10 rounded text-xs">
            Visualization: {message.visualization.title || 'Chart'}
          </div>
        )}
      </div>
    </div>
  );
}

