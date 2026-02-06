import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Assessment as BarChart3Icon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterChartIcon,
  AreaChart as AreaChartIcon,
  TableChart as Table2Icon,
  Add as PlusIcon,
  Delete as Trash2Icon,
  GetApp as DownloadIcon,
  Visibility as EyeIcon,
  DragIndicator as GripVerticalIcon,
  Close as XIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  Numbers as HashIcon,
  CalendarToday as CalendarDaysIcon,
  TextFields as TypeIcon,
  Functions as FunctionsIcon,
  TrendingUp as TrendingUpIcon,
  Straighten as StraightenIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart as RechartsScatterChart,
  Scatter,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface Column {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
}

interface Visual {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  xAxis?: string;
  yAxis?: string[];
  colorField?: string;
  sizeField?: string;
  labelField?: string;
  filters?: any;
  data?: any[];
}

interface Sheet {
  id: string;
  name: string;
  visuals: Visual[];
}

// Tableau color palette
const TABLEAU_COLORS = [
  '#2E8B57', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
  '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
];

// Chart renderer with Tableau styling
function ChartRenderer({ visual, data }: { visual: Visual; data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#666666] bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-sm">Drop more fields to build your view</p>
        </div>
      </div>
    );
  }

  const chartProps = {
    margin: { top: 10, right: 30, left: 0, bottom: 0 }
  };

  switch (visual.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis 
              dataKey={visual.xAxis || 'name'} 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #cccccc',
                borderRadius: '2px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {visual.yAxis?.map((yKey, index) => (
              <Bar 
                key={yKey} 
                dataKey={yKey} 
                fill={TABLEAU_COLORS[index % TABLEAU_COLORS.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis 
              dataKey={visual.xAxis || 'name'}
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #cccccc',
                borderRadius: '2px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {visual.yAxis?.map((yKey, index) => (
              <Line 
                key={yKey} 
                type="monotone" 
                dataKey={yKey} 
                stroke={TABLEAU_COLORS[index % TABLEAU_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis 
              dataKey={visual.xAxis || 'name'}
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #cccccc',
                borderRadius: '2px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {visual.yAxis?.map((yKey, index) => (
              <Area 
                key={yKey} 
                type="monotone" 
                dataKey={yKey} 
                fill={TABLEAU_COLORS[index % TABLEAU_COLORS.length]}
                fillOpacity={0.6}
                stroke={TABLEAU_COLORS[index % TABLEAU_COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      );

    case 'pie':
      const pieData = data.map((item) => ({
        name: item[visual.xAxis || 'name'],
        value: item[visual.yAxis?.[0] || 'value'],
      }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie 
              data={pieData} 
              cx="50%" 
              cy="50%" 
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80} 
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={TABLEAU_COLORS[index % TABLEAU_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #cccccc',
                fontSize: '12px'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsScatterChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis 
              dataKey={visual.xAxis || 'x'} 
              type="number"
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <YAxis 
              dataKey={visual.yAxis?.[0] || 'y'} 
              type="number"
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#e6e6e6' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #cccccc',
                fontSize: '12px'
              }}
            />
            <Scatter 
              name="Data" 
              data={data} 
              fill={TABLEAU_COLORS[0]}
            />
          </RechartsScatterChart>
        </ResponsiveContainer>
      );

    case 'table':
      return (
        <div className="h-full overflow-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#f5f5f5] sticky top-0">
              <tr>
                {visual.xAxis && (
                  <th className="p-2 text-left font-semibold border-b border-[#cccccc] text-[#333333]">
                    {visual.xAxis}
                  </th>
                )}
                {visual.yAxis?.map((col) => (
                  <th key={col} className="p-2 text-left font-semibold border-b border-[#cccccc] text-[#333333]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-[#f5f5f5] border-b border-[#e6e6e6]">
                  {visual.xAxis && (
                    <td className="p-2 text-[#333333]">{row[visual.xAxis]}</td>
                  )}
                  {visual.yAxis?.map((col) => (
                    <td key={col} className="p-2 text-[#333333]">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div>Unsupported chart type</div>;
  }
}

export default function VisualBuilder() {
  const { data: contextData, columns: contextColumns, fileName } = useData();
  const [, setLocation] = useLocation();
  
  const sampleData = [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000, customers: 120 },
    { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000, customers: 145 },
    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000, customers: 132 },
    { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000, customers: 167 },
    { month: 'May', revenue: 55000, expenses: 36000, profit: 19000, customers: 151 },
    { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000, customers: 189 },
  ];

  const defaultColumns: Column[] = [
    { id: 'month', name: 'Month', type: 'string' },
    { id: 'revenue', name: 'Revenue', type: 'number' },
    { id: 'expenses', name: 'Expenses', type: 'number' },
    { id: 'profit', name: 'Profit', type: 'number' },
    { id: 'customers', name: 'Customers', type: 'number' },
  ];

  const displayData = contextData.length > 0 ? contextData : sampleData;
  const displayColumns = contextColumns.length > 0 ? contextColumns : defaultColumns;

  const [sheets, setSheets] = useState<Sheet[]>([
    { id: 'sheet-1', name: 'Sheet 1', visuals: [] },
  ]);

  const [activeSheetId, setActiveSheetId] = useState('sheet-1');
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [dataPaneMode, setDataPaneMode] = useState<'DATA' | 'ANALYTICS'>('DATA');

  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const selectedVisual = activeSheet?.visuals.find((v) => v.id === selectedVisualId);

  // Separate dimensions and measures
  const dimensions = displayColumns.filter(col => col.type === 'string' || col.type === 'date');
  const measures = displayColumns.filter(col => col.type === 'number');

  const addSheet = () => {
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      visuals: [],
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
  };

  const addVisual = () => {
    if (!activeSheet) return;

    const firstDimension = dimensions[0]?.id || displayColumns[0]?.id;
    const firstMeasure = measures[0]?.id || displayColumns[1]?.id;

    const newVisual: Visual = {
      id: `visual-${Date.now()}`,
      name: `Sheet ${activeSheet.visuals.length + 1}`,
      type: 'bar',
      xAxis: firstDimension,
      yAxis: [firstMeasure],
      data: displayData,
    };

    setSheets(
      sheets.map((sheet) =>
        sheet.id === activeSheetId ? { ...sheet, visuals: [...sheet.visuals, newVisual] } : sheet
      )
    );
    setSelectedVisualId(newVisual.id);
  };

  const deleteVisual = (visualId: string) => {
    setSheets(
      sheets.map((sheet) =>
        sheet.id === activeSheetId ? { ...sheet, visuals: sheet.visuals.filter((v) => v.id !== visualId) } : sheet
      )
    );
    if (selectedVisualId === visualId) {
      setSelectedVisualId(null);
    }
  };

  const updateVisual = (visualId: string, updates: Partial<Visual>) => {
    setSheets(
      sheets.map((sheet) =>
        sheet.id === activeSheetId
          ? {
              ...sheet,
              visuals: sheet.visuals.map((v) => (v.id === visualId ? { ...v, ...updates } : v)),
            }
          : sheet
      )
    );
  };

  const handleColumnDrop = (columnId: string, zone: 'xAxis' | 'yAxis' | 'color' | 'size' | 'label') => {
    if (!selectedVisual) return;

    if (zone === 'xAxis') {
      updateVisual(selectedVisual.id, { xAxis: columnId });
    } else if (zone === 'yAxis') {
      const currentYAxis = selectedVisual.yAxis || [];
      if (!currentYAxis.includes(columnId)) {
        updateVisual(selectedVisual.id, { yAxis: [...currentYAxis, columnId] });
      }
    } else if (zone === 'color') {
      updateVisual(selectedVisual.id, { colorField: columnId });
    } else if (zone === 'size') {
      updateVisual(selectedVisual.id, { sizeField: columnId });
    } else if (zone === 'label') {
      updateVisual(selectedVisual.id, { labelField: columnId });
    }
  };

  const removeYAxis = (columnId: string) => {
    if (selectedVisual) {
      updateVisual(selectedVisual.id, {
        yAxis: selectedVisual.yAxis?.filter((y) => y !== columnId),
      });
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <HashIcon className="h-3.5 w-3.5 text-[#ff7f0e]" />;
      case 'date':
        return <CalendarDaysIcon className="h-3.5 w-3.5 text-[#1f77b4]" />;
      default:
        return <TypeIcon className="h-3.5 w-3.5 text-[#1f77b4]" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
      {/* Tableau top bar */}
      <div className="h-10 bg-[#2E8B57] border-b border-[#1e6f4f] flex items-center px-3 gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/')}
          className="h-7 text-xs text-black hover:bg-black/10"
        >
          <HomeIcon className="h-3.5 w-3.5 mr-1" />
          Home
        </Button>
        <div className="h-5 w-px bg-black/20" />
        <span className="text-sm font-semibold text-black">Visual Builder</span>
        {fileName && (
          <>
            <div className="h-5 w-px bg-black/20 ml-2" />
            <span className="text-xs text-black">{fileName}</span>
          </>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <SaveIcon className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <DownloadIcon className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Data Pane (Tableau style) */}
        <div className="w-64 bg-white border-r border-[#d3d3d3] flex flex-col">
          {/* Data/Analytics toggle */}
          <div className="h-10 border-b border-[#d3d3d3] flex">
            <button
              onClick={() => setDataPaneMode('DATA')}
              className={cn(
                "flex-1 text-xs font-semibold transition-colors",
                dataPaneMode === 'DATA' 
                  ? "bg-white text-[#333333] border-b-2 border-[#ff7f0e]" 
                  : "bg-[#f5f5f5] text-[#666666] hover:bg-[#e6e6e6]"
              )}
            >
              Data
            </button>
            <button
              onClick={() => setDataPaneMode('ANALYTICS')}
              className={cn(
                "flex-1 text-xs font-semibold transition-colors",
                dataPaneMode === 'ANALYTICS' 
                  ? "bg-white text-[#333333] border-b-2 border-[#ff7f0e]" 
                  : "bg-[#f5f5f5] text-[#666666] hover:bg-[#e6e6e6]"
              )}
            >
              Analytics
            </button>
          </div>

          <ScrollArea className="flex-1">
            {dataPaneMode === 'DATA' ? (
              <div className="p-3 space-y-4">
                {/* Connections */}
                <div>
                  <div className="text-xs font-semibold text-[#666666] mb-2">Connections</div>
                  <div className="flex items-center gap-2 p-2 bg-[#f5f5f5] rounded text-xs">
                    <div className="w-4 h-4 bg-[#2E8B57] rounded-sm" />
                    <span className="text-[#333333]">{fileName || 'Sample Data'}</span>
                  </div>
                </div>

                {/* Dimensions (Blue pills) */}
                <div>
                  <div className="text-xs font-semibold text-[#666666] mb-2 flex items-center gap-1">
                    Dimensions
                    <Badge className="bg-[#2E8B57] text-white text-[10px] h-4 px-1">
                      {dimensions.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {dimensions.map((column) => (
                      <div
                        key={column.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('columnId', column.id);
                          e.dataTransfer.setData('columnType', 'dimension');
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#e6e6e6] rounded cursor-move group"
                      >
                        <GripVerticalIcon className="h-3 w-3 text-[#999999] opacity-0 group-hover:opacity-100" />
                        {getFieldIcon(column.type)}
                        <span className="text-xs text-[#333333] flex-1">{column.name}</span>
                        <div className="w-2 h-2 rounded-full bg-[#2E8B57]" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Measures (Green pills) */}
                <div>
                  <div className="text-xs font-semibold text-[#666666] mb-2 flex items-center gap-1">
                    Measures
                    <Badge className="bg-[#59a14f] text-white text-[10px] h-4 px-1">
                      {measures.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {measures.map((column) => (
                      <div
                        key={column.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('columnId', column.id);
                          e.dataTransfer.setData('columnType', 'measure');
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#e6e6e6] rounded cursor-move group"
                      >
                        <GripVerticalIcon className="h-3 w-3 text-[#999999] opacity-0 group-hover:opacity-100" />
                        {getFieldIcon(column.type)}
                        <span className="text-xs text-[#333333] flex-1">{column.name}</span>
                        <div className="w-2 h-2 rounded-full bg-[#59a14f]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Analytics pane
              <div className="p-3 space-y-3">
                <div className="text-xs text-[#666666] mb-2">Drag to add reference lines and trends</div>
                <div className="space-y-1">
                  {['Average Line', 'Trend Line', 'Reference Line', 'Forecast'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 p-2 hover:bg-[#e6e6e6] rounded cursor-move"
                    >
                      <TrendingUpIcon className="h-3.5 w-3.5 text-[#666666]" />
                      <span className="text-xs text-[#333333]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* CENTER: Worksheet area */}
        <div className="flex-1 flex flex-col">
          {/* Shelves area (Columns/Rows) */}
          <div className="bg-white border-b border-[#d3d3d3]">
            {/* Columns shelf */}
            <div className="flex items-center border-b border-[#e6e6e6]">
              <div className="w-20 h-8 flex items-center justify-center bg-[#f5f5f5] border-r border-[#e6e6e6]">
                <span className="text-xs font-semibold text-[#666666]">Columns</span>
              </div>
              <div 
                className="flex-1 h-8 flex items-center px-2 gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnId = e.dataTransfer.getData('columnId');
                  handleColumnDrop(columnId, 'xAxis');
                }}
              >
                {selectedVisual?.xAxis ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#2E8B57] text-white rounded text-xs">
                    <span>{displayColumns.find(c => c.id === selectedVisual.xAxis)?.name}</span>
                    <button onClick={() => updateVisual(selectedVisual.id, { xAxis: undefined })}>
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#999999] italic">Drop field here</span>
                )}
              </div>
            </div>

            {/* Rows shelf */}
            <div className="flex items-center">
              <div className="w-20 h-8 flex items-center justify-center bg-[#f5f5f5] border-r border-[#e6e6e6]">
                <span className="text-xs font-semibold text-[#666666]">Rows</span>
              </div>
              <div 
                className="flex-1 h-8 flex items-center px-2 gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnId = e.dataTransfer.getData('columnId');
                  handleColumnDrop(columnId, 'yAxis');
                }}
              >
                {selectedVisual?.yAxis && selectedVisual.yAxis.length > 0 ? (
                  selectedVisual.yAxis.map((yCol) => (
                    <div key={yCol} className="flex items-center gap-1 px-2 py-0.5 bg-[#59a14f] text-white rounded text-xs">
                      <FunctionsIcon className="h-3 w-3" />
                      <span>SUM({displayColumns.find(c => c.id === yCol)?.name})</span>
                      <button onClick={() => removeYAxis(yCol)}>
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-[#999999] italic">Drop field here</span>
                )}
              </div>
            </div>
          </div>

          {/* Main canvas and marks card */}
          <div className="flex-1 flex overflow-hidden">
            {/* Marks Card */}
            {selectedVisual && (
              <div className="w-56 bg-white border-r border-[#d3d3d3] p-3 space-y-3">
                <div className="text-xs font-semibold text-[#666666]">Marks</div>
                
                {/* Mark type selector */}
                <div>
                  <Select
                    value={selectedVisual.type}
                    onValueChange={(value: any) => updateVisual(selectedVisual.id, { type: value })}
                  >
                    <SelectTrigger className="h-7 text-xs border-[#d3d3d3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar" className="text-xs">
                        <div className="flex items-center gap-2">
                          <BarChart3Icon className="h-3.5 w-3.5" />
                          Bar
                        </div>
                      </SelectItem>
                      <SelectItem value="line" className="text-xs">
                        <div className="flex items-center gap-2">
                          <LineChartIcon className="h-3.5 w-3.5" />
                          Line
                        </div>
                      </SelectItem>
                      <SelectItem value="area" className="text-xs">
                        <div className="flex items-center gap-2">
                          <AreaChartIcon className="h-3.5 w-3.5" />
                          Area
                        </div>
                      </SelectItem>
                      <SelectItem value="pie" className="text-xs">
                        <div className="flex items-center gap-2">
                          <PieChartIcon className="h-3.5 w-3.5" />
                          Pie
                        </div>
                      </SelectItem>
                      <SelectItem value="scatter" className="text-xs">
                        <div className="flex items-center gap-2">
                          <ScatterChartIcon className="h-3.5 w-3.5" />
                          Scatter
                        </div>
                      </SelectItem>
                      <SelectItem value="table" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Table2Icon className="h-3.5 w-3.5" />
                          Table
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-[#e6e6e6]" />

                {/* Marks properties */}
                <div className="space-y-2">
                  {['Color', 'Size', 'Label', 'Detail', 'Tooltip'].map((property) => (
                    <div key={property}>
                      <div 
                        className="text-xs text-[#666666] mb-1 p-1.5 hover:bg-[#f5f5f5] rounded border border-dashed border-[#d3d3d3]"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const columnId = e.dataTransfer.getData('columnId');
                          handleColumnDrop(columnId, property.toLowerCase() as any);
                        }}
                      >
                        {property}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart canvas */}
            <div className="flex-1 bg-white p-4 overflow-auto">
              {activeSheet && activeSheet.visuals.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-[#666666]">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-sm mb-2">Drag and drop fields to get started</p>
                    <Button 
                      onClick={addVisual}
                      className="mt-4 bg-[#2E8B57] hover:bg-[#1e6f4f] text-white text-xs h-7"
                    >
                      <PlusIcon className="h-3.5 w-3.5 mr-1" />
                      New Sheet
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSheet?.visuals.map((visual) => (
                    <Card
                      key={visual.id}
                      className={cn(
                        "border-[#d3d3d3] cursor-pointer transition-all",
                        selectedVisualId === visual.id && "ring-2 ring-[#2E8B57]"
                      )}
                      onClick={() => setSelectedVisualId(visual.id)}
                    >
                      <div className="p-2 bg-[#f5f5f5] border-b border-[#d3d3d3] flex items-center justify-between">
                        <Input
                          value={visual.name}
                          onChange={(e) => updateVisual(visual.id, { name: e.target.value })}
                          className="h-6 text-xs font-semibold border-none bg-transparent focus-visible:ring-0 px-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {visual.type}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVisual(visual.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-[#e6e6e6]"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="h-96 p-2">
                        <ChartRenderer visual={visual} data={visual.data || displayData} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Show Me panel */}
        <div className="w-64 bg-white border-l border-[#d3d3d3] p-3">
          <div className="text-xs font-semibold text-[#666666] mb-3">Show Me</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'bar', icon: BarChart3Icon, label: 'Bar' },
              { type: 'line', icon: LineChartIcon, label: 'Line' },
              { type: 'pie', icon: PieChartIcon, label: 'Pie' },
              { type: 'area', icon: AreaChartIcon, label: 'Area' },
              { type: 'scatter', icon: ScatterChartIcon, label: 'Scatter' },
              { type: 'table', icon: Table2Icon, label: 'Table' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    if (selectedVisual) {
                      updateVisual(selectedVisual.id, { type: item.type as any });
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 border rounded hover:bg-[#f5f5f5] transition-colors",
                    selectedVisual?.type === item.type 
                      ? "border-[#2E8B57] bg-[#e6f2ff]" 
                      : "border-[#d3d3d3]"
                  )}
                >
                  <Icon className="h-6 w-6 text-[#666666] mb-1" />
                  <span className="text-[10px] text-[#666666]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Sheet tabs (Tableau style) */}
      <div className="h-9 bg-[#f7f7f7] border-t border-[#d3d3d3] flex items-center px-2 gap-1">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer transition-colors text-xs",
              sheet.id === activeSheetId 
                ? "bg-white text-[#333333] border-t-2 border-[#ff7f0e]" 
                : "bg-[#e6e6e6] text-[#666666] hover:bg-[#d3d3d3]"
            )}
            onClick={() => setActiveSheetId(sheet.id)}
          >
            <span className="font-medium">{sheet.name}</span>
            {sheets.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (sheets.length > 1) {
                    const newSheets = sheets.filter(s => s.id !== sheet.id);
                    setSheets(newSheets);
                    if (activeSheetId === sheet.id) {
                      setActiveSheetId(newSheets[0].id);
                    }
                  }
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-[#cccccc] rounded p-0.5"
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addSheet}
          className="flex items-center justify-center w-7 h-7 hover:bg-[#e6e6e6] rounded transition-colors"
        >
          <PlusIcon className="w-4 h-4 text-[#666666]" />
        </button>
      </div>
    </div>
  );
}

