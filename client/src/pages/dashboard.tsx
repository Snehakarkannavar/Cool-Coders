import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { FileUploader } from "@/components/ui/file-uploader";
import { DataTable } from "@/components/ui/data-table";
import { MessageBubble } from "@/components/chat/message-bubble";
import { DatasetManager } from "@/components/dashboard/DatasetManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/DataContext";
import { SQLConnectionDialog } from "@/components/sql-connection-dialog";
import { MongoDBConnectionDialog } from "@/components/mongodb-connection-dialog";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { 
  Assessment as BarChart2Icon,
  TableChart as TableIcon,
  Delete as Trash2Icon,
  ArrowForward as ArrowRightIcon,
  HourglassEmpty as Loader2Icon,
  Storage as DatabaseIcon,
  Dashboard as LayoutDashboardIcon,
  Description as FileTextIcon,
  Add as PlusIcon,
  ExpandMore as ChevronDownIcon,
  TrendingUp as LineChartIcon,
  PieChart as PieChartIcon,
  Place as MapIcon,
  ShowChart as ActivityIcon,
  Fullscreen as Maximize2Icon,
  DragIndicator as GripVerticalIcon,
  CloudUpload as CloudIcon,
  CloudDownload as DownloadIcon,
  CheckCircle as CheckIcon,
  Close as XIcon,
  Slideshow as PresentationIcon,
  Layers as LayersIcon,
  Numbers as HashIcon,
  CalendarToday as CalendarDaysIcon,
  TextFields as TypeIcon,
  Timeline as AreaChartIcon,
  Summarize as SummarizeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAnalyzeData } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

interface DataSource {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'sql' | 'mongodb';
  size?: string;
}

