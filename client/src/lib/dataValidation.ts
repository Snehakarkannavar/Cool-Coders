/**
 * Data Validation Engine
 * Performs soft validation with scoring (no hard failures)
 */

import { DataSchema } from './schemaDiscovery';

export interface ValidationScore {
  structural: number;        // 0-100: Data structure consistency
  statistical: number;       // 0-100: Statistical consistency
  anomaly: number;          // 0-100: Anomaly detection (100 = no anomalies)
  overall: number;          // 0-100: Weighted average
  riskLevel: 'low' | 'medium' | 'high';
  flags: ValidationFlag[];
}

export interface ValidationFlag {
  severity: 'info' | 'warning' | 'critical';
  column?: string;
  message: string;
  impact: number; // How much this reduces the score
}

/**
 * Calculate structural consistency score
 * Checks: null percentage, data type consistency, completeness
 */
function calculateStructuralScore(data: any[], schema: DataSchema): { score: number; flags: ValidationFlag[] } {
  const flags: ValidationFlag[] = [];
  let totalDeductions = 0;
  
  // Check null percentages
  schema.columns.forEach(col => {
    if (col.nullPercentage > 50) {
      const deduction = Math.min(20, col.nullPercentage / 5);
      totalDeductions += deduction;
      flags.push({
        severity: 'critical',
        column: col.name,
        message: `High null percentage: ${col.nullPercentage}%`,
        impact: deduction
      });
    } else if (col.nullPercentage > 20) {
      const deduction = 5;
      totalDeductions += deduction;
      flags.push({
        severity: 'warning',
        column: col.name,
        message: `Moderate null percentage: ${col.nullPercentage}%`,
        impact: deduction
      });
    }
  });
  
  // Check for completely empty columns
  const emptyColumns = schema.columns.filter(col => col.uniqueCount === 0);
  if (emptyColumns.length > 0) {
    const deduction = emptyColumns.length * 10;
    totalDeductions += deduction;
    flags.push({
      severity: 'critical',
      message: `${emptyColumns.length} empty column(s) detected`,
      impact: deduction
    });
  }
  
  // Check for low unique values in non-categorical columns
  schema.columns.forEach(col => {
    if (col.type === 'numeric' && col.uniqueCount < 3 && data.length > 10) {
      const deduction = 5;
      totalDeductions += deduction;
      flags.push({
        severity: 'warning',
        column: col.name,
        message: `Low variation in numeric column (${col.uniqueCount} unique values)`,
        impact: deduction
      });
    }
  });
  
  const score = Math.max(0, 100 - totalDeductions);
  return { score, flags };
}

/**
 * Calculate statistical consistency score
 * Checks: outliers, distribution, trends
 */
function calculateStatisticalScore(data: any[], schema: DataSchema): { score: number; flags: ValidationFlag[] } {
  const flags: ValidationFlag[] = [];
  let totalDeductions = 0;
  
  // Check numeric columns for outliers
  schema.columns.forEach(col => {
    if (col.type === 'numeric' && col.statistics) {
      const values = data.map(row => parseFloat(row[col.name])).filter(v => !isNaN(v));
      
      if (values.length === 0) return;
      
      // Calculate IQR for outlier detection
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const outliers = values.filter(v => v < lowerBound || v > upperBound);
      const outlierPercentage = (outliers.length / values.length) * 100;
      
      if (outlierPercentage > 10) {
        const deduction = Math.min(15, outlierPercentage / 2);
        totalDeductions += deduction;
        flags.push({
          severity: 'warning',
          column: col.name,
          message: `${outlierPercentage.toFixed(1)}% outliers detected`,
          impact: deduction
        });
      }
      
      // Check for sudden spikes (coefficient of variation)
      const mean = col.statistics.mean || 0;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;
      
      if (cv > 200) {
        const deduction = 10;
        totalDeductions += deduction;
        flags.push({
          severity: 'warning',
          column: col.name,
          message: `High variability detected (CV: ${cv.toFixed(0)}%)`,
          impact: deduction
        });
      }
    }
  });
  
  // Check for duplicate rows
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  const duplicatePercentage = ((data.length - uniqueRows.size) / data.length) * 100;
  
  if (duplicatePercentage > 20) {
    const deduction = Math.min(20, duplicatePercentage);
    totalDeductions += deduction;
    flags.push({
      severity: 'critical',
      message: `High duplicate rate: ${duplicatePercentage.toFixed(1)}%`,
      impact: deduction
    });
  } else if (duplicatePercentage > 5) {
    const deduction = 5;
    totalDeductions += deduction;
    flags.push({
      severity: 'info',
      message: `Moderate duplicate rate: ${duplicatePercentage.toFixed(1)}%`,
      impact: deduction
    });
  }
  
  const score = Math.max(0, 100 - totalDeductions);
  return { score, flags };
}

