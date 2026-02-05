import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";
import { ChartRenderer } from "@/components/charts/chart-renderer";
import { motion } from "framer-motion";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  visualization?: {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
    config: any;
    data: any[];
    title?: string;
    description?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full gap-4 max-w-4xl mx-auto mb-8",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1",
        isUser ? "bg-primary text-white" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
      )}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      <div className={cn(
        "flex flex-col gap-3 min-w-0 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-white border border-border/60 text-slate-700 rounded-tl-none"
        )}>
          {message.content}
        </div>

        {message.visualization && (
          <div className="w-full mt-2 animate-in fade-in zoom-in-95 duration-500">
            <ChartRenderer 
              type={message.visualization.type}
              data={message.visualization.data}
              config={message.visualization.config}
              title={message.visualization.title}
              description={message.visualization.description}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
