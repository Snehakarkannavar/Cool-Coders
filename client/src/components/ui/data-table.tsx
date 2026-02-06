import React from 'react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  title: string;
  type?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  className?: string;
}

export function DataTable({ data, columns, className }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto rounded-lg border', className)}>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.slice(0, 100).map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                >
                  {row[column.key]?.toString() || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && (
        <div className="px-4 py-3 text-sm text-gray-500 border-t">
          Showing first 100 of {data.length} rows
        </div>
      )}
    </div>
  );
}

