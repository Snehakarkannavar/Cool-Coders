import React from 'react';
import { FileUploader } from './ui/file-uploader';
import { Button } from '@/components/ui/button';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataLoaded: (data: any[], fileName: string) => void;
}

export function FileUploadDialog({ open, onOpenChange, onDataLoaded }: FileUploadDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Upload File</h2>
        <FileUploader onDataLoaded={onDataLoaded} />
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

