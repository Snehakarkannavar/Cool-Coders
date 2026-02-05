import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            onDataLoaded(results.data, file.name);
            setIsLoading(false);
          },
          error: (err) => {
            setError(`CSV Error: ${err.message}`);
            setIsLoading(false);
          }
        });
      } else if (file.name.match(/\.(xls|xlsx)$/)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            onDataLoaded(jsonData, file.name);
            setIsLoading(false);
          } catch (err) {
            setError("Failed to parse Excel file");
            setIsLoading(false);
          }
        };
        reader.readAsBinaryString(file);
      } else {
        setError("Unsupported file format. Please upload CSV or Excel.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-out",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.01] shadow-lg" 
          : "border-border hover:border-primary/50 hover:bg-slate-50",
        isLoading && "pointer-events-none opacity-80"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        accept=".csv, .xls, .xlsx"
        onChange={onFileSelect}
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300",
          isDragging ? "bg-primary text-white" : "bg-primary/10 text-primary"
        )}>
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>
        
        <h3 className="text-xl font-display font-semibold text-slate-900 mb-2">
          {isLoading ? "Processing file..." : "Upload your data"}
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
          Drag and drop your CSV or Excel file here, or click to browse.
        </p>
        
        <div className="flex gap-2 text-xs font-medium text-slate-500">
          <span className="bg-slate-100 px-2 py-1 rounded">.CSV</span>
          <span className="bg-slate-100 px-2 py-1 rounded">.XLSX</span>
        </div>

        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-red-50 p-3 text-red-600 text-sm font-medium flex items-center justify-center animate-in slide-in-from-bottom-5">
            <X className="w-4 h-4 mr-2" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
