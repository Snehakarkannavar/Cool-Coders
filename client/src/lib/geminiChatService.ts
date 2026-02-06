/**
 * Gemini AI Integration for Chat Assistant
 * Uses Google's Gemini API to analyze data and answer questions
 */

import { DataColumn } from '@/contexts/DataContext';

export interface DatasetInfo {
  name: string;
  data: any[];
  columns: DataColumn[];
}

export interface ChatGeminiResponse {
  response: string;
  shouldNavigateToVisualBuilder?: boolean;
  suggestedChartType?: string;
  chartConfig?: any;
}

/**
 * Send user query and dataset to Gemini for intelligent analysis
 */
export async function askGemini(
  userQuery: string,
  datasetInfo: DatasetInfo,
  apiKey: string
): Promise<ChatGeminiResponse> {
  
  // Smart sampling based on dataset size
  let sampledData: any[];
  const totalRows = datasetInfo.data.length;
  
  if (totalRows <= 100) {
    // Small dataset: Send all data
    sampledData = datasetInfo.data;
  } else if (totalRows <= 500) {
    // Medium dataset: Send 100 rows (first 50 + last 50)
    sampledData = [...datasetInfo.data.slice(0, 50), ...datasetInfo.data.slice(-50)];
  } else if (totalRows <= 2000) {
    // Large dataset: Send 75 rows (first 40 + middle 15 + last 20)
    const middle = Math.floor(totalRows / 2);
    sampledData = [
      ...datasetInfo.data.slice(0, 40),
      ...datasetInfo.data.slice(middle - 7, middle + 8),
      ...datasetInfo.data.slice(-20)
    ];
  } else {
    // Very large dataset: Send 50 rows (first 25 + last 25)
    sampledData = [...datasetInfo.data.slice(0, 25), ...datasetInfo.data.slice(-25)];
  }
  
  console.log(`📊 Dataset: ${totalRows} rows → Sending ${sampledData.length} sample rows to Gemini`);
  
  // Calculate statistics from full dataset
  const statistics = calculateStatistics(datasetInfo.data, datasetInfo.columns);
  
  // Prepare context for Gemini
  const context = buildGeminiPrompt(userQuery, datasetInfo, sampledData, statistics, totalRows);
  
  try {
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: context
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const aiResponse = result.candidates[0].content.parts[0].text;
    
    // Parse the response to detect visualization requests
    const shouldNavigateToVisualBuilder = detectVisualizationRequest(userQuery);
    
    return {
      response: aiResponse,
      shouldNavigateToVisualBuilder
    };
    
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw error;
  }
}

/**
 * Calculate comprehensive statistics from the full dataset
 */
function calculateStatistics(data: any[], columns: DataColumn[]): any {
  const stats: any = {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns: [],
    stringColumns: [],
    dateColumns: []
  };
  
  columns.forEach(col => {
    if (col.type === 'number') {
      const values = data.map(row => Number(row[col.name])).filter(v => !isNaN(v) && v !== null);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const sorted = [...values].sort((a, b) => a - b);
        const median = values.length % 2 === 0 
          ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2 
          : sorted[Math.floor(values.length / 2)];
        
        stats.numericColumns.push({
          name: col.name,
          count: values.length,
          nullCount: data.length - values.length,
          nullPercentage: ((data.length - values.length) / data.length * 100).toFixed(2),
          min,
          max,
          average: avg,
          median,
          sum,
          range: max - min
        });
      }
    } else if (col.type === 'string') {
      const values = data.map(row => row[col.name]).filter(v => v !== null && v !== '' && v !== undefined);
      const unique = Array.from(new Set(values));
      const frequencyMap = values.reduce((acc: any, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      const topValues = Object.entries(frequencyMap)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5);
      
      stats.stringColumns.push({
        name: col.name,
        count: values.length,
        nullCount: data.length - values.length,
        nullPercentage: ((data.length - values.length) / data.length * 100).toFixed(2),
        uniqueValues: unique.length,
        topValues: topValues.map((v: any) => ({ value: v[0], count: v[1], percentage: (v[1] / data.length * 100).toFixed(2) + '%' }))
      });
    } else if (col.type === 'date') {
      const values = data.map(row => new Date(row[col.name])).filter(v => !isNaN(v.getTime()));
      if (values.length > 0) {
        const timestamps = values.map(d => d.getTime());
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));
        
        stats.dateColumns.push({
          name: col.name,
          count: values.length,
          nullCount: data.length - values.length,
          earliestDate: minDate.toISOString().split('T')[0],
          latestDate: maxDate.toISOString().split('T')[0],
          dateRange: Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + ' days'
        });
      }
    }
  });
  
  return stats;
}

