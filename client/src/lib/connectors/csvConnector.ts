import Papa from 'papaparse';
import type { NormalizedData, Column, FileConnector } from './types';

export class CSVConnector implements FileConnector {
  async validate(file: File): Promise<boolean> {
    return file.type === 'text/csv' || file.name.endsWith('.csv');
  }

  async read(file: File): Promise<NormalizedData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            return;
          }
          
          if (!results.data || results.data.length === 0) {
            reject(new Error('No data found in CSV file'));
            return;
          }
          
          // Get column names from the first row
          const firstRow = results.data[0] as any;
          const columnNames = Object.keys(firstRow);
          
          // Detect column types by sampling data
          const columns: Column[] = columnNames.map(name => {
            const sampleValues = results.data.slice(0, 10).map((row: any) => row[name]);
            const type = this.detectColumnType(sampleValues);
            
            return {
              id: name.toLowerCase().replace(/\s+/g, '_'),
              name,
              type
            };
          });
          
          // Process rows with proper column IDs
          const rows = results.data.map((row: any) => {
            const processedRow: any = {};
            columnNames.forEach(name => {
              const columnId = name.toLowerCase().replace(/\s+/g, '_');
              processedRow[columnId] = row[name];
            });
            return processedRow;
          });
          
          resolve({
            columns,
            rows
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  }
  
  private detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
    const nonEmptyValues = values.filter(v => v != null && v !== '');
    
    if (nonEmptyValues.length === 0) return 'string';
    
    // Check for boolean
    const booleanValues = nonEmptyValues.filter(v => 
      typeof v === 'boolean' || 
      (typeof v === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase()))
    );
    if (booleanValues.length / nonEmptyValues.length > 0.8) return 'boolean';
    
    // Check for numbers
    const numberValues = nonEmptyValues.filter(v => !isNaN(Number(v)) && v !== '');
    if (numberValues.length / nonEmptyValues.length > 0.8) return 'number';
    
    // Check for dates
    const dateValues = nonEmptyValues.filter(v => {
      const date = new Date(v);
      return !isNaN(date.getTime()) && v.toString().length > 6;
    });
    if (dateValues.length / nonEmptyValues.length > 0.8) return 'date';
    
    return 'string';
  }
}

