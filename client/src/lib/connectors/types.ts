export interface Column {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface NormalizedData {
  columns: Column[];
  rows: any[];
}

export interface SQLConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  driver?: 'mysql' | 'postgresql' | 'sqlite' | 'mssql';
}

export interface MongoDBConnectionConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  collection: string;
  authDatabase?: string;
}

export interface DataConnector {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  query(query: string): Promise<NormalizedData>;
  getSchema(): Promise<Column[]>;
  isConnected(): boolean;
}

export interface FileConnector {
  read(file: File): Promise<NormalizedData>;
  validate(file: File): Promise<boolean>;
}

