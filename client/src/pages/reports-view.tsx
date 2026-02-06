import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  FileDown,
  LayoutTemplate,
  X,
  ChevronRight,
  TrendingUp,
  BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedReport {
  id: string;
  title: string;
  templateType: string;
  format: string;
  generatedDate: string;
  fileName: string;
  content: any;
  size: string;
}

export default function ReportsView() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    // Load saved reports from localStorage
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      try {
        const parsed = JSON.parse(savedReports);
        setReports(parsed);
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }
  }, []);

  const handleViewReport = (report: SavedReport) => {
    setSelectedReport(report);
    setIsViewerOpen(true);
  };

  const handleDownloadReport = (report: SavedReport) => {
    const blob = new Blob([JSON.stringify(report.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem('generatedReports', JSON.stringify(updatedReports));
      
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setIsViewerOpen(false);
      }
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'pptx':
        return <LayoutTemplate className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'docx':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pptx':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Reports List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">My Reports</h1>
              <p className="text-sm text-slate-500">
                View, download, and manage your generated reports
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Reports Yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">
                Generate your first report to see it here. All your reports will be saved
                and accessible from this page.
              </p>
              <Button onClick={() => window.location.hash = '#generate'}>
                Generate Your First Report
              </Button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="p-5 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleViewReport(report)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getFormatIcon(report.format)}
                        <Badge className={cn("text-xs", getFormatColor(report.format))}>
                          {report.format.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </h3>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        <span>{report.templateType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(report.generatedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileDown className="w-3.5 h-3.5" />
                        <span>{report.size}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewReport(report);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadReport(report);
                        }}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Viewer Modal */}
      {isViewerOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {getFormatIcon(selectedReport.format)}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedReport.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedReport.templateType} • Generated on {new Date(selectedReport.generatedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsViewerOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                {/* Executive Summary */}
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-500">
                    Executive Summary
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedReport.content.executive_summary}
                  </p>
                </section>

                {/* Key Metrics */}
                {selectedReport.content.key_metrics && selectedReport.content.key_metrics.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-500">
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedReport.content.key_metrics.map((metric: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                            {metric.name}
                          </div>
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {metric.value}
                          </div>
                          {metric.change && (
                            <div className={cn(
                              "text-sm font-medium flex items-center gap-1",
                              metric.change.startsWith('-') ? 'text-red-600' : 'text-green-600'
                            )}>
                              <TrendingUp className="w-3.5 h-3.5" />
                              {metric.change}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Key Insights */}
                {selectedReport.content.insights && selectedReport.content.insights.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-500">
                      Key Insights
                    </h3>
                    <div className="space-y-3">
                      {selectedReport.content.insights.map((insight: string, idx: number) => (
                        <div key={idx} className="flex gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-slate-700 flex-1">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Trend Analysis */}
                {selectedReport.content.trends && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-500">
                      Trend Analysis
                    </h3>
                    <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                      <p className="text-slate-700 leading-relaxed">
                        {selectedReport.content.trends}
                      </p>
                    </div>
                  </section>
                )}

                {/* Chart Recommendations */}
                {selectedReport.content.chart_recommendations && selectedReport.content.chart_recommendations.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-500">
                      Recommended Visualizations
                    </h3>
                    <div className="space-y-2">
                      {selectedReport.content.chart_recommendations.map((chart: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <BarChart2 className="w-4 h-4 text-green-600" />
                          <span className="text-slate-700">{chart}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

