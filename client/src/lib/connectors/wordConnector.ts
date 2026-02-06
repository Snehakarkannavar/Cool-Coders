import mammoth from 'mammoth';
import type { NormalizedData, FileConnector } from './types';

export class WordConnector implements FileConnector {
  async validate(file: File): Promise<boolean> {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    return allowedTypes.includes(file.type) || 
           file.name.endsWith('.docx') || 
           file.name.endsWith('.doc');
  }

  async read(file: File): Promise<NormalizedData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value) {
        throw new Error('No text content found in Word document');
      }
      
      // Parse the text content to extract tables or structured data
      const lines = result.value.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('No readable content found in Word document');
      }
      
      // Simple table detection - look for tab-separated values or consistent patterns
      const tableData = this.parseTextAsTable(lines);
      
      if (tableData.columns.length === 0) {
        // If no table structure found, treat each line as a text entry
        const columns = [
          { id: 'line_number', name: 'Line Number', type: 'number' as const },
          { id: 'content', name: 'Content', type: 'string' as const }
        ];
        
        const rows = lines.map((line, index) => ({
          line_number: index + 1,
          content: line.trim()
        }));
        
        return { columns, rows };
      }
      
      return tableData;
    } catch (error) {
      throw new Error(`Failed to read Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private parseTextAsTable(lines: string[]): NormalizedData {
    // Try to detect table structure by looking for consistent delimiters
    const delimiters = ['\t', '|', ',', ';'];
    let bestDelimiter = '';
    let maxColumns = 0;
    
    for (const delimiter of delimiters) {
      const sampleRows = lines.slice(0, 5).map(line => line.split(delimiter));
      const columnCounts = sampleRows.map(row => row.length);
      const consistentCount = columnCounts[0];
      const isConsistent = columnCounts.every(count => count === consistentCount);
      
      if (isConsistent && consistentCount > maxColumns && consistentCount > 1) {
        maxColumns = consistentCount;
        bestDelimiter = delimiter;
      }
    }
    
    if (!bestDelimiter || maxColumns <= 1) {
      return { columns: [], rows: [] }; // No table structure found
    }
    
    const allRows = lines.map(line => line.split(bestDelimiter).map(cell => cell.trim()));
    
    // Assume first row is headers
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1).filter(row => row.length === headerRow.length);
    
    if (dataRows.length === 0) {
      return { columns: [], rows: [] };
    }
    
    // Create columns
    const columns = headerRow.map((header, index) => {
      const sampleValues = dataRows.slice(0, 10).map(row => row[index]);
      const type = this.detectColumnType(sampleValues);
      
      return {
        id: header.toLowerCase().replace(/\s+/g, '_'),
        name: header,
        type
      };
    });
    
    // Create rows
    const rows = dataRows.map(row => {
      const obj: any = {};
      headerRow.forEach((header, index) => {
        const columnId = header.toLowerCase().replace(/\s+/g, '_');
        obj[columnId] = row[index];
      });
      return obj;
    });
    
    return { columns, rows };
  }
  
  private detectColumnType(values: string[]): 'string' | 'number' | 'date' | 'boolean' {
    const nonEmptyValues = values.filter(v => v && v.trim());
    
    if (nonEmptyValues.length === 0) return 'string';
    
    // Check for boolean
    const booleanValues = nonEmptyValues.filter(v => 
      ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase())
    );
    if (booleanValues.length / nonEmptyValues.length > 0.8) return 'boolean';
    
    // Check for numbers
    const numberValues = nonEmptyValues.filter(v => !isNaN(Number(v)));
    if (numberValues.length / nonEmptyValues.length > 0.8) return 'number';
    
    // Check for dates
    const dateValues = nonEmptyValues.filter(v => {
      const date = new Date(v);
      return !isNaN(date.getTime()) && v.length > 6;
    });
    if (dateValues.length / nonEmptyValues.length > 0.8) return 'date';
    
    return 'string';
  }
}

