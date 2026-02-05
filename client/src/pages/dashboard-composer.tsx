import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  Download,
  Eye,
  Layout,
  Save,
  Settings,
  Maximize2,
  Star,
  Filter,
  RefreshCw,
  Home,
  FileSpreadsheet,
  Hash,
  CalendarDays,
  Type as TypeIcon,
  GripVertical
} from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardWidget {
  id: string;
  name: string;
  type: 'chart' | 'kpi' | 'table' | 'text';
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  data?: any[];
  config?: any;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  accuracy?: number;
}

// Sample widget data
const sampleChartData = [
  { name: 'Jan', value: 4500, target: 4000 },
  { name: 'Feb', value: 5200, target: 4500 },
  { name: 'Mar', value: 4800, target: 5000 },
  { name: 'Apr', value: 6100, target: 5500 },
  { name: 'May', value: 5500, target: 5200 },
  { name: 'Jun', value: 6700, target: 6000 },
];

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// Widget renderer
function WidgetRenderer({ widget, displayData }: { widget: DashboardWidget; displayData?: any[] }) {
  const fallbackData = displayData && displayData.length > 0 ? displayData.slice(0, 6) : sampleChartData;
  
  switch (widget.type) {
    case 'chart':
      if (widget.chartType === 'bar') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={widget.data || fallbackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6" />
              <Bar dataKey="target" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        );
      } else if (widget.chartType === 'line') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={widget.data || fallbackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="target" stroke="#06b6d4" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      } else if (widget.chartType === 'pie') {
        const pieData = (widget.data || fallbackData).map((item) => ({
          name: item.name,
          value: item.value,
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      }
      return null;

    case 'kpi':
      return (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="text-5xl font-bold text-primary mb-2">$67,890</div>
          <div className="text-sm text-muted-foreground mb-2">Total Revenue</div>
          <Badge className="bg-green-500">+12.5% vs last month</Badge>
        </div>
      );

    case 'table':
      const tableData = widget.data || fallbackData;
      return (
        <div className="h-full overflow-auto p-2">
          <table className="w-full text-sm">
            <thead className="bg-secondary sticky top-0">
              <tr>
                {Object.keys(tableData[0] || {}).map((key) => (
                  <th key={key} className="p-2 text-left font-semibold">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="border-b border-border">
                  {Object.values(row).map((value: any, i) => (
                    <td key={i} className="p-2">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'text':
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">{widget.name}</h3>
            <p className="text-muted-foreground">Add your custom text or insights here</p>
          </div>
        </div>
      );

    default:
      return <div>Unknown widget type</div>;
  }
}

export default function DashboardComposer() {
  const { data: contextData, columns: contextColumns, fileName } = useData();
  const [, setLocation] = useLocation();
  
  // Use context data if available, otherwise fallback to sample data
  const displayData = contextData.length > 0 ? contextData : sampleChartData;
  const displayColumns = contextColumns;
  
  const [dashboards, setDashboards] = useState<Dashboard[]>([
    {
      id: 'dashboard-1',
      name: 'Executive Dashboard',
      accuracy: 96,
      widgets: [
        {
          id: 'widget-1',
          name: 'Revenue Trend',
          type: 'chart',
          chartType: 'bar',
          data: sampleChartData,
          x: 0,
          y: 0,
          w: 6,
          h: 4,
        },
        {
          id: 'widget-2',
          name: 'Total Revenue',
          type: 'kpi',
          x: 6,
          y: 0,
          w: 3,
          h: 2,
        },
        {
          id: 'widget-3',
          name: 'Performance',
          type: 'chart',
          chartType: 'line',
          data: sampleChartData,
          x: 9,
          y: 0,
          w: 3,
          h: 2,
        },
        {
          id: 'widget-4',
          name: 'Distribution',
          type: 'chart',
          chartType: 'pie',
          data: sampleChartData,
          x: 6,
          y: 2,
          w: 6,
          h: 4,
        },
      ],
    },
  ]);

  const [activeDashboardId, setActiveDashboardId] = useState('dashboard-1');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId);

  // Add new dashboard
  const addDashboard = () => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: `Dashboard ${dashboards.length + 1}`,
      widgets: [],
      accuracy: 0,
    };
    setDashboards([...dashboards, newDashboard]);
    setActiveDashboardId(newDashboard.id);
  };

  // Add widget to dashboard
  const addWidget = (type: 'chart' | 'kpi' | 'table' | 'text', chartType?: 'bar' | 'line' | 'pie') => {
    if (!activeDashboard) return;

    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      name: `${type} Widget`,
      type,
      chartType,
      data: sampleChartData,
      x: 0,
      y: Infinity, // puts it at the bottom
      w: type === 'kpi' ? 3 : 6,
      h: type === 'kpi' ? 2 : 4,
    };

    setDashboards(
      dashboards.map((d) =>
        d.id === activeDashboardId ? { ...d, widgets: [...d.widgets, newWidget] } : d
      )
    );
    setShowAddWidget(false);
  };

  // Delete widget
  const deleteWidget = (widgetId: string) => {
    setDashboards(
      dashboards.map((d) =>
        d.id === activeDashboardId ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) } : d
      )
    );
  };

  // Update layout
  const onLayoutChange = (layout: any) => {
    if (!isEditing || !activeDashboard) return;

    const updatedWidgets = activeDashboard.widgets.map((widget) => {
      const layoutItem = layout.find((l: any) => l.i === widget.id);
      return layoutItem 
        ? { ...widget, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h } 
        : widget;
    });

    setDashboards(
      dashboards.map((d) => (d.id === activeDashboardId ? { ...d, widgets: updatedWidgets } : d))
    );
  };

  // Calculate dashboard accuracy (average from widgets)
  const calculateAccuracy = () => {
    return activeDashboard?.accuracy || 0;
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
          <h1 className="text-lg font-bold">Dashboard Composer</h1>
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
          
          {/* Dashboard accuracy */}
          {activeDashboard && activeDashboard.accuracy && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center gap-2">
                <Star className="h-3 w-3 text-white" />
                <span className="text-white font-bold text-xs">
                  Accuracy: {activeDashboard.accuracy}/100
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? 'Done Editing' : 'Edit Mode'}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Maximize2 className="h-4 w-4 mr-2" />
            Full Screen
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Dashboards list */}
        <div className="w-64 border-r border-border bg-card">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">My Dashboards</h2>
                <Button size="sm" variant="ghost" onClick={addDashboard}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {dashboards.map((dashboard) => (
                  <Card
                    key={dashboard.id}
                    className={`cursor-pointer transition-colors ${
                      activeDashboardId === dashboard.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setActiveDashboardId(dashboard.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold mb-1">{dashboard.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {dashboard.widgets.length} widgets
                          </p>
                          {dashboard.accuracy && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {dashboard.accuracy}% accurate
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Widget library */}
              {isEditing && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Add Widget</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addWidget('chart', 'bar')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Bar Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addWidget('chart', 'line')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Line Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addWidget('chart', 'pie')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Pie Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addWidget('kpi')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      KPI Card
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addWidget('table')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addWidget('text')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Text Box
                    </Button>
                  </CardContent>
                </Card>
              )}
                
              {/* Data Fields Section */}
              {displayColumns.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Data Fields
                        <Badge variant="secondary" className="ml-auto text-xs">{displayColumns.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ScrollArea className="max-h-64">
                        {displayColumns.map((column) => (
                          <div key={column.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded mb-2 hover:bg-secondary/50 transition-colors">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            {column.type === 'number' ? <Hash className="h-3 w-3 text-green-600" /> : 
                             column.type === 'date' ? <CalendarDays className="h-3 w-3 text-orange-600" /> : 
                             <TypeIcon className="h-3 w-3 text-blue-600" />}
                            <span className="text-xs flex-1">{column.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {column.type === 'number' ? '123' : column.type === 'date' ? 'Date' : 'Abc'}
                            </Badge>
                          </div>
                        ))}
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Use these fields in your widgets
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

        {/* Main dashboard canvas */}
        <div className="flex-1 bg-muted/20 overflow-auto">
          {activeDashboard ? (
            <div className="p-4">
              <div className="mb-4">
                <Input
                  value={activeDashboard.name}
                  onChange={(e) =>
                    setDashboards(
                      dashboards.map((d) => (d.id === activeDashboardId ? { ...d, name: e.target.value } : d))
                    )
                  }
                  className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 px-0"
                  disabled={!isEditing}
                />
              </div>

              {activeDashboard.widgets.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Layout className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Empty Dashboard</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start adding widgets to build your dashboard
                    </p>
                    <Button onClick={() => setIsEditing(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Enable Edit Mode
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <GridLayout
                  className="layout"
                  layout={activeDashboard.widgets.map((w) => ({
                    i: w.id,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                  }))}
                  width={1200}
                  onLayoutChange={onLayoutChange}
                  {...(isEditing && { isDraggable: true, isResizable: true })}
                >
                  {activeDashboard.widgets.map((widget) => (
                    <div key={widget.id}>
                      <Card className="h-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">{widget.name}</CardTitle>
                            {isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteWidget(widget.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-60px)]">
                          <WidgetRenderer widget={widget} displayData={displayData} />
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </GridLayout>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Layout className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Dashboard Selected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a dashboard from the sidebar or create a new one
                </p>
                <Button onClick={addDashboard}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
