import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Column {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

interface DataSource {
  id: string;
  name: string;
  type: 'file' | 'sql' | 'mongodb';
  data: any[];
  columns: Column[];
}

interface DataContextType {
  data: any[];
  columns: Column[];
  fileName: string;
  dataSources: DataSource[];
  activeDataSourceId: string | null;
  setData: (data: any[]) => void;
  setColumns: (columns: Column[]) => void;
  setFileName: (name: string) => void;
  detectAndSetColumns: (data: any[]) => void;
  addDataSource: (dataSource: DataSource) => void;
  removeDataSource: (id: string) => void;
  setActiveDataSource: (id: string) => void;
  updateDataSourceName: (id: string, newName: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [fileName, setFileName] = useState('');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [activeDataSourceId, setActiveDataSourceId] = useState<string | null>(null);

  const detectAndSetColumns = (data: any[]) => {
    if (data.length === 0) {
      setColumns([]);
      return;
    }

    const sampleRow = data[0];
    const detectedColumns: Column[] = Object.keys(sampleRow).map(key => {
      const value = sampleRow[key];
      let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
      
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value && !isNaN(Date.parse(value))) {
        type = 'date';
      }

      return {
        id: key,
        name: key,
        type
      };
    });

    setColumns(detectedColumns);
  };

  const addDataSource = (dataSource: DataSource) => {
    console.log('📊 DataContext - Adding data source:', {
      id: dataSource.id,
      name: dataSource.name,
      type: dataSource.type,
      rows: dataSource.data?.length || 0,
      columns: dataSource.columns?.length || 0
    });
    
    setDataSources(prev => {
      const updated = [...prev, dataSource];
      console.log('📊 DataContext - Updated data sources:', updated.map(ds => ({
        id: ds.id,
        name: ds.name,
        rows: ds.data?.length || 0
      })));
      return updated;
    });
    
    if (!activeDataSourceId) {
      console.log('📊 DataContext - Setting as active data source:', dataSource.id);
      setActiveDataSourceId(dataSource.id);
      setData(dataSource.data);
      setColumns(dataSource.columns);
      setFileName(dataSource.name);
    }
  };

  const removeDataSource = (id: string) => {
    setDataSources(prev => prev.filter(ds => ds.id !== id));
    if (activeDataSourceId === id) {
      const remaining = dataSources.filter(ds => ds.id !== id);
      setActiveDataSourceId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const setActiveDataSource = (id: string) => {
    setActiveDataSourceId(id);
    const source = dataSources.find(ds => ds.id === id);
    if (source) {
      setData(source.data);
      setColumns(source.columns);
      setFileName(source.name);
    }
  };

  const updateDataSourceName = (id: string, newName: string) => {
    setDataSources(prev => 
      prev.map(ds => 
        ds.id === id ? { ...ds, name: newName } : ds
      )
    );
    
    // Update fileName if this is the active data source
    if (activeDataSourceId === id) {
      setFileName(newName);
    }
  };

  return (
    <DataContext.Provider value={{
      data,
      columns,
      fileName,
      dataSources,
      activeDataSourceId,
      setData,
      setColumns,
      setFileName,
      detectAndSetColumns,
      addDataSource,
      removeDataSource,
      setActiveDataSource,
      updateDataSourceName
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

