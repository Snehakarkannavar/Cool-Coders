import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleOutline as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  DatasetOutlined as DatasetIcon,
  SmartToy as AIIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Undo as UndoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon,
  Palette as PaletteIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useData } from '@/contexts/DataContext';

interface DroppedField {
  id: string;
  name: string;
  type: 'dimension' | 'measure';
}

interface ChartGenerationRequest {
  id: string;
  xField?: DroppedField;
  yFields?: DroppedField[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  status: 'pending' | 'generating' | 'completed' | 'rejected';
  visualId?: string;
  chartConfig?: any;
  userMessage?: string;
}

interface CommandExecution {
  id: string;
  command: string;
  status: 'analyzing' | 'executing' | 'awaiting_confirmation' | 'completed' | 'rejected' | 'stopped';
  steps: ExecutionStep[];
  currentStepIndex: number;
  result?: any;
}

interface ExecutionStep {
  id: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'error';
  action: () => Promise<any>;
  result?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: 'gemini' | 'chatgpt';
  chartRequest?: ChartGenerationRequest;
  commandExecution?: CommandExecution;
  droppedFields?: DroppedField[];
  awaitingConfirmation?: boolean;
  confirmationType?: 'chart' | 'command' | 'modification';
}

export function ResizableChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'chatgpt'>('gemini');
  const [droppedFields, setDroppedFields] = useState<DroppedField[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pendingChartRequest, setPendingChartRequest] = useState<ChartGenerationRequest | null>(null);
  const [activeExecution, setActiveExecution] = useState<CommandExecution | null>(null);
  
  const { dataSources, data, columns } = useData();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 350;
  const MAX_WIDTH = 900;

  // Get API keys from environment
  const CHATGPT_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle drag and drop from Visual Builder
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const columnId = e.dataTransfer.getData('columnId');
    const columnType = e.dataTransfer.getData('columnType');
    
    if (columnId && columnType) {
      const column = columns.find(c => c.id === columnId);
      if (column) {
        const newField: DroppedField = {
          id: column.id,
          name: column.name,
          type: columnType as 'dimension' | 'measure'
        };
        
        setDroppedFields(prev => [...prev, newField]);
        
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `Field added: **${column.name}** (${columnType})`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const removeDroppedField = (fieldId: string) => {
    setDroppedFields(prev => prev.filter(f => f.id !== fieldId));
  };

  // AI Command Understanding
  const analyzeCommand = async (userInput: string): Promise<CommandExecution | null> => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('chart') || lowerInput.includes('graph') || lowerInput.includes('visualiz')) {
      return createChartGenerationExecution(userInput);
    }
    
    if (lowerInput.includes('change color') || lowerInput.includes('modify') || lowerInput.includes('update')) {
      return createChartModificationExecution(userInput);
    }
    
    if (lowerInput.includes('go to') || lowerInput.includes('open') || lowerInput.includes('navigate')) {
      return createNavigationExecution(userInput);
    }
    
    if (lowerInput.includes('analyze') || lowerInput.includes('summary') || lowerInput.includes('insights')) {
      return createAnalysisExecution(userInput);
    }
    
    return null;
  };

  const createChartGenerationExecution = (userInput: string): CommandExecution => {
    const steps: ExecutionStep[] = [
      {
        id: 'step-1',
        description: 'Analyzing request and identifying chart type',
        status: 'pending',
        action: async () => {
          const chartType = detectChartType(userInput);
          return { chartType };
        }
      },
      {
        id: 'step-2',
        description: 'Mapping fields to chart axes',
        status: 'pending',
        action: async () => {
          const dimensions = droppedFields.filter(f => f.type === 'dimension');
          const measures = droppedFields.filter(f => f.type === 'measure');
          
          return {
            xField: dimensions[0],
            yFields: measures
          };
        }
      },
      {
        id: 'step-3',
        description: 'Creating visualization in Visual Builder',
        status: 'pending',
        action: async () => {
          return { visualId: `visual-${Date.now()}` };
        }
      }
    ];

    return {
      id: `exec-${Date.now()}`,
      command: userInput,
      status: 'analyzing',
      steps,
      currentStepIndex: 0
    };
  };

