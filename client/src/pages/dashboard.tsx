import { useState, useRef, useEffect } from "react";
import { FileUploader } from "@/components/ui/file-uploader";
import { DataTable } from "@/components/ui/data-table";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart2, 
  Table as TableIcon, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  Database, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Bell, 
  User, 
  Plus, 
  Calendar, 
  MapPin, 
  Package, 
  DollarSign,
  ChevronDown,
  LineChart,
  PieChart,
  Map,
  Activity,
  Maximize2
} from "lucide-react";
import { useAnalyzeData } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { mutate: analyze, isPending } = useAnalyzeData();
  const { toast } = useToast();

  const handleDataLoaded = (loadedData: any[], name: string) => {
    setData(loadedData);
    setFileName(name);
    setMessages([{
      role: 'assistant',
      content: `I've successfully loaded **${name}**. Ready to build your dashboard.`
    }]);
  };

  const handleSend = () => {
    if (!input.trim() || !data.length) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // Existing analysis logic integration...
    analyze({ question: input, schema: {}, history: [] }, {
      onSuccess: (result) => {
        setMessages(prev => [...prev, { role: 'assistant', content: result.explanation, visualization: result.visualization }]);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      {/* Top Navigation */}
      <header className="h-[60px] nav-gradient flex items-center justify-between px-6 text-white z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold font-display tracking-tight">DataSense AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 px-4">Dashboard</Button>
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 px-4">Data Sources</Button>
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 px-4">Reports</Button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/20" />
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">JS</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Data Sources */}
        <aside className="w-[200px] bg-white border-r border-slate-200 flex flex-col z-40">
          <div className="p-4 flex flex-col gap-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Add Source</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-16 flex flex-col gap-1 text-[10px] bg-slate-50 border-slate-200">
                  <FileText className="w-4 h-4 text-green-600" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" className="h-16 flex flex-col gap-1 text-[10px] bg-slate-50 border-slate-200">
                  <Database className="w-4 h-4 text-blue-600" />
                  SQL
                </Button>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="flex-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Datasets</h3>
              {data.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer">
                    <ChevronDown className="w-3 h-3" />
                    <TableIcon className="w-3 h-3" />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <div className="pl-6 space-y-1 mt-1">
                    {Object.keys(data[0] || {}).map(key => (
                      <div key={key} className="flex items-center gap-2 p-1.5 text-[11px] text-slate-600 hover:bg-slate-50 rounded cursor-move group">
                        <Activity className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                        <span className="truncate">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 text-center py-8 px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No datasets active
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-slate-500 hover:text-slate-900">
              <Plus className="w-3 h-3 mr-2" /> Add New Source
            </Button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto p-8 relative">
            <div className="max-w-6xl mx-auto min-h-full">
              {messages.filter(m => m.visualization).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {messages.filter(m => m.visualization).map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[400px] flex flex-col group relative"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800">{msg.visualization.title || 'Analysis'}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Maximize2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex-1 w-full bg-slate-50/50 rounded-lg flex items-center justify-center border border-slate-100 italic text-slate-400">
                        {/* Visualization Component Integration */}
                        [Interactive Chart View]
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  {!data.length ? (
                    <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                      <FileUploader onDataLoaded={handleDataLoaded} />
                      <p className="mt-6 text-sm text-slate-500">
                        Drag field to canvas or ask the AI assistant to start building
                      </p>
                    </div>
                  ) : (
                    <div className="animate-pulse flex flex-col items-center gap-4 text-slate-300">
                      <div className="w-24 h-24 rounded-full border-4 border-dashed border-current flex items-center justify-center">
                        <Plus className="w-8 h-8" />
                      </div>
                      <p className="text-lg font-medium">Ready for your first visualization</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visualization Gallery (Bottom Bar) */}
          <footer className="h-[60px] bg-white border-t border-slate-200 flex items-center px-6 gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-4 whitespace-nowrap">Visuals</span>
            {[
              { icon: BarChart2, label: "Bar" },
              { icon: LineChart, label: "Line" },
              { icon: PieChart, label: "Pie" },
              { icon: TableIcon, label: "Table" },
              { icon: Map, label: "Map" },
              { icon: Activity, label: "Gauge" },
            ].map((item, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300">
                    <item.icon className="w-4 h-4 text-slate-600" />
                    <span className="text-[11px] font-medium text-slate-700">{item.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Add {item.label} Chart</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </footer>
        </main>

        {/* Right Sidebar - AI Assistant */}
        <aside 
          className={cn(
            "bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-40",
            isChatOpen ? "w-[300px]" : "w-12"
          )}
        >
          <div className="flex items-center justify-between p-3 border-b border-slate-100 h-[60px]">
            {isChatOpen && <span className="font-bold text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> AI Assistant</span>}
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => setIsChatOpen(!isChatOpen)}>
              <LayoutDashboard className="w-4 h-4" />
            </Button>
          </div>

          {isChatOpen && (
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                  ))}
                  {isPending && (
                    <div className="flex gap-1 p-3">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-slate-100">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="pr-10 py-5 text-xs bg-slate-50 border-slate-200 focus:ring-1 focus:ring-blue-500"
                    disabled={!data.length}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700"
                    disabled={!input.trim() || !data.length}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 w-full mb-1">Quick Prompts:</span>
                  <button onClick={() => setInput("Show sales by region")} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">"Sales by region"</button>
                  <button onClick={() => setInput("Top 5 products")} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">"Top 5 products"</button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
