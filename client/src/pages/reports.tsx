import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Database, 
  Upload, 
  Download, 
  BarChart2,
  FileSpreadsheet,
  Server,
  Cloud,
  X,
  Check,
  LayoutTemplate,
  Loader2,
  FileDown,
  RefreshCw,
  Plus,
  Eye,
  Award
} from "lucide-react";
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
    icon: FileText,
    color: 'text-red-600'
  },
  {
    id: 'docx',
    name: 'Word Document',
    extension: '.docx',
    icon: FileText,
    color: 'text-blue-600'
  },
  {
    id: 'pptx',
    name: 'PowerPoint',
    extension: '.pptx',
    icon: LayoutTemplate,
    color: 'text-orange-600'
  }
];

export default function Reports() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('executive');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modify existing report states
  const [modifyFile, setModifyFile] = useState<File | null>(null);
  const [modifyTemplate, setModifyTemplate] = useState<string>('executive');
  const [modifyFormat, setModifyFormat] = useState<string>('pdf');
  const [isModifying, setIsModifying] = useState(false);
  const [modifyProgress, setModifyProgress] = useState('');
  const modifyFileInputRef = useRef<HTMLInputElement>(null);
  
  // Validation scores state
  const [lastValidation, setLastValidation] = useState<ComprehensiveReport['validation'] | null>(null);
  
  // Template preview state
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  
  // Get Gemini API key from environment
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const fileCount = files.length;
    let successCount = 0;
    
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
        successCount++;
      } catch (error) {
        console.error('Error parsing file:', error);
        alert(`Error parsing ${file.name}`);
      }
    }
    
    // Show success feedback
    if (successCount > 0) {
      const message = successCount === 1 
        ? `✓ ${successCount} file uploaded successfully!`
        : `✓ ${successCount} files uploaded successfully!`;
      
      // Create a temporary success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">${message}</span>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
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
      // Combine data from selected sources
      const selectedData = dataSources
        .filter(ds => selectedSources.includes(ds.id))
        .flatMap(ds => ds.data || []);

      if (selectedData.length === 0) {
        alert('No data found in selected sources');
        setIsGenerating(false);
        return;
      }

      // Generate report content with hybrid validation (Math + AI)
      setGenerationProgress('Analyzing data with hybrid validation...');
      const reportContent = await analyzeDataWithValidation(
        selectedData,
        reportTemplates.find(t => t.id === selectedTemplate)?.name || 'Standard',
        geminiApiKey
      );
      
      // Store validation results for display
      if (reportContent.validation) {
        setLastValidation(reportContent.validation);
      }

      // Generate the selected format
      setGenerationProgress(`Generating ${selectedFormat.toUpperCase()} document...`);
      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];
      const baseFilename = `report_${dateStr}`;

      // Save report to localStorage
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

      // Get existing reports
      const existingReports = localStorage.getItem('generatedReports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.unshift(savedReport); // Add new report to the beginning
      localStorage.setItem('generatedReports', JSON.stringify(reports));

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
        // Show success message
        alert('Report generated and saved successfully! View it in the "View Reports" section.');
      }, 2000);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleModifyFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setModifyFile(file);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-purple-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <span class="font-medium">✓ File uploaded: ${file.name}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
    
    // Try to parse the file if it's CSV
    if (file.name.endsWith('.csv')) {
      try {
        const data = await parseCSVFile(file);
        console.log('Loaded report data for modification:', data.length, 'rows');
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    }
  };

  const handleModifyReport = async () => {
    if (!modifyFile) {
      alert('Please upload a report file to modify');
      return;
    }

    setIsModifying(true);
    setModifyProgress('Loading existing report...');

    try {
      let reportData: any[] = [];
      
      // Parse the file based on type
      if (modifyFile.name.endsWith('.csv')) {
        reportData = await parseCSVFile(modifyFile);
      } else {
        alert('Currently only CSV files are supported for modification');
        setIsModifying(false);
        return;
      }

      if (reportData.length === 0) {
        alert('No data found in the file');
        setIsModifying(false);
        return;
      }

      // Generate new report with selected template and hybrid validation
      setModifyProgress('Regenerating report with hybrid validation...');
      const reportContent = await analyzeDataWithValidation(
        reportData,
        reportTemplates.find(t => t.id === modifyTemplate)?.name || 'Standard',
        geminiApiKey
      );
      
      // Store validation results for display
      if (reportContent.validation) {
        setLastValidation(reportContent.validation);
      }

      // Generate the selected format
      setModifyProgress(`Generating ${modifyFormat.toUpperCase()} document...`);
      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];
      const baseFilename = `modified_report_${dateStr}`;

      // Save modified report to localStorage
      const savedReport = {
        id: Date.now().toString(),
        title: reportContent.title || 'Modified Data Analysis Report',
        templateType: reportTemplates.find(t => t.id === modifyTemplate)?.name || 'Standard',
        format: modifyFormat,
        generatedDate: timestamp,
        fileName: `${baseFilename}.${modifyFormat}`,
        content: reportContent,
        size: `${Math.round(JSON.stringify(reportContent).length / 1024)} KB`
      };

      const existingReports = localStorage.getItem('generatedReports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.unshift(savedReport);
      localStorage.setItem('generatedReports', JSON.stringify(reports));

      switch (modifyFormat) {
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

      setModifyProgress('Modified report generated successfully!');
      setTimeout(() => {
        setIsModifying(false);
        setModifyProgress('');
        setModifyFile(null);
        alert('Modified report generated and saved! View it in the "View Reports" section.');
      }, 2000);

    } catch (error) {
      console.error('Error modifying report:', error);
      alert('Error modifying report. Please try again.');
      setIsModifying(false);
      setModifyProgress('');
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'csv': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'sql': return <Database className="w-4 h-4 text-orange-600" />;
      case 'mongodb': return <Server className="w-4 h-4 text-green-700" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-white">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Generate Report</h1>
          <p className="text-sm text-slate-500">Create new reports or restructure existing ones with AI</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="new" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Generate New Report
                </TabsTrigger>
                <TabsTrigger value="modify" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Modify Existing
                </TabsTrigger>
              </TabsList>

              {/* Generate New Report Tab */}
              <TabsContent value="new" className="space-y-6">
            {/* Upload Area */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload Data Sources
              </h3>
              
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg text-center transition-all",
                  isDragging 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-slate-300 bg-slate-50 hover:border-slate-400",
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
                  <>
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
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel (.xlsx, .xls)
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        CSV (.csv)
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-900">
                          {dataSources.length} file{dataSources.length !== 1 ? 's' : ''} uploaded
                        </p>
                        <p className="text-sm text-slate-500">
                          Click below to select which to use
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add More
                    </Button>
                  </div>
                )}
              </div>

              {/* Uploaded Sources */}
              {dataSources.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Uploaded Data Sources ({dataSources.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dataSources.map((source) => (
                      <div
                        key={source.id}
                        onClick={() => toggleSourceSelection(source.id)}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all",
                          selectedSources.includes(source.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getIconForType(source.type)}
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {source.name}
                            </span>
                          </div>
                          {selectedSources.includes(source.id) && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Badge variant="outline" className="text-xs">
                            {source.type.toUpperCase()}
                          </Badge>
                          {source.size && <span>{source.size}</span>}
                          {source.records !== undefined && <span>• {source.records} rows</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Output Format Selection */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-green-600" />
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
                        "p-5 rounded-lg border-2 cursor-pointer transition-all",
                        selectedFormat === format.id
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Icon className={cn("w-6 h-6", format.color)} />
                          <div>
                            <h4 className="font-semibold text-slate-900">{format.name}</h4>
                            <p className="text-xs text-slate-500">{format.extension}</p>
                          </div>
                        </div>
                        {selectedFormat === format.id && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Report Templates */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-purple-600" />
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template.id);
                      }}
                      className="w-full h-24 rounded border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 flex flex-col items-center justify-center text-sm text-slate-600 hover:text-blue-600 transition-all group"
                    >
                      <Eye className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Preview Template</span>
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Generate Actions */}
            <div className="flex items-center justify-between p-6 bg-white rounded-lg border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">
                  {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-slate-500">
                  Format: {outputFormats.find(f => f.id === selectedFormat)?.name} • 
                  Template: {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                </p>
                {generationProgress && (
                  <p className="text-sm text-blue-600 mt-1 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {generationProgress}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={selectedSources.length === 0 || isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Report Accuracy Banner - Prominent Display */}
            {lastValidation && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Award className="w-10 h-10" />
                    </div>
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
                  
                  {lastValidation.aiValidation && (
                    <div className="text-center border-l border-white/30 pl-6">
                      <div className="text-sm opacity-80 mb-2">AI Quality</div>
                      <div className="text-4xl font-bold">{lastValidation.aiValidation.qualityScore}%</div>
                      <div className="text-xs mt-2 opacity-80">Semantic Review</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Validation Scores Display */}
            {lastValidation && (
              <ValidationScoresCard 
                scores={lastValidation.scores}
                aiValidation={lastValidation.aiValidation}
              />
            )}
          </TabsContent>

              {/* Modify Existing Report Tab */}
              <TabsContent value="modify" className="space-y-6">
                {/* Upload Existing Report */}
                <Card className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                    Upload Existing Report
                  </h3>
                  
                  {!modifyFile ? (
                    <div className="border-2 border-dashed rounded-lg p-12 text-center border-purple-300 bg-purple-50 hover:border-purple-400 transition-colors cursor-pointer"
                      onClick={() => modifyFileInputRef.current?.click()}
                    >
                      <input
                        ref={modifyFileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleModifyFileUpload(e.target.files)}
                      />
                      
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-slate-900 mb-1">
                            Upload report data to restructure
                          </p>
                          <p className="text-sm text-slate-500 mb-4">
                            Upload CSV/Excel data to regenerate with new format
                          </p>
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              modifyFileInputRef.current?.click();
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-purple-500 rounded-lg p-6 bg-purple-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{modifyFile.name}</p>
                            <p className="text-sm text-slate-500">
                              {(modifyFile.size / 1024).toFixed(2)} KB • Ready to restructure
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModifyFile(null)}
                          className="border-purple-300 hover:bg-purple-100"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-100 px-3 py-2 rounded">
                        <Check className="w-4 h-4" />
                        File uploaded successfully. Choose format and template below.
                      </div>
                    </div>
                  )}
                </Card>

                {/* New Output Format */}
                <Card className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-green-600" />
                    Choose New Output Format
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {outputFormats.map((format) => {
                      const Icon = format.icon;
                      return (
                        <div
                          key={format.id}
                          onClick={() => setModifyFormat(format.id)}
                          className={cn(
                            "p-5 rounded-lg border-2 cursor-pointer transition-all",
                            modifyFormat === format.id
                              ? "border-green-500 bg-green-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Icon className={cn("w-6 h-6", format.color)} />
                              <div>
                                <h4 className="font-semibold text-slate-900">{format.name}</h4>
                                <p className="text-xs text-slate-500">{format.extension}</p>
                              </div>
                            </div>
                            {modifyFormat === format.id && (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* New Template */}
                <Card className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-purple-600" />
                    Choose New Template
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setModifyTemplate(template.id)}
                        className={cn(
                          "p-5 rounded-lg border-2 cursor-pointer transition-all",
                          modifyTemplate === template.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-slate-900">{template.name}</h4>
                          {modifyTemplate === template.id && (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Modify Actions */}
                <div className="flex items-center justify-between p-6 bg-white rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">
                      {modifyFile ? `Ready to restructure: ${modifyFile.name}` : 'No file uploaded'}
                    </p>
                    <p className="text-sm text-slate-500">
                      New Format: {outputFormats.find(f => f.id === modifyFormat)?.name} • 
                      Template: {reportTemplates.find(t => t.id === modifyTemplate)?.name}
                    </p>
                    {modifyProgress && (
                      <p className="text-sm text-purple-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {modifyProgress}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleModifyReport}
                      disabled={!modifyFile || isModifying}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isModifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Restructuring...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Restructure Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Validation Scores Display for Modify Tab */}
                {lastValidation && (
                  <ValidationScoresCard 
                    scores={lastValidation.scores}
                    aiValidation={lastValidation.aiValidation}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
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
