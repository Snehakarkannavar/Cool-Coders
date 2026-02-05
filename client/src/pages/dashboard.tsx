import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { FileUploader } from "@/components/ui/file-uploader";
import { DataTable } from "@/components/ui/data-table";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReportsView from "./reports-view";
import { useData } from "@/contexts/DataContext";
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
  Maximize2,
  GripVertical,
  Server,
  Cloud,
  Upload,
  Download,
  Check,
  X,
  Presentation,
  Layers,
  Hash,
  CalendarDays,
  Type
} from "lucide-react";
import { useAnalyzeData } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DataSource {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'sql' | 'mongodb';
  size?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'High-level overview with key metrics and charts'
  },
  {
    id: 'detailed',
    name: 'Detailed Analysis',
    description: 'Comprehensive report with tables and visualizations'
  },
  {
    id: 'dashboard',
    name: 'Dashboard Style',
    description: 'Visual dashboard layout with interactive elements'
  }
];

function GenerateReportView({ data, fileName }: { data: any[], fileName: string | null }) {
  const [selectedSources, setSelectedSources] = useState<string[]>(fileName ? [fileName] : []);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('executive');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    console.log('Files uploaded:', files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleGenerateReport = () => {
    console.log('Generating report with:', { selectedSources, selectedTemplate });
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Generate Report</h1>
          <p className="text-sm text-slate-500">Upload data sources, select a template, and generate your report</p>
        </div>

        {/* Upload Area */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Data Sources
          </h3>
          
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-all",
              isDragging 
                ? "border-blue-500 bg-blue-50" 
                : "border-slate-300 bg-slate-50 hover:border-slate-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900 mb-1">
                  Drop your files here
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  or click to browse (Excel, CSV files)
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-8 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Excel/CSV
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                SQL
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                MongoDB
              </div>
            </div>
          </div>

          {/* Current Dataset */}
          {fileName && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Available Data Sources
              </h4>
              <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-900">
                      {fileName}
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data.length} records
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Report Templates */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-purple-600" />
            Choose Report Template
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "p-5 rounded-lg border-2 cursor-pointer transition-all",
                  selectedTemplate === template.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{template.name}</h4>
                  {selectedTemplate === template.id && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                <div className="h-24 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                  Preview
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Generate Actions */}
        <div className="flex items-center justify-between p-6 bg-white rounded-lg border border-slate-200">
          <div>
            <p className="font-medium text-slate-900">
              {fileName ? '1 data source selected' : 'No data source selected'}
            </p>
            <p className="text-sm text-slate-500">
              Template: {reportTemplates.find(t => t.id === selectedTemplate)?.name}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              disabled={!fileName}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={!fileName}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataView({ data, fileName }: { data: any[], fileName: string | null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Data Available</h3>
          <p className="text-sm text-slate-500 mb-6">
            Upload a dataset or connect to a database to view your data
          </p>
          <Button onClick={() => window.location.reload()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Data
          </Button>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});
  
  // Filter data based on search term - searches across all columns
  const filteredData = searchTerm.trim() 
    ? data.filter(row => 
        Object.values(row).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(searchTerm.toLowerCase().trim());
        })
      )
    : data;

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Data Viewer</h1>
            <p className="text-sm text-slate-500">
              {fileName && <span className="font-medium text-slate-700">{fileName}</span>}
              {' '}- {filteredData.length.toLocaleString()} rows × {columns.length} columns
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {searchTerm && (
            <span className="text-sm text-slate-600">
              Found {filteredData.length.toLocaleString()} result{filteredData.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-slate-200">
                    #
                  </th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 font-medium sticky left-0 bg-white border-r border-slate-200">
                      {startIndex + rowIdx + 1}
                    </td>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                          <span className="text-slate-400 italic">null</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length.toLocaleString()} rows
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, columns, fileName, setData, setFileName, detectAndSetColumns } = useData();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'data' | 'generate'>('dashboard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  const { mutate: analyze, isPending } = useAnalyzeData();
  const { toast } = useToast();

  const MIN_CHAT_WIDTH = 250;
  const MAX_CHAT_WIDTH = 600;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_CHAT_WIDTH && newWidth <= MAX_CHAT_WIDTH) {
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleDataLoaded = (loadedData: any[], name: string) => {
    setData(loadedData);
    setFileName(name);
    detectAndSetColumns(loadedData);
    setMessages([{
      role: 'assistant',
      content: `I've successfully loaded **${name}** with ${loadedData.length} rows and ${columns.length} columns. Navigate to Visual Builder or Dashboard Composer to create visuals.`
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
            <Button 
              variant="ghost" 
              className={cn(
                "text-white/80 hover:text-white hover:bg-white/10 px-4",
                currentView === 'dashboard' && "bg-white/10 text-white"
              )}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "text-white/80 hover:text-white hover:bg-white/10 px-4",
                currentView === 'data' && "bg-white/10 text-white"
              )}
              onClick={() => setCurrentView('data')}
            >
              Data Sources
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "text-white/80 hover:text-white hover:bg-white/10 px-4",
                currentView === 'generate' && "bg-white/10 text-white"
              )}
              onClick={() => setCurrentView('generate')}
            >
              Generate Report
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "text-white/80 hover:text-white hover:bg-white/10 px-4",
                currentView === 'reports' && "bg-white/10 text-white"
              )}
              onClick={() => setCurrentView('reports')}
            >
              View Reports
            </Button>
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
        {/* Left Sidebar - Navigation */}
        <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col z-40">
          {/* Navigation Menu */}
          <div className="p-4 space-y-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('dashboard')}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            
            <Button 
              variant={currentView === 'data' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('data')}
            >
              <Database className="w-4 h-4 mr-3" />
              View Data
            </Button>
            
            <Button 
              variant={currentView === 'generate' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('generate')}
            >
              <FileText className="w-4 h-4 mr-3" />
              Generate Report
            </Button>
            
            <Button 
              variant={currentView === 'reports' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('reports')}
            >
              <Download className="w-4 h-4 mr-3" />
              View Reports
            </Button>
            
            <Separator className="bg-slate-100 my-3" />
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
                Visual Analytics
              </p>
              
              <Button 
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => setLocation('/visual-builder')}
              >
                <Layers className="w-4 h-4 mr-3 text-purple-600" />
                <span className="flex-1 text-left">Visual Builder</span>
                <Badge variant="secondary" className="text-[9px] px-1.5">New</Badge>
              </Button>
              
              <Button 
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => setLocation('/dashboard-composer')}
              >
                <Presentation className="w-4 h-4 mr-3 text-cyan-600" />
                <span className="flex-1 text-left">Dashboard Composer</span>
                <Badge variant="secondary" className="text-[9px] px-1.5">New</Badge>
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Data Sources Section */}
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Sources</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Upload Options */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button variant="outline" size="sm" className="h-16 flex flex-col gap-1 text-[10px] bg-slate-50 border-slate-200 hover:border-green-300 hover:bg-green-50">
                <FileText className="w-4 h-4 text-green-600" />
                CSV/Excel
              </Button>
              <Button variant="outline" size="sm" className="h-16 flex flex-col gap-1 text-[10px] bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                <Database className="w-4 h-4 text-blue-600" />
                SQL
              </Button>
              <Button variant="outline" size="sm" className="h-16 flex flex-col gap-1 text-[10px] bg-slate-50 border-slate-200 hover:border-green-300 hover:bg-green-50">
                <Server className="w-4 h-4 text-green-700" />
                MongoDB
              </Button>
              <Button variant="outline" size="sm" className="h-16 flex flex-col gap-1 text-[10px] bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-purple-50">
                <Cloud className="w-4 h-4 text-purple-600" />
                Cloud
              </Button>
            </div>

            <Separator className="bg-slate-100 mb-4" />

            {/* Active Datasets */}
            {data.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer hover:bg-blue-100">
                  <ChevronDown className="w-3 h-3" />
                  <TableIcon className="w-3 h-3" />
                  <span className="truncate flex-1">{fileName}</span>
                </div>
                <div className="pl-6 space-y-1 mt-1">
                  {Object.keys(data[0] || {}).slice(0, 5).map(key => (
                    <div 
                      key={key} 
                      className="flex items-center gap-2 p-1.5 text-[11px] text-slate-600 hover:bg-slate-50 rounded cursor-move group"
                      draggable
                    >
                      <Activity className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                      <span className="truncate">{key}</span>
                    </div>
                  ))}
                  {Object.keys(data[0] || {}).length > 5 && (
                    <div className="text-[10px] text-slate-400 pl-5 py-1">
                      +{Object.keys(data[0] || {}).length - 5} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 text-center py-8 px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                No datasets connected
              </div>
            )}
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-slate-500 hover:text-slate-900">
              <Plus className="w-3 h-3 mr-2" /> Add New Source
            </Button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentView === 'dashboard' ? (
            <>
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
            </>
          ) : currentView === 'generate' ? (
            /* Generate Report View */
            <GenerateReportView data={data} fileName={fileName} />
          ) : currentView === 'reports' ? (
            /* View Reports */
            <ReportsView />
          ) : (
            /* Data View */
            <DataView data={data} fileName={fileName} />
          )}
        </main>

        {/* Right Sidebar - AI Assistant */}
        <aside 
          className={cn(
            "bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-40 relative",
            isChatOpen ? "" : "w-12"
          )}
          style={isChatOpen ? { width: `${chatWidth}px` } : undefined}
        >
          {/* Resize Handle */}
          {isChatOpen && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-blue-400 cursor-ew-resize transition-all group z-50"
              onMouseDown={handleMouseDown}
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-md px-1 py-2 shadow-lg">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>
          )}
          
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