/**
 * Detect anomalies in the data
 */
function detectAnomalies(data: any[], schema: DataSchema): { score: number; flags: ValidationFlag[] } {
  const flags: ValidationFlag[] = [];
  let totalDeductions = 0;
  
  // Check for missing data patterns
  const rowsWithMissingData = data.filter(row => {
    const values = Object.values(row);
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    return nullCount / values.length > 0.3;
  });
  
  const missingDataPercentage = (rowsWithMissingData.length / data.length) * 100;
  
  if (missingDataPercentage > 20) {
    const deduction = Math.min(25, missingDataPercentage);
    totalDeductions += deduction;
    flags.push({
      severity: 'critical',
      message: `${missingDataPercentage.toFixed(1)}% of rows have >30% missing data`,
      impact: deduction
    });
  }
  
  // Check for date consistency
  const dateColumns = schema.columns.filter(col => col.type === 'date');
  dateColumns.forEach(col => {
    const dates = data
      .map(row => row[col.name])
      .filter(v => v)
      .map(v => new Date(v))
      .filter(d => !isNaN(d.getTime()));
    
    if (dates.length > 1) {
      // Check for future dates
      const now = new Date();
      const futureDates = dates.filter(d => d > now);
      const futureDatePercentage = (futureDates.length / dates.length) * 100;
      
      if (futureDatePercentage > 5) {
        const deduction = 10;
        totalDeductions += deduction;
        flags.push({
          severity: 'warning',
          column: col.name,
          message: `${futureDatePercentage.toFixed(1)}% future dates detected`,
          impact: deduction
        });
      }
    }
  });
  
  // Check for data type mismatches within columns
  schema.columns.forEach(col => {
    if (col.type === 'numeric') {
      const values = data.map(row => row[col.name]);
      const nonNumericCount = values.filter(v => v && !isFinite(parseFloat(v))).length;
      const mismatchPercentage = (nonNumericCount / values.length) * 100;
      
      if (mismatchPercentage > 5) {
        const deduction = Math.min(15, mismatchPercentage);
        totalDeductions += deduction;
        flags.push({
          severity: 'warning',
          column: col.name,
          message: `${mismatchPercentage.toFixed(1)}% non-numeric values in numeric column`,
          impact: deduction
        });
      }
    }
  });
  
  const score = Math.max(0, 100 - totalDeductions);
  return { score, flags };
}

/**
 * Determine risk level based on scores
 */
function determineRiskLevel(structural: number, statistical: number, anomaly: number): 'low' | 'medium' | 'high' {
  const overall = (structural + statistical + anomaly) / 3;
  
  if (overall >= 85) return 'low';
  if (overall >= 70) return 'medium';
  return 'high';
}

/**
 * Validate data and return comprehensive scores
 */
export function validateData(data: any[], schema: DataSchema): ValidationScore {
  const structuralResult = calculateStructuralScore(data, schema);
  const statisticalResult = calculateStatisticalScore(data, schema);
  const anomalyResult = detectAnomalies(data, schema);
  
  const allFlags = [
    ...structuralResult.flags,
    ...statisticalResult.flags,
    ...anomalyResult.flags
  ];
  
  // Calculate weighted overall score
  const overall = Math.round(
    (structuralResult.score * 0.35 +
     statisticalResult.score * 0.35 +
     anomalyResult.score * 0.30)
  );
  
  return {
    structural: Math.round(structuralResult.score),
    statistical: Math.round(statisticalResult.score),
    anomaly: Math.round(anomalyResult.score),
    overall,
    riskLevel: determineRiskLevel(
      structuralResult.score,
      statisticalResult.score,
      anomalyResult.score
    ),
    flags: allFlags
  };
}

