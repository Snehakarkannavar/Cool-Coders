// reportGenerator.ts - Document generation utilities with hybrid validation

import { discoverSchema, generateSchemaSummary, type DataSchema } from './schemaDiscovery';
import { validateData, type ValidationScore } from './dataValidation';
import { validateWithGemini, type AIValidationResult } from './geminiValidation';

export interface ComprehensiveReport {
  title: string;
  executive_summary: string;
  key_metrics: Array<{ name: string; value: string; change?: string }>;
  insights: string[];
  trends: string;
  chart_recommendations: string[];
  validation: {
    schema: DataSchema;
    scores: ValidationScore;
    aiValidation?: AIValidationResult;
  };
}

/**
 * Parse CSV file to JSON
 */
export function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        
        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Parse data rows
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Comprehensive data analysis with hybrid validation
 * Step 1: Discover schema automatically
 * Step 2: Run mathematical validation
 * Step 3: (Optional) Run AI semantic validation
 * Step 4: Generate insights
 */
export async function analyzeDataWithValidation(
  data: any[], 
  templateType: string,
  geminiApiKey?: string
): Promise<ComprehensiveReport> {
  
  // STEP 1: Auto-discover schema
  const schema = discoverSchema(data);
  console.log('Schema discovered:', schema);
  
  // STEP 2: Mathematical validation
  const validationScores = validateData(data, schema);
  console.log('Validation scores:', validationScores);
  
  // STEP 3: AI semantic validation (if API key provided)
  let aiValidation: AIValidationResult | undefined;
  if (geminiApiKey) {
    try {
      aiValidation = await validateWithGemini(data, schema, validationScores, geminiApiKey);
      console.log('AI validation:', aiValidation);
    } catch (error) {
      console.error('AI validation failed:', error);
    }
  }
  
  // STEP 4: Generate report content
  const reportContent = await generateReportContent(data, schema, validationScores, aiValidation, templateType);
  
  return {
    ...reportContent,
    validation: {
      schema,
      scores: validationScores,
      aiValidation
    }
  };
}

/**
 * Generate report content based on analysis
 */
async function generateReportContent(
  data: any[],
  schema: DataSchema,
  scores: ValidationScore,
  aiValidation: AIValidationResult | undefined,
  templateType: string
): Promise<Omit<ComprehensiveReport, 'validation'>> {
  
  // Generate title
  const title = `${templateType} - Data Analysis Report`;
  
  // Generate executive summary
  const executive_summary = generateExecutiveSummary(data, schema, scores, aiValidation);
  
  // Extract key metrics
  const key_metrics = extractKeyMetrics(data, schema);
  
  // Generate insights
  const insights = generateInsights(schema, scores, aiValidation);
  
  // Analyze trends
  const trends = analyzeTrends(data, schema);
  
  // Recommend charts
  const chart_recommendations = recommendCharts(schema);
  
  return {
    title,
    executive_summary,
    key_metrics,
    insights,
    trends,
    chart_recommendations
  };
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  data: any[],
  schema: DataSchema,
  scores: ValidationScore,
  aiValidation?: AIValidationResult
): string {
  const summary = [
    `This report analyzes a dataset containing ${schema.totalRows.toLocaleString()} records across ${schema.totalColumns} dimensions.`,
    
    scores.riskLevel === 'low' 
      ? `The data demonstrates high quality with an overall confidence score of ${scores.overall}%.`
      : scores.riskLevel === 'medium'
      ? `The data shows moderate quality with an overall confidence score of ${scores.overall}%. Some areas require attention.`
      : `The data shows quality concerns with an overall confidence score of ${scores.overall}%. Immediate review recommended.`,
    
    aiValidation 
      ? `AI validation confirms a logical consistency score of ${aiValidation.logicalConsistency}%. ${aiValidation.reasoning}`
      : `Mathematical validation indicates structural integrity at ${scores.structural}% and statistical consistency at ${scores.statistical}%.`
  ];
  
  return summary.join(' ');
}

/**
 * Extract key metrics from data
 */
function extractKeyMetrics(data: any[], schema: DataSchema): Array<{ name: string; value: string; change?: string }> {
  const metrics: Array<{ name: string; value: string; change?: string }> = [];
  
  // Total records
  metrics.push({
    name: 'Total Records',
    value: data.length.toLocaleString()
  });
  
  // Numeric column metrics
  schema.columns
    .filter(col => col.type === 'numeric' && col.statistics)
    .slice(0, 4)
    .forEach(col => {
      if (col.statistics?.mean) {
        metrics.push({
          name: `Avg ${col.name}`,
          value: col.statistics.mean.toLocaleString()
        });
      }
    });
  
  // Data completeness
  const avgNullPercentage = schema.columns.reduce((sum, col) => sum + col.nullPercentage, 0) / schema.columns.length;
  const completeness = 100 - avgNullPercentage;
  metrics.push({
    name: 'Data Completeness',
    value: `${completeness.toFixed(1)}%`,
    change: completeness >= 90 ? '+High' : completeness >= 70 ? '±Medium' : '-Low'
  });
  
  return metrics;
}

