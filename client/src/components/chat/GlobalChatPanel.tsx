import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useChat } from '@/contexts/ChatContext';
import { useKeyboardShortcuts, useEscapeToClose } from '@/hooks/use-keyboard-shortcuts';
import { askGemini } from '@/lib/geminiChatService';
import { useLocation } from 'wouter';
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
  Refresh as RefreshIcon,
  DragIndicator as GripVerticalIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Rocket as RocketIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Lightbulb as LightbulbIcon,
  AttachmentOutlined as AttachmentIcon
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

// Format message content for better display
const FormattedMessage = ({ content }: { content: string }) => {
  const lines = content.split('\\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('**') && line.endsWith('**')) {
          const text = line.replace(/\*\*/g, '');
          return <div key={idx} className="font-bold text-sm mt-3 mb-1">{text}</div>;
        }
        // Bold text inline
        if (line.includes('**')) {
          const parts = line.split(/\*\*/);
          return (
            <div key={idx} className="text-sm leading-relaxed">
              {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
            </div>
          );
        }
        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('▸') || line.trim().startsWith('✓')) {
          return <div key={idx} className="text-sm pl-2 leading-relaxed">{line}</div>;
        }
        // Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }
        // Regular text
        return <div key={idx} className="text-sm leading-relaxed">{line}</div>;
      })}
    </div>
  );
};

