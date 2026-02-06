import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload as CloudUpload } from 'lucide-react';

interface FileUploaderProps {
  onDataLoaded: (data: any[], fileName: string) => void;
  className?: string;
}

export function FileUploader({ onDataLoaded, className }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    const fileName = file.name;
    
    if (file.type === 'text/csv' || fileName.endsWith('.csv')) {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = row[index]?.trim() || '';
        });
        return obj;
      }).filter(row => Object.values(row).some(val => val !== ''));
      
      onDataLoaded(data, fileName);
    } else {
      // Mock data for demo
      const mockData = [
        { Name: 'John Doe', Age: 30, City: 'New York', Sales: 12000 },
        { Name: 'Jane Smith', Age: 25, City: 'Los Angeles', Sales: 15000 },
        { Name: 'Bob Johnson', Age: 35, City: 'Chicago', Sales: 18000 },
        { Name: 'Alice Brown', Age: 28, City: 'Houston', Sales: 14000 },
        { Name: 'Charlie Wilson', Age: 32, City: 'Phoenix', Sales: 16000 },
      ];
      onDataLoaded(mockData, fileName);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CloudUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium mb-2">Drop your files here</p>
      <p className="text-sm text-gray-500 mb-4">Supports CSV, Excel, and other data formats</p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 cursor-pointer"
      >
        Choose Files
      </label>
    </div>
  );
}

