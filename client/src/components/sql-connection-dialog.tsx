import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SQLConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: { rows: any[] }) => void;
}

export function SQLConnectionDialog({ open, onOpenChange, onConnect }: SQLConnectionDialogProps) {
  const [connectionString, setConnectionString] = useState('');

  if (!open) return null;

  const handleConnect = () => {
    // Mock SQL data
    const mockData = [
      { id: 1, product: 'Widget A', sales: 1200, region: 'North' },
      { id: 2, product: 'Widget B', sales: 980, region: 'South' },
      { id: 3, product: 'Widget C', sales: 1500, region: 'East' },
    ];
    
    onConnect({ rows: mockData });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Connect to SQL Database</h2>
        <div className="space-y-4">
          <Input
            placeholder="Connection string"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleConnect}>Connect</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

