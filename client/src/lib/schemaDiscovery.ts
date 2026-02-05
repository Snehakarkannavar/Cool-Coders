/**
 * Schema Discovery Engine
 * Automatically infers data types, statistics, and patterns from raw data
 */

export interface ColumnSchema {
  name: string;
  type: 'numeric' | 'date' | 'categorical' | 'text' | 'boolean';
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    mode?: any;
    range?: string;
  };
}

export interface DataSchema {
  totalRows: number;
  totalColumns: number;
  columns: ColumnSchema[];
  summary: string;
}

/**
 * Detect if a value is a valid date
 */
function isDate(value: any): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.toString().match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/);
}

/**
 * Detect if a value is numeric
 */
function isNumeric(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Detect if a value is boolean
 */
function isBoolean(value: any): boolean {
  if (typeof value === 'boolean') return true;
  const str = String(value).toLowerCase();
  return ['true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n'].includes(str);
}

/**
 * Infer column type from sample values
 */
function inferColumnType(values: any[]): 'numeric' | 'date' | 'categorical' | 'text' | 'boolean' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'text';
  
  // Count each type
  let numericCount = 0;
  let dateCount = 0;
  let booleanCount = 0;
  
  for (const value of nonNullValues) {
    if (isNumeric(value)) numericCount++;
    if (isDate(value)) dateCount++;
    if (isBoolean(value)) booleanCount++;
  }
  
  const total = nonNullValues.length;
  
  // 95% threshold for type detection
  if (numericCount / total >= 0.95) return 'numeric';
  if (dateCount / total >= 0.95) return 'date';
  if (booleanCount / total >= 0.95) return 'boolean';
  
  // Check for categorical (limited unique values)
  const uniqueValues = new Set(nonNullValues);
  const uniqueRatio = uniqueValues.size / total;
  
  if (uniqueRatio < 0.5 && uniqueValues.size <= 20) return 'categorical';
  
  return 'text';
}

/**
 * Calculate statistics for numeric columns
 */
function calculateNumericStats(values: number[]): any {
  const validValues = values.filter(v => !isNaN(v) && isFinite(v));
  
  if (validValues.length === 0) return null;
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Find mode
  const frequency: { [key: number]: number } = {};
  validValues.forEach(v => {
    frequency[v] = (frequency[v] || 0) + 1;
  });
  const mode = Number(Object.keys(frequency).reduce((a, b) => frequency[Number(a)] > frequency[Number(b)] ? a : b));
  
  return {
    min,
    max,
    mean: Math.round(mean * 100) / 100,
    median,
    mode,
    range: `${min}–${max}`
  };
}

/**
 * Discover schema from raw data
 */
export function discoverSchema(data: any[]): DataSchema {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      columns: [],
      summary: 'No data provided'
    };
  }
  
  const columns: ColumnSchema[] = [];
  const columnNames = Object.keys(data[0]);
  
  for (const columnName of columnNames) {
    // Extract all values for this column
    const values = data.map(row => row[columnName]);
    
    // Count nulls
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    const nullPercentage = (nullCount / values.length) * 100;
    
    // Get unique count
    const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
    const uniqueCount = uniqueValues.size;
    
    // Infer type
    const type = inferColumnType(values);
    
    // Calculate statistics based on type
    let statistics: any = undefined;
    
    if (type === 'numeric') {
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      statistics = calculateNumericStats(numericValues);
    } else if (type === 'date') {
      const dateValues = values
        .filter(v => isDate(v))
        .map(v => new Date(v))
        .sort((a, b) => a.getTime() - b.getTime());
      
      if (dateValues.length > 0) {
        statistics = {
          range: `${dateValues[0].toISOString().split('T')[0]} to ${dateValues[dateValues.length - 1].toISOString().split('T')[0]}`
        };
      }
    } else if (type === 'categorical') {
      statistics = {
        mode: Array.from(uniqueValues)[0]
      };
    }
    
    // Get sample values (first 5 unique)
    const sampleValues = Array.from(uniqueValues).slice(0, 5);
    
    columns.push({
      name: columnName,
      type,
      nullPercentage: Math.round(nullPercentage * 10) / 10,
      uniqueCount,
      sampleValues,
      statistics
    });
  }
  
  return {
    totalRows: data.length,
    totalColumns: columns.length,
    columns,
    summary: `Discovered ${columns.length} columns in ${data.length} rows`
  };
}

/**
 * Generate human-readable schema summary
 */
export function generateSchemaSummary(schema: DataSchema): string {
  const parts: string[] = [];
  
  parts.push(`Dataset: ${schema.totalRows} rows × ${schema.totalColumns} columns`);
  
  schema.columns.forEach(col => {
    let line = `• ${col.name}: ${col.type}`;
    
    if (col.statistics?.range) {
      line += ` (${col.statistics.range})`;
    }
    
    if (col.nullPercentage > 0) {
      line += ` [${col.nullPercentage}% nulls]`;
    }
    
    if (col.type === 'categorical') {
      line += ` [${col.uniqueCount} unique values]`;
    }
    
    parts.push(line);
  });
  
  return parts.join('\n');
}