/**
 * Generate insights from validation
 */
function generateInsights(
  schema: DataSchema,
  scores: ValidationScore,
  aiValidation?: AIValidationResult
): string[] {
  const insights: string[] = [];
  
  // Add AI insights if available
  if (aiValidation && aiValidation.insights.length > 0) {
    insights.push(...aiValidation.insights.slice(0, 3));
  }
  
  // Add mathematical insights
  const highQualityColumns = schema.columns.filter(col => col.nullPercentage < 5);
  if (highQualityColumns.length > 0) {
    insights.push(`${highQualityColumns.length} columns demonstrate excellent data quality with minimal missing values`);
  }
  
  const numericColumns = schema.columns.filter(col => col.type === 'numeric');
  if (numericColumns.length > 0) {
    insights.push(`Dataset contains ${numericColumns.length} quantitative metrics suitable for statistical analysis`);
  }
  
  if (scores.overall >= 85) {
    insights.push('Data exhibits strong structural and statistical consistency across all dimensions');
  }
  
  // Add validation flags as insights
  const criticalFlags = scores.flags.filter(f => f.severity === 'critical');
  if (criticalFlags.length > 0) {
    insights.push(`${criticalFlags.length} critical data quality issue(s) detected requiring immediate attention`);
  }
  
  return insights.slice(0, 5);
}

/**
 * Analyze trends in data
 */
function analyzeTrends(data: any[], schema: DataSchema): string {
  const trends: string[] = [];
  
  // Analyze numeric trends
  schema.columns
    .filter(col => col.type === 'numeric' && col.statistics)
    .forEach(col => {
      if (col.statistics?.range) {
        trends.push(`${col.name} ranges from ${col.statistics.range}`);
      }
    });
  
  // Check for date ranges
  const dateColumns = schema.columns.filter(col => col.type === 'date');
  if (dateColumns.length > 0) {
    dateColumns.forEach(col => {
      if (col.statistics?.range) {
        trends.push(`Time series spans ${col.statistics.range}`);
      }
    });
  }
  
  return trends.length > 0 
    ? trends.join('. ') + '.'
    : 'No significant temporal or numerical trends detected in the current dataset.';
}

/**
 * Recommend appropriate chart types
 */
function recommendCharts(schema: DataSchema): string[] {
  const recommendations: string[] = [];
  
  const numericCols = schema.columns.filter(col => col.type === 'numeric');
  const categoricalCols = schema.columns.filter(col => col.type === 'categorical');
  const dateCols = schema.columns.filter(col => col.type === 'date');
  
  if (dateCols.length > 0 && numericCols.length > 0) {
    recommendations.push(`Line chart showing ${numericCols[0].name} over ${dateCols[0].name} to visualize temporal trends`);
  }
  
  if (categoricalCols.length > 0 && numericCols.length > 0) {
    recommendations.push(`Bar chart comparing ${numericCols[0].name} across ${categoricalCols[0].name} categories`);
  }
  
  if (numericCols.length >= 2) {
    recommendations.push(`Scatter plot analyzing relationship between ${numericCols[0].name} and ${numericCols[1].name}`);
  }
  
  if (categoricalCols.length > 0) {
    recommendations.push(`Pie chart showing distribution of ${categoricalCols[0].name}`);
  }
  
  if (numericCols.length > 0) {
    recommendations.push(`Histogram displaying distribution of ${numericCols[0].name} values`);
  }
  
  return recommendations.slice(0, 5);
}

/**
 * Legacy function for backward compatibility
 * Now uses the new validation system
 */
export async function analyzeDataWithClaude(data: any[], templateType: string) {
  // Use new validation system without Gemini
  const result = await analyzeDataWithValidation(data, templateType);
  
  // Return in old format for compatibility
  return {
    title: result.title,
    executive_summary: result.executive_summary,
    key_metrics: result.key_metrics,
    insights: result.insights,
    trends: result.trends,
    chart_recommendations: result.chart_recommendations
  };
}

/**
 * Generate PDF Report
 */