  const createChartModificationExecution = (userInput: string): CommandExecution => {
    const steps: ExecutionStep[] = [
      {
        id: 'step-1',
        description: 'Identifying chart to modify',
        status: 'pending',
        action: async () => {
          return { visualId: 'current-visual' };
        }
      },
      {
        id: 'step-2',
        description: 'Applying requested changes',
        status: 'pending',
        action: async () => {
          const modification = extractModificationDetails(userInput);
          return modification;
        }
      }
    ];

    return {
      id: `exec-${Date.now()}`,
      command: userInput,
      status: 'analyzing',
      steps,
      currentStepIndex: 0
    };
  };

  const createNavigationExecution = (userInput: string): CommandExecution => {
    const steps: ExecutionStep[] = [
      {
        id: 'step-1',
        description: 'Navigating to requested page',
        status: 'pending',
        action: async () => {
          const destination = extractDestination(userInput);
          window.location.href = destination;
          return { destination };
        }
      }
    ];

    return {
      id: `exec-${Date.now()}`,
      command: userInput,
      status: 'analyzing',
      steps,
      currentStepIndex: 0
    };
  };

  const createAnalysisExecution = (userInput: string): CommandExecution => {
    const steps: ExecutionStep[] = [
      {
        id: 'step-1',
        description: 'Analyzing dataset',
        status: 'pending',
        action: async () => {
          const analysis = await performDataAnalysis(userInput);
          return analysis;
        }
      }
    ];

    return {
      id: `exec-${Date.now()}`,
      command: userInput,
      status: 'analyzing',
      steps,
      currentStepIndex: 0
    };
  };

  const detectChartType = (input: string): 'bar' | 'line' | 'pie' | 'scatter' | 'area' => {
    const lower = input.toLowerCase();
    if (lower.includes('bar')) return 'bar';
    if (lower.includes('line')) return 'line';
    if (lower.includes('pie')) return 'pie';
    if (lower.includes('scatter')) return 'scatter';
    if (lower.includes('area')) return 'area';
    return 'bar';
  };

  const extractModificationDetails = (input: string) => {
    const modifications: any = {};
    
    const colorMatch = input.match(/(?:change|make|set)\s+(?:the\s+)?color\s+(?:to\s+)?(\w+)/i);
    if (colorMatch) {
      modifications.color = colorMatch[1];
    }
    
    const typeMatch = input.match(/change\s+(?:to\s+)?(?:a\s+)?(\w+)\s+chart/i);
    if (typeMatch) {
      modifications.chartType = typeMatch[1];
    }
    
    return modifications;
  };

