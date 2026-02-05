import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  Table2,
  Plus,
  Trash2,
  Download,
  Eye,
  GripVertical,
  X,
  Save,
  Layout,
  Home,
  Hash,
  CalendarDays,
  Type as TypeIcon,
  FileSpreadsheet
} from 'lucide-react';
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
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sample data structure
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
  filters?: any;
  data?: any[];
}

interface Sheet {
  id: string;
  name: string;
  visuals: Visual[];
}

// Draggable column component
function DraggableColumn({ column }: { column: Column }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getColumnIcon = () => {
    switch (column.type) {
      case 'number':
        return <Hash className="h-4 w-4 text-green-600" />;
      case 'date':
        return <CalendarDays className="h-4 w-4 text-orange-600" />;
      default:
        return <TypeIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBadgeText = () => {
    switch (column.type) {
      case 'number':
        return '123';
      case 'date':
        return 'Date';
      default:
        return 'Abc';
    }
  };

  const getBadgeVariant = () => {
    switch (column.type) {
      case 'number':
        return 'default';
      case 'date':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2.5 bg-secondary/50 border border-secondary rounded-lg cursor-move hover:bg-secondary hover:border-primary/30 transition-all group"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      {getColumnIcon()}
      <span className="text-sm font-medium flex-1">{column.name}</span>
      <Badge variant={getBadgeVariant() as any} className="text-xs">
        {getBadgeText()}
      </Badge>
    </div>
  );
}

// Chart renderer component
function ChartRenderer({ visual, data }: { visual: Visual; data: any[] }) {
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <p>No data available. Drag columns to configure the visual.</p>
      </div>
    );
  }

  switch (visual.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={visual.xAxis || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {visual.yAxis?.map((yKey, index) => (
              <Bar key={yKey} dataKey={yKey} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={visual.xAxis || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {visual.yAxis?.map((yKey, index) => (
              <Line key={yKey} type="monotone" dataKey={yKey} stroke={COLORS[index % COLORS.length]} />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsAreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={visual.xAxis || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {visual.yAxis?.map((yKey, index) => (
              <Area key={yKey} type="monotone" dataKey={yKey} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
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
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={visual.xAxis || 'x'} type="number" name={visual.xAxis} />
            <YAxis dataKey={visual.yAxis?.[0] || 'y'} type="number" name={visual.yAxis?.[0]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Data" data={data} fill={COLORS[0]} />
          </RechartsScatterChart>
        </ResponsiveContainer>
      );

    case 'table':
      return (
        <div className="overflow-auto max-h-[300px]">
          <table className="w-full text-sm">
            <thead className="bg-secondary sticky top-0">
              <tr>
                {visual.xAxis && <th className="p-2 text-left font-semibold">{visual.xAxis}</th>}
                {visual.yAxis?.map((col) => (
                  <th key={col} className="p-2 text-left font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b border-border">
                  {visual.xAxis && <td className="p-2">{row[visual.xAxis]}</td>}
                  {visual.yAxis?.map((col) => (
                    <td key={col} className="p-2">
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
  
  // Use context data if available, otherwise fallback to sample data
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
    {
      id: 'sheet-1',
      name: 'Sheet 1',
      visuals: [],
    },
  ]);

  const [activeSheetId, setActiveSheetId] = useState('sheet-1');
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const selectedVisual = activeSheet?.visuals.find((v) => v.id === selectedVisualId);

  const sensors = useSensors(useSensor(PointerSensor));

  // Add new sheet
  const addSheet = () => {
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      visuals: [],
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
  };

  // Delete sheet
  const deleteSheet = (sheetId: string) => {
    if (sheets.length === 1) return; // Keep at least one sheet
    const newSheets = sheets.filter((s) => s.id !== sheetId);
    setSheets(newSheets);
    if (activeSheetId === sheetId) {
      setActiveSheetId(newSheets[0].id);
    }
  };

  // Add visual to current sheet
  const addVisual = () => {
    if (!activeSheet) return;

    const firstColumn = displayColumns[0]?.id || 'column1';
    const firstNumericColumn = displayColumns.find(c => c.type === 'number')?.id || displayColumns[1]?.id || 'value';

    const newVisual: Visual = {
      id: `visual-${Date.now()}`,
      name: `Visual ${activeSheet.visuals.length + 1}`,
      type: 'bar',
      xAxis: firstColumn,
      yAxis: [firstNumericColumn],
      data: displayData,
    };

    setSheets(
      sheets.map((sheet) =>
        sheet.id === activeSheetId ? { ...sheet, visuals: [...sheet.visuals, newVisual] } : sheet
      )
    );
    setSelectedVisualId(newVisual.id);
  };

  // Delete visual
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

  // Update visual configuration
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

  // Handle column drop to X-axis
  const handleXAxisDrop = (columnId: string) => {
    if (selectedVisual) {
      updateVisual(selectedVisual.id, { xAxis: columnId });
    }
  };

  // Handle column drop to Y-axis
  const handleYAxisDrop = (columnId: string) => {
    if (selectedVisual) {
      const currentYAxis = selectedVisual.yAxis || [];
      if (!currentYAxis.includes(columnId)) {
        updateVisual(selectedVisual.id, { yAxis: [...currentYAxis, columnId] });
      }
    }
  };

  // Remove Y-axis column
  const removeYAxis = (columnId: string) => {
    if (selectedVisual) {
      updateVisual(selectedVisual.id, {
        yAxis: selectedVisual.yAxis?.filter((y) => y !== columnId),
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top toolbar - Tableau style */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Layout className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Visual Builder</h1>
          {fileName && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{fileName}</span>
                <Badge variant="secondary">{displayData.length} rows</Badge>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setLocation('/dashboard-composer')}>
            <Eye className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Columns and configuration */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Data Source Info */}
              {fileName && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {displayData.length} rows × {displayColumns.length} columns
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data columns */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Table2 className="h-4 w-4" />
                    Data Fields
                    <Badge variant="secondary" className="ml-auto text-xs">{displayColumns.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DndContext sensors={sensors}>
                    <SortableContext items={displayColumns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {displayColumns.map((column) => (
                          <DraggableColumn key={column.id} column={column} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Drag fields to X-axis or Y-axis below
                  </p>
                </CardContent>
              </Card>

              {/* Visual configuration */}
              {selectedVisual && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Visual Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Visual Name</Label>
                      <Input
                        value={selectedVisual.name}
                        onChange={(e) => updateVisual(selectedVisual.id, { name: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Chart Type</Label>
                      <Select
                        value={selectedVisual.type}
                        onValueChange={(value: any) => updateVisual(selectedVisual.id, { type: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Bar Chart
                            </div>
                          </SelectItem>
                          <SelectItem value="line">
                            <div className="flex items-center gap-2">
                              <LineChart className="h-4 w-4" />
                              Line Chart
                            </div>
                          </SelectItem>
                          <SelectItem value="area">
                            <div className="flex items-center gap-2">
                              <AreaChart className="h-4 w-4" />
                              Area Chart
                            </div>
                          </SelectItem>
                          <SelectItem value="pie">
                            <div className="flex items-center gap-2">
                              <PieChart className="h-4 w-4" />
                              Pie Chart
                            </div>
                          </SelectItem>
                          <SelectItem value="scatter">
                            <div className="flex items-center gap-2">
                              <ScatterChart className="h-4 w-4" />
                              Scatter Plot
                            </div>
                          </SelectItem>
                          <SelectItem value="table">
                            <div className="flex items-center gap-2">
                              <Table2 className="h-4 w-4" />
                              Table
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">X-AXIS</Label>
                      <Select value={selectedVisual.xAxis || ''} onValueChange={handleXAxisDrop}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Drop column here or select" />
                        </SelectTrigger>
                        <SelectContent>
                          {displayColumns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              <div className="flex items-center gap-2">
                                {col.type === 'number' ? <Hash className="h-3 w-3" /> : 
                                 col.type === 'date' ? <CalendarDays className="h-3 w-3" /> : 
                                 <TypeIcon className="h-3 w-3" />}
                                <span>{col.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Y-AXIS (VALUES)</Label>
                      <div className="mt-2 space-y-2">
                        {selectedVisual.yAxis?.map((yCol) => (
                          <div key={yCol} className="flex items-center gap-2 p-2 bg-secondary rounded">
                            <span className="text-sm flex-1">{displayColumns.find((c) => c.id === yCol)?.name}</span>
                            <Button size="sm" variant="ghost" onClick={() => removeYAxis(yCol)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Select onValueChange={handleYAxisDrop} value="">
                          <SelectTrigger>
                            <SelectValue placeholder="+ Add Y-axis column" />
                          </SelectTrigger>
                          <SelectContent>
                            {displayColumns
                              .filter((col) => col.type === 'number')
                              .map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                  <div className="flex items-center gap-2">
                                    <Hash className="h-3 w-3 text-green-600" />
                                    <span>{col.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col">
          {/* Sheet tabs */}
          <div className="border-b border-border bg-card px-4 py-2 flex items-center gap-2">
            <Tabs value={activeSheetId} onValueChange={setActiveSheetId} className="flex-1">
              <div className="flex items-center gap-2">
                <TabsList>
                  {sheets.map((sheet) => (
                    <TabsTrigger key={sheet.id} value={sheet.id} className="relative group">
                      {sheet.name}
                      {sheets.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSheet(sheet.id);
                          }}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button size="sm" variant="ghost" onClick={addSheet}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Tabs>
          </div>

          {/* Canvas area with visuals */}
          <ScrollArea className="flex-1 bg-muted/20">
            <div className="p-6 space-y-4">
              {activeSheet && activeSheet.visuals.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No visuals yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start by adding your first visualization to this sheet
                    </p>
                    <Button onClick={addVisual}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Visual
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button onClick={addVisual} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Visual
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {activeSheet?.visuals.map((visual) => (
                      <Card
                        key={visual.id}
                        className={`cursor-pointer transition-all ${
                          selectedVisualId === visual.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedVisualId(visual.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">{visual.name}</CardTitle>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {visual.type}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVisual(visual.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ChartRenderer visual={visual} data={visual.data || displayData} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