export async function generatePDFReport(reportContent: any, filename: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 1in; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 4px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #1e40af;
            font-size: 32px;
            margin: 0 0 10px 0;
          }
          .date {
            color: #64748b;
            font-size: 14px;
          }
          h2 {
            color: #374151;
            font-size: 24px;
            margin-top: 40px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .metric-card {
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .metric-name {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .metric-change {
            font-size: 14px;
            color: #059669;
          }
          .metric-change.negative {
            color: #dc2626;
          }
          .insight {
            margin: 15px 0;
            padding-left: 20px;
            border-left: 3px solid #3b82f6;
            padding: 12px 20px;
            background: #eff6ff;
            border-radius: 4px;
          }
          .insight-bullet {
            color: #2563eb;
            font-weight: 600;
            margin-right: 8px;
          }
          .trends-section {
            background: #fefce8;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #eab308;
            margin: 20px 0;
          }
          .chart-recommendation {
            background: #f0fdf4;
            padding: 10px 15px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 3px solid #22c55e;
            font-size: 14px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportContent.title || 'Data Analysis Report'}</h1>
          <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
        </div>
        
        <h2>Executive Summary</h2>
        <div class="summary">
          ${reportContent.executive_summary || 'No summary available'}
        </div>
        
        <h2>Key Performance Metrics</h2>
        <div class="metrics-grid">
          ${(reportContent.key_metrics || []).map((m: any) => `
            <div class="metric-card">
              <div class="metric-name">${m.name}</div>
              <div class="metric-value">${m.value}</div>
              ${m.change ? `<div class="metric-change ${m.change.startsWith('-') ? 'negative' : ''}">${m.change}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <h2>Key Insights</h2>
        ${(reportContent.insights || []).map((insight: string, idx: number) => `
          <div class="insight">
            <span class="insight-bullet">${idx + 1}.</span>${insight}
          </div>
        `).join('')}
        
        <h2>Trend Analysis</h2>
        <div class="trends-section">
          ${reportContent.trends || 'No significant trends identified in the current dataset.'}
        </div>
        
        ${reportContent.chart_recommendations && reportContent.chart_recommendations.length > 0 ? `
          <h2>Recommended Visualizations</h2>
          ${reportContent.chart_recommendations.map((chart: string) => `
            <div class="chart-recommendation">📊 ${chart}</div>
          `).join('')}
        ` : ''}
        
        <div class="footer">
          This report was automatically generated using AI-powered data analysis.
          <br>For questions or additional analysis, please contact your data team.
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.pdf', '.html');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate DOCX Report
 */
export async function generateDOCXReport(reportContent: any, filename: string) {
  const content = `
═══════════════════════════════════════════════════════════════
${(reportContent.title || 'DATA ANALYSIS REPORT').toUpperCase()}
═══════════════════════════════════════════════════════════════

Generated: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}


EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────

${reportContent.executive_summary || 'No summary available'}


KEY PERFORMANCE METRICS
─────────────────────────────────────────────────────────────────

${(reportContent.key_metrics || []).map((m: any) => `
▸ ${m.name}
  Value: ${m.value}
  ${m.change ? `Change: ${m.change}` : ''}
`).join('\n')}


KEY INSIGHTS
─────────────────────────────────────────────────────────────────

${(reportContent.insights || []).map((insight: string, idx: number) => `
${idx + 1}. ${insight}
`).join('\n')}


TREND ANALYSIS
─────────────────────────────────────────────────────────────────

${reportContent.trends || 'No significant trends identified in the current dataset.'}


${reportContent.chart_recommendations && reportContent.chart_recommendations.length > 0 ? `
RECOMMENDED VISUALIZATIONS
─────────────────────────────────────────────────────────────────

${reportContent.chart_recommendations.map((chart: string) => `• ${chart}`).join('\n')}
` : ''}


═══════════════════════════════════════════════════════════════
End of Report
═══════════════════════════════════════════════════════════════

This report was automatically generated using AI-powered data analysis.
For questions or additional analysis, please contact your data team.
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.docx', '.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate PPTX Report
 */
export async function generatePPTXReport(reportContent: any, filename: string) {
  const slides = `
╔══════════════════════════════════════════════════════════════╗
║                       SLIDE 1: TITLE                         ║
╚══════════════════════════════════════════════════════════════╝

${reportContent.title || 'Data Analysis Report'}

Generated: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric'
})}


╔══════════════════════════════════════════════════════════════╗
║                  SLIDE 2: EXECUTIVE SUMMARY                  ║
╚══════════════════════════════════════════════════════════════╝

Executive Summary

${reportContent.executive_summary || 'No summary available'}


╔══════════════════════════════════════════════════════════════╗
║                  SLIDE 3: KEY METRICS                        ║
╚══════════════════════════════════════════════════════════════╝

Key Performance Metrics

${(reportContent.key_metrics || []).map((m: any) => `
${m.name}
${m.value}
${m.change || ''}
`).join('\n')}


╔══════════════════════════════════════════════════════════════╗
║                  SLIDE 4: KEY INSIGHTS                       ║
╚══════════════════════════════════════════════════════════════╝

Key Insights

${(reportContent.insights || []).map((insight: string, idx: number) => `
${idx + 1}. ${insight}
`).join('\n')}


╔══════════════════════════════════════════════════════════════╗
║                  SLIDE 5: TRENDS                             ║
╚══════════════════════════════════════════════════════════════╝

Trend Analysis

${reportContent.trends || 'No significant trends identified'}


${reportContent.chart_recommendations && reportContent.chart_recommendations.length > 0 ? `
╔══════════════════════════════════════════════════════════════╗
║              SLIDE 6: VISUALIZATIONS                         ║
╚══════════════════════════════════════════════════════════════╝

Recommended Charts

${reportContent.chart_recommendations.map((chart: string) => `• ${chart}`).join('\n')}
` : ''}


╔══════════════════════════════════════════════════════════════╗
║                   SLIDE 7: THANK YOU                         ║
╚══════════════════════════════════════════════════════════════╝

Thank You

Questions?

`;

  const blob = new Blob([slides], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.pptx', '_slides.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