/**
 * Build comprehensive prompt for Gemini
 */
function buildGeminiPrompt(
  userQuery: string,
  datasetInfo: DatasetInfo,
  sampledData: any[],
  statistics: any,
  totalRows: number
): string {
  return `You are an expert data analyst assistant helping users understand their data and create insights.

**User's Question:** "${userQuery}"

**Dataset Information:**
- Dataset Name: ${datasetInfo.name}
- Total Rows: ${totalRows.toLocaleString()}
- Total Columns: ${datasetInfo.columns.length}
- Sample Size Provided: ${sampledData.length} rows (representative sample)

**Column Schema:**
${datasetInfo.columns.map(col => `- ${col.name} (${col.type})`).join('\n')}

**Statistics from FULL Dataset (${totalRows} rows):**

${statistics.numericColumns.length > 0 ? `
**Numeric Columns:**
${statistics.numericColumns.map((col: any) => `
  ${col.name}:
    • Count: ${col.count.toLocaleString()} | Nulls: ${col.nullCount} (${col.nullPercentage}%)
    • Min: ${col.min.toLocaleString()} | Max: ${col.max.toLocaleString()} | Range: ${col.range.toLocaleString()}
    • Average: ${col.average.toFixed(2)} | Median: ${col.median.toFixed(2)}
    • Sum: ${col.sum.toLocaleString()}
`).join('\n')}` : ''}

${statistics.stringColumns.length > 0 ? `
**Categorical/String Columns:**
${statistics.stringColumns.map((col: any) => `
  ${col.name}:
    • Count: ${col.count.toLocaleString()} | Nulls: ${col.nullCount} (${col.nullPercentage}%)
    • Unique Values: ${col.uniqueValues}
    • Top Values: ${col.topValues.map((v: any) => `${v.value} (${v.count}, ${v.percentage})`).join(', ')}
`).join('\n')}` : ''}

${statistics.dateColumns.length > 0 ? `
**Date Columns:**
${statistics.dateColumns.map((col: any) => `
  ${col.name}:
    • Count: ${col.count.toLocaleString()} | Nulls: ${col.nullCount}
    • Range: ${col.earliestDate} to ${col.latestDate} (${col.dateRange})
`).join('\n')}` : ''}

**Sample Data (for context):**
${JSON.stringify(sampledData.slice(0, 10), null, 2)}

**Instructions:**
1. Answer the user's question based on the statistics and sample data provided
2. Provide specific insights with actual numbers from the statistics
3. If they ask for visualizations, recommend appropriate chart types based on the column types
4. Format your response in a clear, professional manner with line breaks (\\n) and bold text (**text**)
5. Keep responses concise but informative
6. If creating visualizations, suggest which columns to use and why

**Important Notes:**
- All statistics are calculated from the COMPLETE dataset of ${totalRows} rows
- The sample data is just for context to understand the structure
- Be specific and cite actual numbers from the statistics
- Format your response to be easily readable

Please provide a helpful, data-driven response:`
}

/**
 * Detect if user wants to create a visualization
 */
function detectVisualizationRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const visualKeywords = [
    'visual', 'chart', 'graph', 'plot', 
    'create', 'build', 'make', 'draw',
    'pie', 'bar', 'line', 'scatter', 'histogram',
    'show me', 'display'
  ];
  
  return visualKeywords.some(keyword => lowerQuery.includes(keyword));
}
