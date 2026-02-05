import { createContext, useContext, useState, ReactNode } from 'react';

interface Column {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
}

interface DataContextType {
  data: any[];
  columns: Column[];
  fileName: string | null;
  setData: (data: any[]) => void;
  setColumns: (columns: Column[]) => void;
  setFileName: (name: string | null) => void;
  detectAndSetColumns: (data: any[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function detectColumnType(values: any[]): 'string' | 'number' | 'date' {
  const sampleValues = values.slice(0, 100).filter(v => v !== null && v !== undefined && v !== '');
  if (sampleValues.length === 0) return 'string';
  
  const numericCount = sampleValues.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numericCount / sampleValues.length > 0.8) return 'number';
  
  const dateCount = sampleValues.filter(v => {
    const str = String(v);
    return /^\d{4}-\d{2}-\d{2}/.test(str) || 
           /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str) ||
           /^\d{1,2}-\d{1,2}-\d{4}/.test(str);
  }).length;
  if (dateCount / sampleValues.length > 0.8) return 'date';
  
  return 'string';
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const detectAndSetColumns = (loadedData: any[]) => {
    if (!loadedData || loadedData.length === 0) {
      setColumns([]);
      return;
    }

    const columnNames = Object.keys(loadedData[0] || {});
    const detectedColumns: Column[] = columnNames.map(colName => ({
      id: colName,
      name: colName,
      type: detectColumnType(loadedData.map(row => row[colName]))
    }));
    
    setColumns(detectedColumns);
  };

  return (
    <DataContext.Provider value={{
      data,
      columns,
      fileName,
      setData,
      setColumns,
      setFileName,
      detectAndSetColumns
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