export default function Dashboard() {
  const { data, columns, fileName, dataSources, addDataSource, setData, setFileName, detectAndSetColumns } = useData();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [showSQLDialog, setShowSQLDialog] = useState(false);
  const [showMongoDialog, setShowMongoDialog] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);
  const [showSheets, setShowSheets] = useState(false);
  const [showDashboards, setShowDashboards] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [sheets, setSheets] = useState([{ id: 1, name: 'Sheet 1' }]);
  const [dashboards, setDashboards] = useState([{ id: 1, name: 'Dashboard 1' }]);
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

  const handleDataLoaded = (loadedData: any[], name: string, type: 'file' | 'sql' | 'mongodb' = 'file') => {
    // Detect columns for the new data source
    let detectedColumns: Array<{id: string; name: string; type: 'string' | 'number' | 'date' | 'boolean'}> = [];
    
    if (loadedData.length > 0) {
      const sampleRow = loadedData[0];
      detectedColumns = Object.keys(sampleRow).map(key => {
        const value = sampleRow[key];
        let columnType: 'string' | 'number' | 'date' | 'boolean' = 'string';
        
        if (typeof value === 'number') {
          columnType = 'number';
        } else if (typeof value === 'boolean') {
          columnType = 'boolean';
        } else if (value && !isNaN(Date.parse(value))) {
          columnType = 'date';
        }

        return {
          id: key,
          name: key,
          type: columnType
        };
      });
    }
    
    // Create a new data source
    const newDataSource = {
      id: Date.now().toString(),
      name: name,
      type: type,
      data: loadedData,
      columns: detectedColumns
    };
    
    // Add to data sources
    addDataSource(newDataSource);
    
    // Set as active data
    setData(loadedData);
    setFileName(name);
    detectAndSetColumns(loadedData);
    
    setMessages([{
      role: 'assistant',
      content: `I've successfully loaded **${name}** with ${loadedData.length} rows and ${detectedColumns.length} columns.`
    }]);
  };

  const handleSend = () => {
    if (!input.trim() || !data.length) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    analyze({ question: input, schema: {}, history: [] }, {
      onSuccess: (result) => {
        setMessages(prev => [...prev, { role: 'assistant', content: result.explanation, visualization: result.visualization }]);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#f3f2f1]">
      {/* Top Navigation - Tableau style */}
      <header className="h-12 bg-[#2E8B57] flex items-center justify-between px-4 text-black border-b border-[#1e6f4f]">
        <div className="flex items-center gap-2">
          <BarChart2Icon className="w-6 h-6 text-black" />
          <span className="text-lg font-semibold tracking-tight">DataSights</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm text-[#2E8B57]">JS</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tableau style navigation */}
        <aside className="w-[220px] bg-white border-r border-[#e1dfdd] flex flex-col">
          <div className="p-3 space-y-1">
            <Button 
              variant="ghost"
              className="w-full justify-start font-semibold text-[#2E8B57] bg-[#d4f1e5] hover:bg-[#d4f1e5]"
              onClick={() => setShowDataSources(!showDataSources)}
            >
              <DatabaseIcon className="w-4 h-4 mr-3" />
              Get Data
            </Button>

            {showDataSources && (
              <div className="pl-4 space-y-1 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-[#dff6dd]"
                  onClick={() => setShowFileDialog(true)}
                >
                  <FileTextIcon className="w-3 h-3 mr-2 text-[#107c10]" />
                  CSV/Excel Files
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-[#d4f1e5]"
                  onClick={() => setShowSQLDialog(true)}
                >
                  <DatabaseIcon className="w-3 h-3 mr-2 text-[#2E8B57]" />
                  SQL Database
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-[#dff6dd]"
                  onClick={() => setShowMongoDialog(true)}
                >
                  <DatabaseIcon className="w-3 h-3 mr-2 text-[#107c10]" />
                  MongoDB
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-[#f3f0f7]"
                  onClick={() => {}}
                >
                  <CloudIcon className="w-3 h-3 mr-2 text-[#8764b8]" />
                  Cloud Services
                </Button>
              </div>
            )}

            <Separator className="my-2" />
            
            {/* Sheets Section */}
            <div className="space-y-1">
              <Button 
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-[#f3f2f1]"
                onClick={() => {
                  setShowSheets(!showSheets);
                  setLocation('/visual-builder');
                }}
              >
                <LayersIcon className="w-4 h-4 mr-3 text-[#8764b8]" />
                <span className="flex-1 text-left">Sheets</span>
                <ChevronDownIcon className={cn("w-3 h-3 transition-transform", showSheets && "rotate-180")} />
              </Button>

              {showSheets && (
                <div className="pl-4 space-y-1 mt-1">
                  {sheets.map(sheet => (
                    <div 
                      key={sheet.id}
                      className="flex items-center gap-1 p-1 rounded hover:bg-[#f3f2f1] group"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start text-xs h-7"
                        onClick={() => setLocation('/visual-builder')}
                      >
                        <FileTextIcon className="w-3 h-3 mr-2" />
                        {sheet.name}
                      </Button>
                      {sheets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => setSheets(sheets.filter(s => s.id !== sheet.id))}
                        >
                          <XIcon className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-[#605e5c] hover:text-[#323130]"
                    onClick={() => setSheets([...sheets, { id: sheets.length + 1, name: `Sheet ${sheets.length + 1}` }])}
                  >
                    <PlusIcon className="w-3 h-3 mr-2" />
                    Add Sheet
                  </Button>
                </div>
              )}
            </div>

            <Separator className="my-2" />

            {/* Dashboards Section */}
            <div className="space-y-1">
              <Button 
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-[#f3f2f1]"
                onClick={() => {
                  setShowDashboards(!showDashboards);
                  setLocation('/dashboard-composer');
                }}
              >
                <PresentationIcon className="w-4 h-4 mr-3 text-[#2E8B57]" />
                <span className="flex-1 text-left">Dashboards</span>
                <ChevronDownIcon className={cn("w-3 h-3 transition-transform", showDashboards && "rotate-180")} />
              </Button>

              {showDashboards && (
                <div className="pl-4 space-y-1 mt-1">
                  {dashboards.map(dashboard => (
                    <div 
                      key={dashboard.id}
                      className="flex items-center gap-1 p-1 rounded hover:bg-[#f3f2f1] group"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start text-xs h-7"
                        onClick={() => setLocation('/dashboard-composer')}
                      >
                        <LayoutDashboardIcon className="w-3 h-3 mr-2" />
                        {dashboard.name}
                      </Button>
                      {dashboards.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => setDashboards(dashboards.filter(d => d.id !== dashboard.id))}
                        >
                          <XIcon className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-[#605e5c] hover:text-[#323130]"
                    onClick={() => setDashboards([...dashboards, { id: dashboards.length + 1, name: `Dashboard ${dashboards.length + 1}` }])}
                  >
                    <PlusIcon className="w-3 h-3 mr-2" />
                    Add Dashboard
                  </Button>
                </div>
              )}
            </div>

            <Separator className="my-2" />

            {/* Reports Section - NEW */}
            <div className="space-y-1">
              <Button 
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-[#f3f2f1]"
                onClick={() => {
                  setShowReports(!showReports);
                  setLocation('/reports');
                }}
              >
                <SummarizeIcon className="w-4 h-4 mr-3 text-[#d13438]" />
                <span className="flex-1 text-left">Reports</span>
                <ChevronDownIcon className={cn("w-3 h-3 transition-transform", showReports && "rotate-180")} />
              </Button>

              {showReports && (
                <div className="pl-4 space-y-1 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs hover:bg-[#fff4ce]"
                    onClick={() => setLocation('/reports')}
                  >
                    <PlusIcon className="w-3 h-3 mr-2" />
                    Generate Report
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs hover:bg-[#d4f1e5]"
                    onClick={() => setLocation('/reports')}
                  >
                    <VisibilityIcon className="w-3 h-3 mr-2" />
                    View Reports
                  </Button>
                </div>
              )}
            </div>

            <Separator className="my-2" />

            {/* Visuals Section */}
            <div className="space-y-1">
              <Button 
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-[#f3f2f1]"
                onClick={() => setShowVisuals(!showVisuals)}
              >
                <BarChart2Icon className="w-4 h-4 mr-3 text-[#2E8B57]" />
                <span className="flex-1 text-left">Visuals</span>
                <ChevronDownIcon className={cn("w-3 h-3 transition-transform", showVisuals && "rotate-180")} />
              </Button>

              {showVisuals && (
                <div className="pl-4 grid grid-cols-2 gap-1 mt-1">
                  <Button variant="outline" size="sm" className="h-12 flex flex-col gap-0.5 text-[10px]">
                    <BarChart2Icon className="w-3 h-3" />
                    Bar
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col gap-0.5 text-[10px]">
                    <LineChartIcon className="w-3 h-3" />
                    Line
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col gap-0.5 text-[10px]">
                    <PieChartIcon className="w-3 h-3" />
                    Pie
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col gap-0.5 text-[10px]">
                    <AreaChartIcon className="w-3 h-3" />
                    Area
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col gap-0.5 text-[10px]">
                    <TableIcon className="w-3 h-3" />
                    Table
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col gap-0.5 text-[10px]">
                    <ActivityIcon className="w-3 h-3" />
                    Scatter
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Active Datasets Section */}
          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-[#605e5c] uppercase tracking-wider">Active Data</h3>
            </div>

            {data.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 rounded bg-[#d4f1e5] text-[#2E8B57] text-xs font-semibold cursor-pointer hover:bg-[#b8e6d5]">
                  <ChevronDownIcon className="w-3 h-3" />
                  <TableIcon className="w-3 h-3" />
                  <span className="truncate flex-1">{fileName}</span>
                </div>
                <div className="pl-6 space-y-1 mt-1">
                  {Object.keys(data[0] || {}).slice(0, 5).map(key => (
                    <div 
                      key={key} 
                      className="flex items-center gap-2 p-1.5 text-[11px] text-[#605e5c] hover:bg-[#f3f2f1] rounded cursor-move group"
                      draggable
                    >
                      <ActivityIcon className="w-3 h-3 text-[#8a8886] group-hover:text-[#2E8B57]" />
                      <span className="truncate">{key}</span>
                    </div>
                  ))}
                  {Object.keys(data[0] || {}).length > 5 && (
                    <div className="text-[10px] text-[#8a8886] pl-5 py-1">
                      +{Object.keys(data[0] || {}).length - 5} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-[#8a8886] text-center py-8 px-4 bg-[#faf9f8] rounded border border-dashed border-[#e1dfdd]">
                No datasets connected
              </div>
            )}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto p-8 relative">
            <div className="max-w-6xl mx-auto min-h-full">
              {dataSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="max-w-md w-full">
                    <FileUploader onDataLoaded={handleDataLoaded} />
                    <p className="mt-6 text-sm text-[#605e5c]">
                      Upload your first dataset or connect to a data source to get started
                    </p>
                  </div>
                </div>
              ) : (
                <DatasetManager onDatasetSelect={(datasetId) => {
                  // Handle dataset selection if needed
                  console.log('Selected dataset:', datasetId);
                }} />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <FileUploadDialog 
        open={showFileDialog}
        onOpenChange={setShowFileDialog}
        onDataLoaded={(data: any[], fileName: string) => {
          handleDataLoaded(data, fileName, 'file');
          setShowFileDialog(false);
        }}
      />

      <SQLConnectionDialog 
        open={showSQLDialog}
        onOpenChange={setShowSQLDialog}
        onConnect={(result: { rows: any[] }) => {
          handleDataLoaded(result.rows, 'SQL Query Result', 'sql');
          setShowSQLDialog(false);
        }}
      />

      <MongoDBConnectionDialog 
        open={showMongoDialog}
        onOpenChange={setShowMongoDialog}
        onConnect={(result: { rows: any[] }) => {
          handleDataLoaded(result.rows, 'MongoDB Query Result', 'mongodb');
          setShowMongoDialog(false);
        }}
      />
    </div>
  );
}