export function GlobalChatPanel() {
  const { dataSources, activeDataSourceId, setActiveDataSource, data, columns } = useData();
  const { 
    isChatOpen, 
    chatWidth, 
    minChatWidth, 
    maxChatWidth, 
    toggleChat, 
    setChatWidth,
    setChatOpen 
  } = useChat();
  const [, setLocation] = useLocation();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  useEscapeToClose();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your AI Data Assistant.\\n\\n**I can help you:**\\n• Analyze datasets with detailed statistics\\n• Recommend and create visualizations\\n• Generate comprehensive reports\\n• Find insights and patterns in data\\n\\n**Getting Started:**\\n1. Upload a CSV file from the Dashboard page\\n2. Select your dataset from the dropdown above\\n3. Ask me questions about your data\\n\\n**Try asking:**\\n• "How many rows are in my dataset?"\\n• "Show me summary statistics"\\n• "What are the columns?"\\n• "Find insights and patterns"\\n\\n**Note:** Currently, only CSV files are supported for data analysis.',
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
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync selectedDataSource with activeDataSourceId when it changes
  useEffect(() => {
    if (activeDataSourceId && activeDataSourceId !== selectedDataSource) {
      console.log('🔄 Syncing selectedDataSource with activeDataSourceId:', activeDataSourceId);
      setSelectedDataSource(activeDataSourceId);
    }
  }, [activeDataSourceId]);
  
  // Auto-select newly uploaded data source
  useEffect(() => {
    if (dataSources.length > 0) {
      if (selectedDataSource === 'all' || selectedDataSource === 'none') {
        const latestSource = dataSources[dataSources.length - 1];
        console.log('🔄 Auto-selecting latest data source:', latestSource.name, 'ID:', latestSource.id);
        setSelectedDataSource(latestSource.id);
        
        const dataDetectedMessage: Message = {
          id: `data-detected-${Date.now()}`,
          content: `**Dataset Detected!**\\n\\n✓ Auto-selected: **${latestSource.name}**\\n• ${latestSource.data?.length || 0} rows\\n• ${latestSource.columns?.length || 0} columns\\n\\nYou can now ask me questions about your data!`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => {
          const hasRecentDataMessage = prev.some(msg => 
            msg.content.includes('Dataset Detected') && 
            Date.now() - msg.timestamp.getTime() < 5000
          );
          if (hasRecentDataMessage) return prev;
          return [...prev, dataDetectedMessage];
        });
      } else if (!dataSources.find(ds => ds.id === selectedDataSource)) {
        const firstSource = dataSources[0];
        console.log('🔄 Selected source not found, selecting first available:', firstSource.name);
        setSelectedDataSource(firstSource.id);
      }
    } else {
      if (selectedDataSource !== 'all') {
        console.log('🔄 No data sources, resetting to "all"');
        setSelectedDataSource('all');
      }
    }
  }, [dataSources]);

  const suggestedCommands = [
    'Show me summary statistics for my data',
    'Find correlations and patterns',
    'What trends can you identify?',
    'Analyze data distribution',
    'Suggest visualizations for my data',
    'Give me insights about this dataset'
  ];

  // Handle window resize and prevent overflow
  useEffect(() => {
    const handleResize = () => {
      const maxAllowedWidth = window.innerWidth * 0.8;
      if (chatWidth > maxAllowedWidth) {
        setChatWidth(Math.max(minChatWidth, maxAllowedWidth));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chatWidth, setChatWidth, minChatWidth]);

  // Resize functionality with constraints
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.classList.add('resize-active');

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const constrainedWidth = Math.max(
        minChatWidth, 
        Math.min(maxChatWidth, Math.min(newWidth, window.innerWidth * 0.8))
      );
      setChatWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resize-active');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [setChatWidth, minChatWidth, maxChatWidth]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const currentQuery = inputText.toLowerCase();
    const currentAttachments = [...attachments];
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Handle attachments
      if (currentAttachments.length > 0) {
        const attachmentInfo = currentAttachments.map(att => 
          `- ${att.name} (${att.type})`
        ).join('\\n');
        
        const attachmentResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `Received ${currentAttachments.length} attachment(s):\\n${attachmentInfo}\\n\\nProcessing the content now...`,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, attachmentResponse]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Get current data and columns
      let currentData = null;
      let currentColumns: any[] = [];
      let dataSourceName = 'your dataset';
      
      // Try to get data from selected source first
      if (selectedDataSource !== 'all') {
        const selectedSource = dataSources.find(ds => ds.id === selectedDataSource);
        
        if (selectedSource) {
          currentData = selectedSource.data;
          currentColumns = selectedSource.columns;
          dataSourceName = selectedSource.name;
        }
      }
      
      // Fallback: If no data found yet, try other sources
      if (!currentData || currentData.length === 0) {
        if (dataSources && dataSources.length > 0) {
          const firstSource = dataSources[0];
          currentData = firstSource.data;
          currentColumns = firstSource.columns;
          dataSourceName = firstSource.name;
        } else if (data && data.length > 0) {
          currentData = data;
          currentColumns = columns;
          dataSourceName = 'uploaded dataset';
        }
      }

      // Check if data exists
      if (!currentData || currentData.length === 0) {
        const debugInfo = dataSources && dataSources.length > 0 
          ? `\\n\\n**Debug Info:**\\n• Found ${dataSources.length} data sources\\n• Names: ${dataSources.map(ds => ds.name).join(', ')}\\n• Please select a specific data source from the dropdown above`
          : data && data.length > 0
          ? `\\n\\n**Debug Info:**\\n• Found global data with ${data.length} rows\\n• This might be a context issue - trying to reload...`
          : `\\n\\n**How to fix this:**\\n1. Go to the **Dashboard** page (home icon on left sidebar)\\n2. Click the **Upload Dataset** button or drag & drop a **CSV file**\\n3. After upload, return here and select your dataset from the dropdown above\\n4. Then ask your questions!\\n\\n**Note:** Only CSV files are currently supported. DOCX/Word files cannot be analyzed for data.`;

        const noDataMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `**No data available to analyze**\\n\\nI can't find any dataset to work with. Please upload a CSV dataset first.${debugInfo}`,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, noDataMessage]);
        setIsLoading(false);
        return;
      }

      // Get Gemini API key from environment with fallback
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBcxNybNgV_800Eoo8Eq3JgS2IDd8VHcfg';
      
      if (!geminiApiKey) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: '**API Key Required**\\n\\nPlease add your Gemini API key to your `.env` file:\\n\\n`VITE_GEMINI_API_KEY=your_actual_api_key_here`\\n\\nGet a free API key at: https://makersuite.google.com/app/apikey\\n\\nAfter adding the key, restart your development server.',
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Call Gemini AI with the dataset and user query
      console.log('Sending query to Gemini:', {
        query: currentQuery,
        dataSourceName,
        rows: currentData.length,
        columns: currentColumns.length
      });

      try {
        const geminiResponse = await askGemini(
          currentQuery,
          {
            name: dataSourceName,
            data: currentData,
            columns: currentColumns
          },
          geminiApiKey
        );

        // Display Gemini's response
        const aiMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: geminiResponse.response,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);

        // Navigate to visual builder if Gemini suggests visualization
        if (geminiResponse.shouldNavigateToVisualBuilder) {
          setTimeout(() => {
            const navMessage: Message = {
              id: (Date.now() + 10).toString(),
              content: '**Create Visualization**\\n\\nI\'ll take you to the Visual Builder where you can create charts interactively.',
              sender: 'assistant',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, navMessage]);
            
            setTimeout(() => {
              setLocation('/visual-builder');
            }, 1500);
          }, 1000);
        }
      } catch (geminiError: any) {
        console.error('Gemini API error:', geminiError);
        
        let errorMessage = 'Failed to communicate with Gemini AI.';
        
        if (geminiError.message?.includes('API_KEY_INVALID')) {
          errorMessage = 'Invalid API key. Please check your Gemini API key in the `.env` file.';
        } else if (geminiError.message?.includes('quota')) {
          errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
        } else if (geminiError.message) {
          errorMessage = geminiError.message;
        }
        
        const geminiErrorMessage: Message = {
          id: (Date.now() + 4).toString(),
          content: `**Gemini API Error**\\n\\n${errorMessage}\\n\\n**Troubleshooting:**\\n• Verify your API key is correct\\n• Check if you have quota remaining\\n• Ensure your API key has the necessary permissions`,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, geminiErrorMessage]);
      }

    } catch (error: any) {
      console.error('General error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `**Error processing your request**\\n\\n${error.message || 'Unknown error occurred'}\\n\\nPlease try again or rephrase your question.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
      content: 'Hi! I\'m your AI Data Assistant.\\n\\n**I can help you:**\\n• Analyze datasets with detailed statistics\\n• Recommend and create visualizations\\n• Generate comprehensive reports\\n• Find insights and patterns in data\\n\\n**Try asking:**\\n• "Show me summary statistics"\\n• "Create a visualization"\\n• "Generate a report"\\n• "Find insights"\\n\\nWhat would you like to explore?',
      sender: 'assistant',
      timestamp: new Date()
    }]);
  };

  // Floating toggle button when closed
  if (!isChatOpen) {
    return (
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          onClick={toggleChat}
          className="bg-[#2E8B57] hover:bg-[#1e6f4f] text-white rounded-full w-14 h-14 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <AiIcon className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  // Full chat panel when open
  return (
    <>
      {isResizing && (
        <div className="fixed inset-0 z-[60] bg-black/10 cursor-col-resize" />
      )}
      
      <div 
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-50 bg-white shadow-2xl border-l border-gray-200 flex flex-col"
        style={{ width: chatWidth }}
      >
        {/* Resize handle */}
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#2E8B57] transition-colors group"
        >
          <div className="absolute inset-0 w-0.5 bg-transparent group-hover:bg-[#2E8B57]/50 mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#2E8B57] text-white">
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
              onClick={toggleChat}
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
            <Select 
              value={selectedDataSource} 
              onValueChange={(value) => {
                setSelectedDataSource(value);
                
                const selectedSource = dataSources.find(ds => ds.id === value);
                if (selectedSource) {
                  const confirmMessage: Message = {
                    id: `source-changed-${Date.now()}`,
                    content: `**Data source changed to:**\\n${selectedSource.name} (${selectedSource.data?.length || 0} rows)`,
                    sender: 'assistant',
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, confirmMessage]);
                }
              }}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder={dataSources?.length === 0 ? "No data uploaded yet" : "Select data source"} />
              </SelectTrigger>
              <SelectContent>
                {dataSources?.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No data sources - Upload a CSV file first
                  </SelectItem>
                ) : (
                  <>
                    {dataSources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} ({source.data?.length || 0} rows)
                      </SelectItem>
                    ))}
                    <SelectItem value="all">All Data Sources ({dataSources?.length || 0})</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {dataSources?.length === 0 ? (
            <div className="mt-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ No data uploaded. Go to Dashboard to upload a CSV file.
            </div>
          ) : (
            <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded flex items-center justify-between">
              <span>✓ {dataSources?.length} dataset{dataSources?.length !== 1 ? 's' : ''} available</span>
              {selectedDataSource && selectedDataSource !== 'all' && (
                <span className="font-medium">
                  Currently: {dataSources.find(ds => ds.id === selectedDataSource)?.name || 'Unknown'}
                </span>
              )}
            </div>
          )}
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
                 
                  <FormattedMessage content={message.content} />
                 
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
            Press Enter to send • Shift+Enter for new line • Drag left edge to resize
          </div>
        </div>
      </div>
    </>
  );
}