import { ExcelConnector } from './excelConnector';
import { CSVConnector } from './csvConnector';
import { SQLConnector } from './sqlConnector';
import { WordConnector } from './wordConnector';
import type { NormalizedData, SQLConnectionConfig, MongoDBConnectionConfig, DataConnector, FileConnector } from './types';

export class DataConnectorFactory {
  static createFileConnector(fileType: string): FileConnector | null {
    switch (fileType.toLowerCase()) {
      case 'excel':
      case 'xlsx':
      case 'xls':
        return new ExcelConnector();
      case 'csv':
        return new CSVConnector();
      case 'word':
      case 'docx':
      case 'doc':
        return new WordConnector();
      default:
        return null;
    }
  }
  
  static createSQLConnector(config: SQLConnectionConfig): SQLConnector {
    return new SQLConnector(config);
  }
  
  static async readFile(file: File): Promise<NormalizedData> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) {
      throw new Error('File extension not found');
    }
    
    const connector = this.createFileConnector(extension);
    if (!connector) {
      throw new Error(`Unsupported file type: ${extension}`);
    }
    
    const isValid = await connector.validate(file);
    if (!isValid) {
      throw new Error(`Invalid file format for ${extension}`);
    }
    
    return connector.read(file);
  }
  
  static getFileConnectorTypes(): string[] {
    return ['excel', 'csv', 'word'];
  }
  
  static getSQLDrivers(): string[] {
    return ['mysql', 'postgresql', 'sqlite', 'mssql'];
  }
}

// Export all types and classes
export * from './types';
export { ExcelConnector } from './excelConnector';
export { CSVConnector } from './csvConnector';
export { SQLConnector } from './sqlConnector';
export { WordConnector } from './wordConnector';