  const extractDestination = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('dashboard')) return '/';
    if (lower.includes('reports')) return '/reports';
    if (lower.includes('visual') || lower.includes('chart')) return '/visual-builder';
    if (lower.includes('composer')) return '/dashboard-composer';
    return '/';
  };

  const performDataAnalysis = async (query: string): Promise<string> => {
    if (!data || data.length === 0) {
      return "No data available for analysis.";
    }

    let analysis = `**Data Analysis**\n\n`;
    analysis += `**Dataset Overview:**\n`;
    analysis += `• Total Records: ${data.length}\n`;
    analysis += `• Total Columns: ${columns.length}\n\n`;
    
    columns.forEach(col => {
      const values = data.map(row => row[col.name]).filter(v => v != null);
      if (col.type === 'number') {
        const numbers = values.map(Number).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          const sum = numbers.reduce((a, b) => a + b, 0);
          const avg = sum / numbers.length;
          const min = Math.min(...numbers);
          const max = Math.max(...numbers);
          
          analysis += `**${col.name}:**\n`;
          analysis += `  • Average: ${avg.toFixed(2)}\n`;
          analysis += `  • Range: ${min} - ${max}\n`;
          analysis += `  • Total: ${sum.toFixed(2)}\n\n`;
        }
      }
    });
    
    return analysis;
  };

  const executeCommandSteps = async (execution: CommandExecution) => {
    setActiveExecution(execution);
    
    const updatedExecution = { ...execution, status: 'executing' as const };
    setActiveExecution(updatedExecution);
    
    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];
      
      const executingExecution = {
        ...updatedExecution,
        currentStepIndex: i,
        steps: updatedExecution.steps.map((s, idx) => 
          idx === i ? { ...s, status: 'executing' as const } : s
        )
      };
      setActiveExecution(executingExecution);
      
      const progressMessage: Message = {
        id: `progress-${Date.now()}`,
        role: 'system',
        content: `${step.description}...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, progressMessage]);
      
      try {
        const result = await step.action();
        
        const completedExecution = {
          ...executingExecution,
          steps: executingExecution.steps.map((s, idx) => 
            idx === i ? { ...s, status: 'completed' as const, result } : s
          )
        };
        setActiveExecution(completedExecution);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const errorExecution = {
          ...executingExecution,
          status: 'stopped' as const,
          steps: executingExecution.steps.map((s, idx) => 
            idx === i ? { ...s, status: 'error' as const } : s
          )
        };
        setActiveExecution(errorExecution);
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
    }
    
    const finalExecution = {
      ...updatedExecution,
      status: 'awaiting_confirmation' as const,
      result: updatedExecution.steps.map(s => s.result)
    };
    setActiveExecution(finalExecution);
    
    if (updatedExecution.command.toLowerCase().includes('chart')) {
      const chartType = updatedExecution.steps[0]?.result?.chartType || 'bar';
      const { xField, yFields } = updatedExecution.steps[1]?.result || {};
      
      const chartRequest: ChartGenerationRequest = {
        id: `chart-${Date.now()}`,
        xField,
        yFields,
        chartType,
        status: 'pending',
        userMessage: updatedExecution.command
      };
      
      setPendingChartRequest(chartRequest);
      
      const confirmationMessage: Message = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: generateChartPreview(chartRequest),
        timestamp: new Date(),
        awaitingConfirmation: true,
        confirmationType: 'chart',
        chartRequest
      };
      setMessages(prev => [...prev, confirmationMessage]);
    } else {
      const confirmationMessage: Message = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `Command analysis complete!\n\n**Command:** ${updatedExecution.command}\n\nType **accept** to proceed or **reject** to cancel.`,
        timestamp: new Date(),
        awaitingConfirmation: true,
        confirmationType: 'command',
        commandExecution: finalExecution
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const generateChartPreview = (chartRequest: ChartGenerationRequest): string => {
    let preview = `**Chart Generation Preview**\n\n`;
    preview += `**Chart Type:** ${chartRequest.chartType}\n`;
    if (chartRequest.xField) {
      preview += `**X-Axis:** ${chartRequest.xField.name} (${chartRequest.xField.type})\n`;
    }
    if (chartRequest.yFields && chartRequest.yFields.length > 0) {
      preview += `**Y-Axis:** ${chartRequest.yFields.map(f => f.name).join(', ')}\n`;
    }
    preview += `\nType **accept** to create this chart\n`;
    preview += `Type **reject** to cancel\n`;
    preview += `Or make modifications (e.g., "change color to blue")\n`;
    
    return preview;
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (!activeExecution) return;
    
    if (confirmed) {
      if (pendingChartRequest) {
        const chartData = {
          chartType: pendingChartRequest.chartType,
          xField: pendingChartRequest.xField?.id,
          yField: pendingChartRequest.yFields?.[0]?.id
        };
        
        localStorage.setItem('datasights.pendingChartRequest', JSON.stringify({
          originalCommand: pendingChartRequest.userMessage,
          chartType: pendingChartRequest.chartType,
          xField: pendingChartRequest.xField?.name,
          yField: pendingChartRequest.yFields?.[0]?.name
        }));
        
        const successMessage: Message = {
          id: `success-${Date.now()}`,
          role: 'assistant',
          content: `Chart created successfully! Opening Visual Builder...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        
        setTimeout(() => {
          window.location.href = '/visual-builder';
        }, 1000);
        
        setPendingChartRequest(null);
      }
      
      setActiveExecution(null);
      setDroppedFields([]);
      
    } else {
      const rejectMessage: Message = {
        id: `reject-${Date.now()}`,
        role: 'assistant',
        content: `Command cancelled.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, rejectMessage]);
      
      setActiveExecution(null);
      setPendingChartRequest(null);
    }
  };

  const stopExecution = () => {
    if (activeExecution) {
      const stopMessage: Message = {
        id: `stop-${Date.now()}`,
        role: 'system',
        content: `Execution stopped by user.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, stopMessage]);
      
      setActiveExecution(null);
      setPendingChartRequest(null);
    }
  };

  const sendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.awaitingConfirmation) {
      const isAccept = trimmedInput.toLowerCase().includes('accept') || 
                       trimmedInput.toLowerCase().includes('yes') ||
                       trimmedInput.toLowerCase().includes('ok');
      const isReject = trimmedInput.toLowerCase().includes('reject') || 
                       trimmedInput.toLowerCase().includes('no') ||
                       trimmedInput.toLowerCase().includes('cancel');
      
      if (isAccept) {
        handleConfirmation(true);
        setInputValue('');
        return;
      }
      
      if (isReject) {
        handleConfirmation(false);
        setInputValue('');
        return;
      }
      
      if (trimmedInput.toLowerCase().includes('change') || 
          trimmedInput.toLowerCase().includes('modify')) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: trimmedInput,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        if (pendingChartRequest) {
          const modification = extractModificationDetails(trimmedInput);
          
          if (modification.color) {
            const modifiedMessage: Message = {
              id: `modified-${Date.now()}`,
              role: 'assistant',
              content: `Chart color updated to **${modification.color}**. Type **accept** to create the chart.`,
              timestamp: new Date(),
              awaitingConfirmation: true,
              confirmationType: 'chart',
              chartRequest: { ...pendingChartRequest, chartConfig: { ...pendingChartRequest.chartConfig, color: modification.color } }
            };
            setMessages(prev => [...prev, modifiedMessage]);
            setPendingChartRequest({ ...pendingChartRequest, chartConfig: { color: modification.color } });
          }
          
          if (modification.chartType) {
            const modifiedMessage: Message = {
              id: `modified-${Date.now()}`,
              role: 'assistant',
              content: `Chart type updated to **${modification.chartType}**. Type **accept** to create the chart.`,
              timestamp: new Date(),
              awaitingConfirmation: true,
              confirmationType: 'chart',
              chartRequest: { ...pendingChartRequest, chartType: modification.chartType as any }
            };
            setMessages(prev => [...prev, modifiedMessage]);
            setPendingChartRequest({ ...pendingChartRequest, chartType: modification.chartType as any });
          }
        }
        
        setInputValue('');
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
      droppedFields: droppedFields.length > 0 ? [...droppedFields] : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const execution = await analyzeCommand(trimmedInput);
      
      if (execution) {
        await executeCommandSteps(execution);
      } else {
        const context = prepareDataContext();
        let response: string;
        
        if (selectedModel === 'chatgpt') {
          if (!CHATGPT_API_KEY) {
            throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
          }
          response = await callChatGPTAPI(trimmedInput, context);
        } else {
          if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
          }
          response = await callGeminiAPI(trimmedInput, context);
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const callChatGPTAPI = async (message: string, context: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHATGPT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are DataSights AI, an intelligent business analytics assistant. ${context}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  };

   const callGeminiAPI = async (message: string, context: string): Promise<string> => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are DataSights AI. ${context}\n\nUser: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API error');
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  };
  
  const prepareDataContext = (): string => {
    if (dataSources.length === 0 && data.length === 0) {
      return 'No datasets loaded.';
    }

    let context = `Available data:\n`;
    if (data.length > 0) {
      context += `- ${data.length} rows, ${columns.length} columns\n`;
      context += `- Columns: ${columns.map(c => c.name).join(', ')}\n`;
    }
    
    if (droppedFields.length > 0) {
      context += `\nFields selected for visualization:\n`;
      droppedFields.forEach(f => {
        context += `- ${f.name} (${f.type})\n`;
      });
    }
    
    return context;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="flex items-center justify-center border-l" style={{ width: '48px', backgroundColor: '#f3f3f3', borderColor: '#d4d4d4' }}>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded hover:bg-[#2E8B57]/10 transition-colors"
            style={{ color: '#2E8B57' }}
            title="Open AI Assistant"
          >
            <MenuIcon style={{ fontSize: 24 }} />
          </button>
        </div>
      )}

      {isOpen && (
        <div
          ref={panelRef}
          className="h-full flex shadow-lg"
          style={{ width: `${width}px` }}
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
        >
          <div
            onMouseDown={handleMouseDown}
            className="w-1 cursor-ew-resize hover:bg-[#2E8B57] transition-colors"
            style={{ backgroundColor: isResizing ? '#2E8B57' : '#d4d4d4' }}
          />

          <div className="flex-1 flex flex-col" style={{ backgroundColor: 'white' }}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b" style={{ backgroundColor: '#2E8B57', borderColor: '#247a4a' }}>
              <div className="flex items-center gap-3">
                <AIIcon style={{ fontSize: 24, color: 'white' }} />
                <div>
                  <h2 className="text-lg font-semibold text-white">DataSights AI</h2>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as 'gemini' | 'chatgpt')}
                    className="text-xs px-2 py-1 rounded border-0 outline-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  >
                    <option value="gemini" style={{ color: '#333' }}>Gemini Pro</option>
                    <option value="chatgpt" style={{ color: '#333' }}>ChatGPT-4</option>
                  </select>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-white/20">
                <CloseIcon style={{ fontSize: 20, color: 'white' }} />
              </button>
            </div>

            {/* Dropped Fields Display */}
            {droppedFields.length > 0 && (
              <div className="px-4 py-2 border-b bg-slate-50" style={{ borderColor: '#e0e0e0' }}>
                <div className="text-xs font-medium mb-2" style={{ color: '#666' }}>
                  Selected Fields:
                </div>
                <div className="flex flex-wrap gap-2">
                  {droppedFields.map((field) => (
                    <div
                      key={field.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs"
                      style={{
                        backgroundColor: field.type === 'dimension' ? '#2E8B57' : '#59a14f',
                        color: 'white'
                      }}
                    >
                      <span>{field.name}</span>
                      <button
                        onClick={() => removeDroppedField(field.id)}
                        className="hover:bg-white/20 rounded"
                      >
                        <CloseIcon style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Execution Progress */}
            {activeExecution && activeExecution.status === 'executing' && (
              <div className="px-4 py-3 border-b bg-blue-50" style={{ borderColor: '#e0e0e0' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium" style={{ color: '#333' }}>
                    Executing Command...
                  </div>
                  <button
                    onClick={stopExecution}
                    className="px-2 py-1 rounded text-xs flex items-center gap-1"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}
                  >
                    <StopIcon style={{ fontSize: 14 }} />
                    Stop
                  </button>
                </div>
                <div className="space-y-2">
                  {activeExecution.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 text-xs">
                      {step.status === 'completed' && <CheckCircleIcon style={{ fontSize: 14, color: '#10b981' }} />}
                      {step.status === 'executing' && (
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {step.status === 'pending' && <div className="w-3 h-3 rounded-full bg-gray-300" />}
                      {step.status === 'error' && <CancelIcon style={{ fontSize: 14, color: '#ef4444' }} />}
                      <span style={{ color: '#666' }}>{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ backgroundColor: '#f9f9f9' }}>
              {dragActive && (
                <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-400 flex items-center justify-center z-10">
                  <div className="text-center">
                    <BarChartIcon style={{ fontSize: 48, color: '#2E8B57' }} />
                    <p className="text-sm font-medium mt-2" style={{ color: '#2E8B57' }}>
                      Drop fields here to create visualization
                    </p>
                  </div>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <AIIcon style={{ fontSize: 64, color: '#cccccc', marginBottom: 16 }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#333' }}>
                    DataSights AI Assistant
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666' }}>
                    Drag fields from Visual Builder or type commands to get started
                  </p>
                  <div className="text-xs space-y-2 text-left w-full max-w-sm p-3 rounded" style={{ backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                    <p style={{ color: '#666' }}>Try these commands:</p>
                    <ul className="space-y-1" style={{ color: '#666' }}>
                      <li>• "Create a bar chart showing revenue by month"</li>
                      <li>• "Analyze my sales data"</li>
                      <li>• "Change the chart color to blue"</li>
                      <li>• "Go to dashboard"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[85%] px-4 py-3 rounded-lg"
                        style={{
                          backgroundColor: message.role === 'user' ? '#2E8B57' : 
                                         message.role === 'system' ? '#f3f4f6' : 'white',
                          color: message.role === 'user' ? 'white' : '#333',
                          border: message.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
                        }}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        
                        {message.awaitingConfirmation && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleConfirmation(true)}
                              className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                              style={{ backgroundColor: '#10b981', color: 'white' }}
                            >
                              <CheckCircleIcon style={{ fontSize: 14 }} />
                              Accept
                            </button>
                            <button
                              onClick={() => handleConfirmation(false)}
                              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                              style={{ backgroundColor: '#ef4444', color: 'white' }}
                            >
                              <CancelIcon style={{ fontSize: 14 }} />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full animate-bounce bg-[#2E8B57]" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full animate-bounce bg-[#2E8B57]" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full animate-bounce bg-[#2E8B57]" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs" style={{ color: '#666' }}>
                            AI is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3" style={{ backgroundColor: 'white', borderColor: '#e0e0e0' }}>
              <div className="flex items-center gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a command or drag fields from Visual Builder..."
                  rows={Math.max(1, Math.min(4, inputValue.split('\n').length))}
                  className="flex-1 px-3 py-2 rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"
                  style={{ border: '1px solid #d4d4d4', minHeight: '40px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 rounded-lg transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#2E8B57', color: 'white' }}
                >
                  <SendIcon style={{ fontSize: 20 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}