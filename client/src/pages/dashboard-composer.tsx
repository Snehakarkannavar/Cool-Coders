import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dashboard as DashboardIcon,
  Assessment as BarChart3Icon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  Add as PlusIcon,
  Delete as Trash2Icon,
  GetApp as DownloadIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  Close as XIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Fullscreen as FullscreenIcon,
  TextFields as TextFieldsIcon,
  Functions as FunctionsIcon
} from '@mui/icons-material';
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
import { cn } from '@/lib/utils';

interface DashboardWidget {
  id: string;
  name: string;
  type: 'chart' | 'kpi' | 'table' | 'text' | 'filter';
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
}

const sampleChartData = [
  { name: 'Jan', value: 4500, target: 4000 },
  { name: 'Feb', value: 5200, target: 4500 },
  { name: 'Mar', value: 4800, target: 5000 },
  { name: 'Apr', value: 6100, target: 5500 },
  { name: 'May', value: 5500, target: 5200 },
  { name: 'Jun', value: 6700, target: 6000 },
];

const TABLEAU_COLORS = [
  '#2E8B57', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
  '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
];

// Widget renderer with Tableau styling
function WidgetRenderer({ widget, displayData }: { widget: DashboardWidget; displayData?: any[] }) {
  const fallbackData = displayData && displayData.length > 0 ? displayData.slice(0, 6) : sampleChartData;
  
  const chartProps = {
    margin: { top: 5, right: 5, left: 0, bottom: 5 }
  };

  switch (widget.type) {
    case 'chart':
      if (widget.chartType === 'bar') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={widget.data || fallbackData} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#666666' }}
                axisLine={{ stroke: '#e6e6e6' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#666666' }}
                axisLine={{ stroke: '#e6e6e6' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #cccccc',
                  borderRadius: '2px',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="value" fill={TABLEAU_COLORS[0]} radius={[2, 2, 0, 0]} />
              <Bar dataKey="target" fill={TABLEAU_COLORS[1]} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      } else if (widget.chartType === 'line') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={widget.data || fallbackData} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 10, fill: '#666666' }}
                axisLine={{ stroke: '#e6e6e6' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#666666' }}
                axisLine={{ stroke: '#e6e6e6' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #cccccc',
                  borderRadius: '2px',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="value" stroke={TABLEAU_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="target" stroke={TABLEAU_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
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
                  fontSize: '11px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      }
      return null;

    case 'kpi':
      return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-white">
          <div className="text-4xl font-bold text-[#2E8B57] mb-2">$67,890</div>
          <div className="text-xs text-[#666666] mb-2 font-semibold">Total Revenue</div>
          <Badge className="bg-[#59a14f] text-white text-xs">+12.5%</Badge>
        </div>
      );

    case 'table':
      const tableData = widget.data || fallbackData;
      return (
        <div className="h-full overflow-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#f5f5f5] sticky top-0">
              <tr>
                {Object.keys(tableData[0] || {}).map((key) => (
                  <th key={key} className="p-2 text-left font-semibold border-b border-[#cccccc] text-[#333333]">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="border-b border-[#e6e6e6] hover:bg-[#f5f5f5]">
                  {Object.values(row).map((value: any, i) => (
                    <td key={i} className="p-2 text-[#333333]">
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
        <div className="h-full flex items-center justify-center p-4 bg-white">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2 text-[#333333]">{widget.name}</h3>
            <p className="text-xs text-[#666666]">Add your custom text or insights here</p>
          </div>
        </div>
      );

    case 'filter':
      return (
        <div className="h-full p-3 bg-white">
          <div className="text-xs font-semibold text-[#666666] mb-2">Filter</div>
          <select className="w-full text-xs border border-[#d3d3d3] rounded p-1.5">
            <option>All</option>
            <option>Category 1</option>
            <option>Category 2</option>
          </select>
        </div>
      );

    default:
      return <div className="bg-white h-full flex items-center justify-center text-xs text-[#999999]">Unknown widget</div>;
  }
}

export default function DashboardComposer() {
  const { data: contextData, columns: contextColumns, fileName } = useData();
  const [, setLocation] = useLocation();
  
  const displayData = contextData.length > 0 ? contextData : sampleChartData;
  const displayColumns = contextColumns;
  
  const [dashboards, setDashboards] = useState<Dashboard[]>([
    {
      id: 'dashboard-1',
      name: 'Dashboard 1',
      widgets: [],
    },
  ]);

  const [activeDashboardId, setActiveDashboardId] = useState('dashboard-1');
  const [isEditing, setIsEditing] = useState(false);

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId);

  const addDashboard = () => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: `Dashboard ${dashboards.length + 1}`,
      widgets: [],
    };
    setDashboards([...dashboards, newDashboard]);
    setActiveDashboardId(newDashboard.id);
  };

  const addWidget = (type: 'chart' | 'kpi' | 'table' | 'text' | 'filter', chartType?: 'bar' | 'line' | 'pie') => {
    if (!activeDashboard) return;

    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      name: type === 'chart' ? `${chartType} Chart` : type.charAt(0).toUpperCase() + type.slice(1),
      type,
      chartType,
      data: sampleChartData,
      x: 0,
      y: Infinity,
      w: type === 'kpi' ? 3 : type === 'filter' ? 2 : 6,
      h: type === 'kpi' ? 2 : type === 'filter' ? 2 : 4,
    };

    setDashboards(
      dashboards.map((d) =>
        d.id === activeDashboardId ? { ...d, widgets: [...d.widgets, newWidget] } : d
      )
    );
  };

  const deleteWidget = (widgetId: string) => {
    setDashboards(
      dashboards.map((d) =>
        d.id === activeDashboardId ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) } : d
      )
    );
  };

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
        <DashboardIcon className="h-4 w-4 text-black" />
        <span className="text-sm font-semibold text-black">Dashboard</span>
        {fileName && (
          <>
            <div className="h-5 w-px bg-black/20 ml-2" />
            <span className="text-xs text-black">{fileName}</span>
          </>
        )}
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "h-7 text-xs",
            isEditing ? "bg-[#2E8B57] text-white hover:bg-[#1e6f4f]" : "hover:bg-[#e6e6e6]"
          )}
        >
          <SettingsIcon className="h-3.5 w-3.5 mr-1" />
          {isEditing ? 'Done' : 'Edit'}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <RefreshIcon className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <FilterIcon className="h-3.5 w-3.5 mr-1" />
          Filters
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <SaveIcon className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <DownloadIcon className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[#e6e6e6]">
          <FullscreenIcon className="h-3.5 w-3.5 mr-1" />
          Full Screen
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Dashboard list and objects */}
        <div className="w-56 bg-white border-r border-[#d3d3d3]">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Dashboard list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#666666]">Dashboards</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={addDashboard}
                    className="h-6 w-6 p-0 hover:bg-[#e6e6e6]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {dashboards.map((dashboard) => (
                    <div
                      key={dashboard.id}
                      className={cn(
                        "p-2 rounded cursor-pointer text-xs transition-colors",
                        activeDashboardId === dashboard.id 
                          ? "bg-[#d4f1e5] text-[#2E8B57] font-semibold" 
                          : "hover:bg-[#f5f5f5] text-[#333333]"
                      )}
                      onClick={() => setActiveDashboardId(dashboard.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{dashboard.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {dashboard.widgets.length}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objects to add */}
              {isEditing && (
                <div>
                  <div className="text-xs font-semibold text-[#666666] mb-2">Objects</div>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('chart', 'bar')}
                    >
                      <BarChart3Icon className="h-3.5 w-3.5 mr-2" />
                      Bar Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('chart', 'line')}
                    >
                      <LineChartIcon className="h-3.5 w-3.5 mr-2" />
                      Line Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('chart', 'pie')}
                    >
                      <PieChartIcon className="h-3.5 w-3.5 mr-2" />
                      Pie Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('kpi')}
                    >
                      <FunctionsIcon className="h-3.5 w-3.5 mr-2" />
                      KPI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('table')}
                    >
                      <TextFieldsIcon className="h-3.5 w-3.5 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('text')}
                    >
                      <TextFieldsIcon className="h-3.5 w-3.5 mr-2" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-8 text-xs border-[#d3d3d3] hover:bg-[#f5f5f5]"
                      onClick={() => addWidget('filter')}
                    >
                      <FilterIcon className="h-3.5 w-3.5 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* CENTER: Dashboard canvas */}
        <div className="flex-1 bg-white overflow-auto">
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
                  className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 px-0 text-[#333333]"
                  disabled={!isEditing}
                />
              </div>

              {activeDashboard.widgets.length === 0 ? (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-[#d3d3d3] rounded">
                  <div className="text-center text-[#666666]">
                    <DashboardIcon className="h-16 w-16 mx-auto mb-4 text-[#cccccc]" />
                    <h3 className="text-base font-semibold mb-2 text-[#333333]">Empty Dashboard</h3>
                    <p className="text-xs mb-4">
                      {isEditing ? 'Add objects from the left panel' : 'Enable Edit Mode to add objects'}
                    </p>
                    {!isEditing && (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-[#2E8B57] hover:bg-[#1e6f4f] text-white text-xs h-7"
                      >
                        <SettingsIcon className="h-3.5 w-3.5 mr-1" />
                        Edit Mode
                      </Button>
                    )}
                  </div>
                </div>
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
                  cols={12}
                  rowHeight={50}
                  width={1200}
                  onLayoutChange={onLayoutChange}
                  isDraggable={isEditing}
                  isResizable={isEditing}
                  draggableHandle=".drag-handle"
                  {...({} as any)}
                >
                  {activeDashboard.widgets.map((widget) => (
                    <div key={widget.id} className="bg-white border border-[#d3d3d3] rounded shadow-sm">
                      <div className="h-8 bg-[#f5f5f5] border-b border-[#d3d3d3] flex items-center justify-between px-2 drag-handle cursor-move">
                        <span className="text-xs font-semibold text-[#333333]">{widget.name}</span>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteWidget(widget.id)}
                            className="h-6 w-6 p-0 hover:bg-[#e6e6e6]"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="h-[calc(100%-32px)]">
                        <WidgetRenderer widget={widget} displayData={displayData} />
                      </div>
                    </div>
                  ))}
                </GridLayout>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[#666666]">
                <DashboardIcon className="h-16 w-16 mx-auto mb-4 text-[#cccccc]" />
                <h3 className="text-base font-semibold mb-2 text-[#333333]">No Dashboard Selected</h3>
                <p className="text-xs mb-4">Select or create a dashboard to get started</p>
                <Button 
                  onClick={addDashboard}
                  className="bg-[#2E8B57] hover:bg-[#1e6f4f] text-white text-xs h-7"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  Create Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Dashboard tabs (Tableau style) */}
      <div className="h-9 bg-[#f7f7f7] border-t border-[#d3d3d3] flex items-center px-2 gap-1">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer transition-colors text-xs",
              dashboard.id === activeDashboardId 
                ? "bg-white text-[#333333] border-t-2 border-[#ff7f0e]" 
                : "bg-[#e6e6e6] text-[#666666] hover:bg-[#d3d3d3]"
            )}
            onClick={() => setActiveDashboardId(dashboard.id)}
          >
            <span className="font-medium">{dashboard.name}</span>
            {dashboards.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (dashboards.length > 1) {
                    const newDashboards = dashboards.filter(d => d.id !== dashboard.id);
                    setDashboards(newDashboards);
                    if (activeDashboardId === dashboard.id) {
                      setActiveDashboardId(newDashboards[0].id);
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
          onClick={addDashboard}
          className="flex items-center justify-center w-7 h-7 hover:bg-[#e6e6e6] rounded transition-colors"
        >
          <PlusIcon className="w-4 h-4 text-[#666666]" />
        </button>
      </div>
    </div>
  );
}

