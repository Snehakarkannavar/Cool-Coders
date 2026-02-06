import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MongoDBConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: { rows: any[] }) => void;
}

export function MongoDBConnectionDialog({ open, onOpenChange, onConnect }: MongoDBConnectionDialogProps) {
  const [connectionUri, setConnectionUri] = useState('');

  if (!open) return null;

  const handleConnect = () => {
    // Mock MongoDB data
    const mockData = [
      { _id: '507f1f77bcf86cd799439011', name: 'Product X', price: 99.99, category: 'Electronics' },
      { _id: '507f1f77bcf86cd799439012', name: 'Product Y', price: 149.99, category: 'Books' },
      { _id: '507f1f77bcf86cd799439013', name: 'Product Z', price: 199.99, category: 'Clothing' },
    ];
    
    onConnect({ rows: mockData });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Connect to MongoDB</h2>
        <div className="space-y-4">
          <Input
            placeholder="MongoDB connection URI"
            value={connectionUri}
            onChange={(e) => setConnectionUri(e.target.value)}
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

