import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Description as FileTextIcon,
  Assessment as BarChartIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Assignment as FileSpreadsheetIcon,
  Storage as ServerIcon,
  Cloud as CloudIcon,
  Close as XIcon,
  CheckCircle as CheckIcon,
  Dashboard as LayoutTemplateIcon,
  Autorenew as LoaderIcon,
  GetApp as FileDownIcon,
  Refresh as RefreshCwIcon,
  Add as PlusIcon,
  Visibility as EyeIcon,
  Stars as AwardIcon,
  Delete as TrashIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowLeftIcon
} from '@mui/icons-material';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  parseCSVFile, 
  analyzeDataWithValidation,
  generatePDFReport, 
  generateDOCXReport, 
  generatePPTXReport,
  type ComprehensiveReport
} from "@/lib/reportGenerator";
import { ValidationScoresCard } from "@/components/validation-scores";
import { TemplatePreview } from "@/components/template-preview";

interface DataSource {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'sql' | 'mongodb';
  size?: string;
  records?: number;
  data?: any[];
  file?: File;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
}

interface OutputFormat {
  id: string;
  name: string;
  extension: string;
  icon: any;
  color: string;
}

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

const outputFormats: OutputFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    extension: '.pdf',
    icon: FileTextIcon,
    color: 'text-red-600'
  },
  {
    id: 'docx',
    name: 'Word Document',
    extension: '.docx',
    icon: FileTextIcon,
    color: 'text-blue-600'
  },
  {
    id: 'pptx',
    name: 'PowerPoint',
    extension: '.pptx',
    icon: LayoutTemplateIcon,
    color: 'text-orange-600'
  }
];

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'generate' | 'view'>('generate');
  
  // Generate tab state
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('executive');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View reports state
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Validation scores state
  const [lastValidation, setLastValidation] = useState<ComprehensiveReport['validation'] | null>(null);
  
  // Template preview state
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBcxNybNgV_800Eoo8Eq3JgS2IDd8VHcfg';

  // Load saved reports on mount
  useState(() => {
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports));
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    for (const file of Array.from(files)) {
      const type = file.name.endsWith('.csv') ? 'csv' : 
                   file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 'csv';
      
      try {
        let data: any[] = [];
        if (type === 'csv') {
          data = await parseCSVFile(file);
        }

        const newSource: DataSource = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          records: data.length,
          data: data,
          file: file
        };
        
        setDataSources(prev => [...prev, newSource]);
        setSelectedSources(prev => [...prev, newSource.id]);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert(`Error parsing ${file.name}`);
      }
    }
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

  const toggleSourceSelection = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleGenerateReport = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one data source');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('Preparing data...');

    try {
      const selectedData = dataSources
        .filter(ds => selectedSources.includes(ds.id))
        .flatMap(ds => ds.data || []);

      if (selectedData.length === 0) {
        alert('No data found in selected sources');
        setIsGenerating(false);
        return;
      }

      setGenerationProgress('Analyzing data with hybrid validation...');
      const reportContent = await analyzeDataWithValidation(
        selectedData,
        reportTemplates.find(t => t.id === selectedTemplate)?.name || 'Standard',
        geminiApiKey
      );
      
      if (reportContent.validation) {
        setLastValidation(reportContent.validation);
      }

      setGenerationProgress(`Generating ${selectedFormat.toUpperCase()} document...`);
      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];
      const baseFilename = `report_${dateStr}`;

      const savedReport = {
        id: Date.now().toString(),
        title: reportContent.title || 'Data Analysis Report',
        templateType: reportTemplates.find(t => t.id === selectedTemplate)?.name || 'Standard',
        format: selectedFormat,
        generatedDate: timestamp,
        fileName: `${baseFilename}.${selectedFormat}`,
        content: reportContent,
        size: `${Math.round(JSON.stringify(reportContent).length / 1024)} KB`
      };

      const existingReports = localStorage.getItem('generatedReports');
      const reportsArray = existingReports ? JSON.parse(existingReports) : [];
      reportsArray.unshift(savedReport);
      localStorage.setItem('generatedReports', JSON.stringify(reportsArray));
      setReports(reportsArray);

      switch (selectedFormat) {
        case 'pdf':
          await generatePDFReport(reportContent, `${baseFilename}.pdf`);
          break;
        case 'docx':
          await generateDOCXReport(reportContent, `${baseFilename}.docx`);
          break;
        case 'pptx':
          await generatePPTXReport(reportContent, `${baseFilename}.pptx`);
          break;
      }

      setGenerationProgress('Report generated successfully!');
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress('');
        alert('Report generated and saved! View it in the "View Reports" tab.');
      }, 2000);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

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

  return (
    <div className="flex h-screen flex-col bg-[#f3f2f1]">
      {/* Tableau-style header */}
      <div className="h-12 bg-[#2E8B57] flex items-center px-4 justify-between border-b border-[#1e6f4f]">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
            className="text-black hover:bg-black/10"
          >
            Home
          </Button>
          <div className="h-5 w-px bg-black/20" />
          <BarChartIcon className="h-5 w-5 text-black" />
          <span className="text-black font-semibold text-sm">Reports</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-[#e1dfdd] px-6 pt-4 flex-shrink-0">
            <TabsList className="bg-transparent border-b-0 h-auto p-0">
              <TabsTrigger 
                value="generate" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2E8B57] data-[state=active]:bg-transparent px-4 pb-3"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Generate Report
              </TabsTrigger>
              <TabsTrigger 
                value="view"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2E8B57] data-[state=active]:bg-transparent px-4 pb-3"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View Reports
                {reports.length > 0 && (
                  <Badge className="ml-2 bg-[#2E8B57]">{reports.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Generate Report Tab */}
          <TabsContent value="generate" className="flex-1 overflow-y-auto mt-0 p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6 pb-8">
              {/* Upload Area */}
              <Card className="border-[#e1dfdd] shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-[#323130] mb-4 flex items-center gap-2">
                    <UploadIcon className="h-5 w-5 text-[#2E8B57]" />
                    Upload Data Sources
                  </h3>
                  
                  <div
                    className={cn(
                      "border-2 border-dashed rounded transition-all",
                      isDragging 
                        ? "border-[#2E8B57] bg-[#d4f1e5]" 
                        : "border-[#e1dfdd] bg-white hover:border-[#8a8886]",
                      dataSources.length > 0 ? "p-6" : "p-12"
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
                    
                    {dataSources.length === 0 ? (
                      <div className="text-center">
                        <UploadIcon className="h-12 w-12 text-[#2E8B57] mx-auto mb-4" />
                        <p className="text-base font-medium text-[#323130] mb-2">
                          Drop files here or click to browse
                        </p>
                        <p className="text-sm text-[#605e5c] mb-4">
                          Excel (.xlsx, .xls) or CSV (.csv) files
                        </p>
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-[#2E8B57] hover:bg-[#1e6f4f]"
                        >
                          Browse Files
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckIcon className="h-10 w-10 text-[#107c10]" />
                          <div>
                            <p className="font-medium text-[#323130]">
                              {dataSources.length} file{dataSources.length !== 1 ? 's' : ''} uploaded
                            </p>
                            <p className="text-sm text-[#605e5c]">
                              Select files below to include in report
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add More
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Sources */}
                  {dataSources.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dataSources.map((source) => (
                        <div
                          key={source.id}
                          onClick={() => toggleSourceSelection(source.id)}
                          className={cn(
                            "p-4 rounded border-2 cursor-pointer transition-all",
                            selectedSources.includes(source.id)
                              ? "border-[#2E8B57] bg-[#d4f1e5]"
                              : "border-[#e1dfdd] bg-white hover:border-[#8a8886]"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileSpreadsheetIcon className="h-4 w-4 text-[#107c10] flex-shrink-0" />
                              <span className="text-sm font-medium text-[#323130] truncate">
                                {source.name}
                              </span>
                            </div>
                            {selectedSources.includes(source.id) && (
                              <CheckIcon className="h-5 w-5 text-[#2E8B57] flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#605e5c]">
                            <Badge variant="outline" className="text-xs">
                              {source.type.toUpperCase()}
                            </Badge>
                            {source.size && <span>{source.size}</span>}
                            {source.records !== undefined && <span>• {source.records} rows</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Output Format */}
              <Card className="border-[#e1dfdd] shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-[#323130] mb-4 flex items-center gap-2">
                    <FileDownIcon className="h-5 w-5 text-[#107c10]" />
                    Choose Output Format
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {outputFormats.map((format) => {
                      const Icon = format.icon;
                      return (
                        <div
                          key={format.id}
                          onClick={() => setSelectedFormat(format.id)}
                          className={cn(
                            "p-5 rounded border-2 cursor-pointer transition-all",
                            selectedFormat === format.id
                              ? "border-[#107c10] bg-[#dff6dd]"
                              : "border-[#e1dfdd] bg-white hover:border-[#8a8886]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className={cn("h-6 w-6", format.color)} />
                              <div>
                                <h4 className="font-semibold text-[#323130]">{format.name}</h4>
                                <p className="text-xs text-[#605e5c]">{format.extension}</p>
                              </div>
                            </div>
                            {selectedFormat === format.id && (
                              <CheckIcon className="h-5 w-5 text-[#107c10]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Report Templates */}
              <Card className="border-[#e1dfdd] shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-[#323130] mb-4 flex items-center gap-2">
                    <LayoutTemplateIcon className="h-5 w-5 text-[#8764b8]" />
                    Choose Report Template
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "p-5 rounded border-2 cursor-pointer transition-all",
                          selectedTemplate === template.id
                            ? "border-[#8764b8] bg-[#f3f0f7]"
                            : "border-[#e1dfdd] bg-white hover:border-[#8a8886]"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-[#323130]">{template.name}</h4>
                          {selectedTemplate === template.id && (
                            <CheckIcon className="h-5 w-5 text-[#8764b8]" />
                          )}
                        </div>
                        <p className="text-sm text-[#605e5c] mb-3">{template.description}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(template.id);
                          }}
                          className="w-full h-20 rounded border-2 border-dashed border-[#e1dfdd] bg-[#faf9f8] hover:bg-[#f3f2f1] hover:border-[#2E8B57] flex items-center justify-center text-sm text-[#605e5c] hover:text-[#2E8B57] transition-all"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Preview Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* User Instructions */}
              <Card className="border-[#e1dfdd] shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-[#323130] mb-4 flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-[#d13438]" />
                    Report Focus & Instructions
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-sm text-[#605e5c]">
                      Provide specific details on what the report should focus on (optional)
                    </Label>
                    <Textarea
                      id="instructions"
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                      placeholder="E.g., Focus on sales trends in Q4, analyze customer retention patterns, highlight regional performance differences..."
                      className="min-h-[120px] resize-none bg-white border-[#e1dfdd] focus:border-[#2E8B57] focus:ring-[#2E8B57]"
                    />
                    <p className="text-xs text-[#605e5c] mt-1">
                      💡 Tip: Be specific about metrics, time periods, or comparisons you want to see in your report
                    </p>
                  </div>
                </div>
              </Card>

              {/* Generate Action */}
              <Card className="border-[#e1dfdd] shadow-sm bg-gradient-to-r from-[#d4f1e5] to-[#f3f0f7]">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#323130]">
                      {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-[#605e5c]">
                      Format: {outputFormats.find(f => f.id === selectedFormat)?.name} • 
                      Template: {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                      {userInstructions && ' • Custom instructions provided'}
                    </p>
                    {generationProgress && (
                      <p className="text-sm text-[#2E8B57] mt-1 flex items-center gap-2">
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        {generationProgress}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={selectedSources.length === 0 || isGenerating}
                    className="bg-[#2E8B57] hover:bg-[#1e6f4f] h-12 px-8 text-base font-semibold"
                  >
                    {isGenerating ? (
                      <>
                        <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChartIcon className="h-5 w-5 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Validation Scores */}
              {lastValidation && (
                <>
                  <div className="bg-gradient-to-r from-[#2E8B57] to-[#8764b8] rounded p-8 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <AwardIcon className="h-10 w-10" />
                        <div>
                          <div className="text-sm font-medium opacity-90">Report Accuracy Score</div>
                          <div className="text-5xl font-bold mt-1">
                            {lastValidation.scores.overall}
                            <span className="text-2xl">/100</span>
                          </div>
                          <div className="text-sm mt-2 opacity-90">
                            Risk Level: <span className="font-semibold uppercase">{lastValidation.scores.riskLevel}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-3xl font-bold">{lastValidation.scores.structural}%</div>
                          <div className="text-xs mt-1 opacity-80">Structural</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold">{lastValidation.scores.statistical}%</div>
                          <div className="text-xs mt-1 opacity-80">Statistical</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold">{lastValidation.scores.anomaly}%</div>
                          <div className="text-xs mt-1 opacity-80">Anomaly</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ValidationScoresCard 
                    scores={lastValidation.scores}
                    aiValidation={lastValidation.aiValidation}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* View Reports Tab */}
          <TabsContent value="view" className="flex-1 overflow-y-auto mt-0 p-6">
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
                <FileTextIcon className="h-16 w-16 text-[#a19f9d] mb-4" />
                <h3 className="text-lg font-semibold text-[#323130] mb-2">
                  No Reports Yet
                </h3>
                <p className="text-sm text-[#605e5c] max-w-sm mb-6">
                  Generate your first report to see it here
                </p>
                <Button 
                  onClick={() => setActiveTab('generate')}
                  className="bg-[#2E8B57] hover:bg-[#1e6f4f]"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Generate Your First Report
                </Button>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto pb-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#323130]">Your Reports</h2>
                    <p className="text-sm text-[#605e5c] mt-1">
                      {reports.length} report{reports.length !== 1 ? 's' : ''} generated
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('generate')}
                    className="border-[#2E8B57] text-[#2E8B57] hover:bg-[#d4f1e5]"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Generate New Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => (
                    <Card
                      key={report.id}
                      className="border-[#e1dfdd] hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewReport(report)}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-[#2E8B57]" />
                            <Badge className="text-xs bg-[#2E8B57]">
                              {report.format.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
                            }}
                            className="h-7 w-7 p-0 text-[#a19f9d] hover:text-[#d13438]"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>

                        <h3 className="font-semibold text-[#323130] mb-2 line-clamp-2">
                          {report.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-[#605e5c]">
                            <LayoutTemplateIcon className="h-3.5 w-3.5" />
                            <span>{report.templateType}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#605e5c]">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>{new Date(report.generatedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#605e5c]">
                            <FileDownIcon className="h-3.5 w-3.5" />
                            <span>{report.size}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-[#e1dfdd]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report);
                            }}
                          >
                            <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-[#2E8B57] hover:bg-[#1e6f4f]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReport(report);
                            }}
                          >
                            <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Viewer Modal */}
      {isViewerOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e1dfdd] flex items-center justify-between bg-[#faf9f8]">
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-5 w-5 text-[#2E8B57]" />
                <div>
                  <h2 className="text-xl font-bold text-[#323130]">
                    {selectedReport.title}
                  </h2>
                  <p className="text-sm text-[#605e5c]">
                    {selectedReport.templateType} • {new Date(selectedReport.generatedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="bg-[#2E8B57] hover:bg-[#1e6f4f]"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsViewerOpen(false)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                <section>
                  <h3 className="text-2xl font-bold text-[#323130] mb-4 pb-2 border-b-2 border-[#2E8B57]">
                    Executive Summary
                  </h3>
                  <p className="text-[#323130] leading-relaxed">
                    {selectedReport.content.executive_summary}
                  </p>
                </section>

                {selectedReport.content.key_metrics && selectedReport.content.key_metrics.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-[#323130] mb-4 pb-2 border-b-2 border-[#2E8B57]">
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedReport.content.key_metrics.map((metric: any, idx: number) => (
                        <div key={idx} className="bg-[#faf9f8] p-4 rounded border border-[#e1dfdd]">
                          <div className="text-sm text-[#605e5c] uppercase tracking-wide mb-1">
                            {metric.name}
                          </div>
                          <div className="text-2xl font-bold text-[#2E8B57] mb-1">
                            {metric.value}
                          </div>
                          {metric.change && (
                            <div className={cn(
                              "text-sm font-medium",
                              metric.change.startsWith('-') ? 'text-[#d13438]' : 'text-[#107c10]'
                            )}>
                              {metric.change}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedReport.content.insights && selectedReport.content.insights.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-[#323130] mb-4 pb-2 border-b-2 border-[#2E8B57]">
                      Key Insights
                    </h3>
                    <div className="space-y-3">
                      {selectedReport.content.insights.map((insight: string, idx: number) => (
                        <div key={idx} className="flex gap-3 p-4 bg-[#d4f1e5] rounded border-l-4 border-[#2E8B57]">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-[#323130] flex-1">{insight}</p>
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
      
      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          templateId={previewTemplate}
          templateName={reportTemplates.find(t => t.id === previewTemplate)?.name || ''}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
