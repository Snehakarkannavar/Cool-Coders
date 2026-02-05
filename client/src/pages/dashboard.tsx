import { useState, useRef, useEffect } from "react";
import { FileUploader } from "@/components/ui/file-uploader";
import { DataTable } from "@/components/ui/data-table";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, BarChart2, Table as TableIcon, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useAnalyzeData } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Helper to deduce types
const deduceSchema = (data: any[]) => {
  if (!data || data.length === 0) return {};
  const sample = data[0];
  const schema: Record<string, string> = {};
  
  Object.keys(sample).forEach(key => {
    const val = sample[key];
    if (typeof val === 'number') schema[key] = 'number';
    else if (val instanceof Date) schema[key] = 'date';
    else schema[key] = 'string';
  });
  
  return schema;
};

// Data processing helpers
const processData = (data: any[], query: any) => {
  if (!query) return data;
  
  let result = [...data];

  // 1. Filter
  if (query.filter_conditions) {
    // This is a simplified filter implementation. 
    // In a real app, this would need a robust expression parser.
    // Assuming backend returns simple logic like { column: "Region", operator: "eq", value: "East" }
    // For now, we'll skip complex filtering for MVP safety or implement basic exact match
  }

  // 2. Aggregate / Group
  // Backend returns "aggregation_type": "sum", "columns_needed": ["Category", "Sales"]
  if (query.aggregation_type === 'sum' || query.aggregation_type === 'avg' || query.aggregation_type === 'count') {
    const groupByCol = query.columns_needed[0]; // e.g. Category
    const valueCol = query.columns_needed[1];   // e.g. Sales

    const groups = result.reduce((acc, row) => {
      const key = row[groupByCol];
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    result = Object.keys(groups).map(key => {
      const rows = groups[key];
      let value = 0;
      
      if (query.aggregation_type === 'count') {
        value = rows.length;
      } else {
        const sum = rows.reduce((s, r) => s + (Number(r[valueCol]) || 0), 0);
        value = query.aggregation_type === 'avg' ? sum / rows.length : sum;
      }

      return {
        [groupByCol]: key,
        [valueCol]: Math.round(value * 100) / 100 // Round to 2 decimals
      };
    });
  }

  return result;
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  visualization?: any;
}

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { mutate: analyze, isPending } = useAnalyzeData();
  const { toast } = useToast();

  const handleDataLoaded = (loadedData: any[], name: string) => {
    setData(loadedData);
    setFileName(name);
    setMessages([{
      role: 'assistant',
      content: `I've successfully loaded **${name}** with ${loadedData.length} rows. \n\nI can help you analyze this data. Try asking questions like:\n- "Show me a bar chart of Sales by Region"\n- "What is the average profit over time?"\n- "Compare categories by total volume"`
    }]);
    toast({
      title: "Data Loaded Successfully",
      description: `Ready to analyze ${loadedData.length} records.`,
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    if (!data.length) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "Please upload a dataset first.",
      });
      return;
    }

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const schema = deduceSchema(data);
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    analyze({
      question: userMsg.content,
      schema,
      history
    }, {
      onSuccess: (result) => {
        let visualizationData = null;

        // If backend suggests a visualization, process the data locally
        if (result.visualization && result.query) {
          const processedData = processData(data, result.query);
          
          visualizationData = {
            type: result.visualization.type,
            config: result.visualization.config,
            data: processedData,
            title: result.visualization.title,
            description: result.visualization.description
          };
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.explanation,
          visualization: visualizationData
        }]);
      },
      onError: (error) => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I encountered an error analyzing your request: ${error.message}. Please try rephrasing.`
        }]);
      }
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearSession = () => {
    if (confirm("Are you sure? This will clear your data and chat history.")) {
      setData([]);
      setFileName(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans">
      {/* Sidebar Area */}
      <aside className="hidden md:flex flex-col w-80 border-r border-border bg-white shadow-sm z-20">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <BarChart2 className="w-5 h-5" />
            </div>
            InsightAI
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Intelligent Data Exploration
          </p>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Current Dataset
              </h3>
              
              {!data.length ? (
                <div className="p-4 border border-dashed rounded-xl bg-slate-50 text-center">
                  <p className="text-sm text-muted-foreground">No data loaded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TableIcon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm truncate max-w-[180px]" title={fileName || ""}>
                        {fileName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {data.length.toLocaleString()} rows • {Object.keys(data[0]).length} columns
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSession}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Clear Data
                  </Button>
                </div>
              )}
            </div>

            {data.length > 0 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Data Preview
                </h3>
                <DataTable data={data} limit={5} className="border-none shadow-none bg-transparent" />
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border/50 text-xs text-center text-slate-400">
          Powered by Claude AI & Recharts
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-gradient-to-br from-slate-50 to-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Header - Mobile Only */}
        <div className="md:hidden p-4 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-30">
          <span className="font-display font-bold text-lg">InsightAI</span>
          {data.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {data.length} rows
            </span>
          )}
        </div>

        {/* Chat Scroll Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
        >
          {/* Welcome / Empty State */}
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto mt-12 md:mt-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 leading-tight">
                  Visualize your data <br/> with natural language
                </h1>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">
                  Upload a CSV or Excel file, ask questions in plain English, and get instant interactive charts and insights.
                </p>
              </div>

              {!data.length && (
                <div className="max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
                  <FileUploader onDataLoaded={handleDataLoaded} />
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="max-w-4xl mx-auto pb-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
            </AnimatePresence>
            
            {isPending && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-sm text-muted-foreground ml-12"
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                </div>
                Analyzing data...
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-border/60 shadow-lg z-20">
          <div className="max-w-3xl mx-auto relative">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative flex items-center shadow-lg rounded-2xl bg-white ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-primary transition-all duration-300"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={data.length ? "Ask a question about your data..." : "Upload data to start chatting..."}
                disabled={!data.length || isPending}
                className="border-none shadow-none focus-visible:ring-0 py-6 px-6 text-base bg-transparent rounded-2xl pr-14 placeholder:text-slate-400"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!input.trim() || isPending || !data.length}
                className={cn(
                  "absolute right-2 w-10 h-10 rounded-xl transition-all duration-300",
                  input.trim() ? "bg-primary hover:bg-primary/90 shadow-md translate-x-0 opacity-100" : "bg-slate-100 text-slate-300 translate-x-2 opacity-50 cursor-not-allowed"
                )}
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </Button>
            </form>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide uppercase">
              AI can make mistakes. Please double-check important results.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
