import * as XLSX from 'xlsx';
import type { NormalizedData, Column, FileConnector } from './types';

export class ExcelConnector implements FileConnector {
  async validate(file: File): Promise<boolean> {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return allowedTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  }

  async read(file: File): Promise<NormalizedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('No data found in Excel file'));
            return;
          }
          
          // Extract headers from first row
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
          
          // Detect column types
          const columns: Column[] = headers.map((header, index) => {
            const sampleValues = rows.slice(0, 10).map(row => (row as any[])[index]);
            const type = this.detectColumnType(sampleValues);
            
            return {
              id: header.toString().toLowerCase().replace(/\s+/g, '_'),
              name: header.toString(),
              type
            };
          });
          
          // Convert rows to objects
          const normalizedRows = (rows as any[]).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              const columnId = header.toString().toLowerCase().replace(/\s+/g, '_');
              obj[columnId] = row[index];
            });
            return obj;
          });
          
          resolve({
            columns,
            rows: normalizedRows
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  private detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
    const nonEmptyValues = values.filter(v => v != null && v !== '');
    
    if (nonEmptyValues.length === 0) return 'string';
    
    // Check for boolean
    const booleanValues = nonEmptyValues.filter(v => 
      typeof v === 'boolean' || 
      (typeof v === 'string' && ['true', 'false', 'yes', 'no'].includes(v.toLowerCase()))
    );
    if (booleanValues.length / nonEmptyValues.length > 0.8) return 'boolean';
    
    // Check for numbers
    const numberValues = nonEmptyValues.filter(v => !isNaN(Number(v)));
    if (numberValues.length / nonEmptyValues.length > 0.8) return 'number';
    
    // Check for dates
    const dateValues = nonEmptyValues.filter(v => !isNaN(Date.parse(v)));
    if (dateValues.length / nonEmptyValues.length > 0.8) return 'date';
    
    return 'string';
  }
}

