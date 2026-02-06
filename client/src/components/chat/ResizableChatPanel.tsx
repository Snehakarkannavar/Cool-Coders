import React, { useState, useRef, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  SmartToy as AiIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Description as DocumentIcon,
  DatasetOutlined as DatasetIcon,
  ChevronRight as ChevronRightIcon,
  AutoAwesome as SparkleIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  dataSource?: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'document';
    name: string;
    url: string;
  }>;
}

interface ResizableChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onExecuteCommand?: (command: string, dataSource?: string) => void;
}

export function ResizableChatPanel({ isOpen, onToggle, onExecuteCommand }: ResizableChatPanelProps) {
  const { dataSources, activeDataSourceId, setActiveDataSource } = useData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your AI Data Assistant powered by Gemini. I can help you analyze data, create visualizations, generate reports, and execute commands across all sections of the dashboard. What would you like to explore today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState<string>(activeDataSourceId || 'all');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    type: 'image' | 'video' | 'document';
    name: string;
    url: string;
  }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedCommands = [
    'Create a sales trend chart for Q4',
    'Analyze customer demographics',
    'Generate a monthly revenue report',
    'Find correlations in the data',
    'Create a dashboard for key metrics',
    'Export data to Excel format'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeDataSourceId && activeDataSourceId !== selectedDataSource) {
      setSelectedDataSource(activeDataSourceId);
    }
  }, [activeDataSourceId]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      sender: 'user',
      timestamp: new Date(),
      dataSource: selectedDataSource !== 'all' ? selectedDataSource : undefined,
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual Gemini API call)
      const response = await simulateAIResponse(inputText, selectedDataSource);
     
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Execute command if it's a command-type message
      if (onExecuteCommand && isCommandMessage(inputText)) {
        onExecuteCommand(inputText, selectedDataSource);
      }
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (input: string, dataSource: string): Promise<string> => {
    // This would be replaced with actual Gemini API call
    await new Promise(resolve => setTimeout(resolve, 1000));
   
    const responses = [
      `I'll analyze the data from ${getDataSourceName(dataSource)} to ${input.toLowerCase()}. Let me process this information...`,
      `Based on your request about "${input}", I can help you create visualizations and insights. Would you like me to generate a specific chart or report?`,
      `I understand you want to ${input.toLowerCase()}. I'm processing the data from your selected source to provide the best analysis.`,
      `Great question! I'll examine the ${getDataSourceName(dataSource)} dataset to ${input.toLowerCase()}. Here are my findings...`
    ];
   
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const isCommandMessage = (message: string): boolean => {
    const commandKeywords = ['create', 'generate', 'analyze', 'show', 'export', 'build', 'make'];
    return commandKeywords.some(keyword => message.toLowerCase().includes(keyword));
  };

  const getDataSourceName = (sourceId: string): string => {
    if (sourceId === 'all') return 'all data sources';
    const source = dataSources.find(ds => ds.id === sourceId);
    return source ? source.name : 'selected data source';
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image'
                     : file.type.startsWith('video/') ? 'video'
                     : 'document';
     
      const url = URL.createObjectURL(file);
     
      setAttachments(prev => [...prev, {
        type: fileType,
        name: file.name,
        url
      }]);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestedCommand = (command: string) => {
    setInputText(command);
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      content: 'Hi! I\'m your AI Data Assistant powered by Gemini. I can help you analyze data, create visualizations, generate reports, and execute commands across all sections of the dashboard. What would you like to explore today?',
      sender: 'assistant',
      timestamp: new Date()
    }]);
  };

  if (!isOpen) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          onClick={onToggle}
          className="bg-[#2E8B57] hover:bg-[#1e6f4f] text-white rounded-full w-14 h-14 shadow-lg"
        >
          <AiIcon className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 top-4 w-96 z-50">
      <Card className="h-full flex flex-col shadow-2xl border-[#2E8B57]/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#2E8B57] text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AiIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Data Assistant</h3>
              <p className="text-xs text-white/80">Powered by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <RefreshIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <CloseIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Data Source Selection */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <DatasetIcon className="w-4 h-4 text-[#2E8B57]" />
            <span className="text-xs font-medium">Data Source:</span>
            <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data Sources</SelectItem>
                {dataSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#2E8B57] flex items-center justify-center flex-shrink-0">
                    <AiIcon className="w-4 h-4 text-white" />
                  </div>
                )}
               
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg p-3 text-sm",
                    message.sender === 'user'
                      ? "bg-[#2E8B57] text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.dataSource && (
                    <div className="flex items-center gap-1 mb-2">
                      <DatasetIcon className="w-3 h-3" />
                      <span className="text-xs opacity-75">
                        {getDataSourceName(message.dataSource)}
                      </span>
                    </div>
                  )}
                 
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs opacity-75">
                          {attachment.type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {attachment.type === 'video' && <VideoIcon className="w-3 h-3" />}
                          {attachment.type === 'document' && <DocumentIcon className="w-3 h-3" />}
                          {attachment.name}
                        </div>
                      ))}
                    </div>
                  )}
                 
                  <div>{message.content}</div>
                 
                  <div className="text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
               
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-xs">U</span>
                  </div>
                )}
              </div>
            ))}
           
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#2E8B57] flex items-center justify-center">
                  <AiIcon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
           
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Commands */}
        {messages.length <= 1 && (
          <div className="p-3 border-t bg-gray-50">
            <div className="text-xs font-medium mb-2 flex items-center gap-1">
              <SparkleIcon className="w-3 h-3 text-[#2E8B57]" />
              Suggested Commands
            </div>
            <div className="grid gap-1">
              {suggestedCommands.slice(0, 3).map((command, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedCommand(command)}
                  className="text-left text-xs p-2 rounded bg-white hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  {command}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <AttachFileIcon className="w-4 h-4 text-[#2E8B57]" />
              <span className="text-xs font-medium">Attachments ({attachments.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border rounded p-2 text-xs">
                  {attachment.type === 'image' && <ImageIcon className="w-3 h-3 text-[#2E8B57]" />}
                  {attachment.type === 'video' && <VideoIcon className="w-3 h-3 text-[#2E8B57]" />}
                  {attachment.type === 'document' && <DocumentIcon className="w-3 h-3 text-[#2E8B57]" />}
                  <span className="truncate max-w-[100px]">{attachment.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything about your data..."
                className="min-h-[40px] max-h-[100px] resize-none text-sm"
                disabled={isLoading}
              />
            </div>
           
            <div className="flex flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileAttachment}
                className="hidden"
              />
             
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 p-0 text-[#2E8B57] hover:bg-[#2E8B57]/10"
                disabled={isLoading}
              >
                <AttachFileIcon className="w-4 h-4" />
              </Button>
             
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="h-8 w-8 p-0 bg-[#2E8B57] hover:bg-[#1e6f4f]"
              >
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
         
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line • Use @ to reference data sources
          </div>
        </div>
      </Card>
    </div>
  );
}