/**
 * Gemini AI Integration for Chat Assistant
 * Uses Google's Gemini API to analyze data and answer questions
 */

export interface DataColumn {
  name: string;
  type: 'number' | 'string' | 'date';
}

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
  
  console.log('📊 Statistics calculated:', {
    numericCols: statistics.numericColumns.length,
    stringCols: statistics.stringColumns.length,
    dateCols: statistics.dateColumns.length
  });
  
  // Prepare context for Gemini with enhanced prompt
  const context = buildGeminiPrompt(userQuery, datasetInfo, sampledData, statistics, totalRows);
  
  try {
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    
    console.log('✅ Gemini API response received successfully');
    
    if (!result.candidates || !result.candidates[0]) {
      throw new Error('Invalid response from Gemini API: No candidates returned');
    }
    
    const aiResponse = result.candidates[0].content.parts[0].text;
    
    console.log('📝 AI Response length:', aiResponse.length, 'characters');
    
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
 * Calculate comprehensive statistics from the full dataset with robust error handling
 */
function calculateStatistics(data: any[], columns: DataColumn[]): any {
  const stats: any = {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns: [],
    stringColumns: [],
    dateColumns: []
  };
  
  console.log(`📊 Calculating statistics for ${data.length} rows, ${columns.length} columns...`);
  
  columns.forEach(col => {
    try {
      if (col.type === 'number') {
        const values = data.map(row => Number(row[col.name])).filter(v => !isNaN(v) && v !== null && v !== undefined && isFinite(v));
        
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
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2)),
            average: Number(avg.toFixed(2)),
            median: Number(median.toFixed(2)),
            sum: Number(sum.toFixed(2)),
            range: Number((max - min).toFixed(2))
          });
          
          console.log(`  ✓ ${col.name}: ${values.length} values, avg=${avg.toFixed(2)}, range=${min.toFixed(2)}-${max.toFixed(2)}`);
        }
      } else if (col.type === 'string') {
        const values = data.map(row => row[col.name]).filter(v => v !== null && v !== '' && v !== undefined);
        
        if (values.length > 0) {
          const unique = Array.from(new Set(values));
          const frequencyMap = values.reduce((acc: any, val) => {
            const key = String(val).trim(); // Normalize the value
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          
          const sortedFrequencies = Object.entries(frequencyMap)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5);
          
          stats.stringColumns.push({
            name: col.name,
            count: values.length,
            nullCount: data.length - values.length,
            nullPercentage: ((data.length - values.length) / data.length * 100).toFixed(2),
            uniqueValues: unique.length,
            topValues: sortedFrequencies.map(([value, count]: any) => ({
              value: String(value).substring(0, 50), // Limit length for display
              count,
              percentage: ((count / values.length) * 100).toFixed(1) + '%'
            }))
          });
          
          console.log(`  ✓ ${col.name}: ${values.length} values, ${unique.length} unique, top="${sortedFrequencies[0]?.[0]}"`);
          console.log(`  ✓ ${col.name}: ${values.length} values, ${unique.length} unique, top="${sortedFrequencies[0]?.[0]}"`);
        }
      } else if (col.type === 'date') {
        const values = data.map(row => new Date(row[col.name])).filter(v => !isNaN(v.getTime()));
        
        if (values.length > 0) {
          const timestamps = values.map(d => d.getTime());
          const minDate = new Date(Math.min(...timestamps));
          const maxDate = new Date(Math.max(...timestamps));
          const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
          
          stats.dateColumns.push({
            name: col.name,
            count: values.length,
            nullCount: data.length - values.length,
            earliestDate: minDate.toISOString().split('T')[0],
            latestDate: maxDate.toISOString().split('T')[0],
            dateRange: `${daysDiff} days`
          });
          
          console.log(`  ✓ ${col.name}: ${values.length} dates, range=${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error calculating statistics for column "${col.name}":`, error);
      // Continue with next column
    }
  });
  
  console.log(`✅ Statistics complete: ${stats.numericColumns.length} numeric, ${stats.stringColumns.length} string, ${stats.dateColumns.length} date columns`);
  
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
  // Determine query intent for better response
  const queryLower = userQuery.toLowerCase();
  const isStatsQuery = queryLower.includes('statistic') || queryLower.includes('summary') || queryLower.includes('overview');
  const isInsightsQuery = queryLower.includes('insight') || queryLower.includes('pattern') || queryLower.includes('trend') || queryLower.includes('find');
  const isVisualizationQuery = queryLower.includes('visual') || queryLower.includes('chart') || queryLower.includes('graph');
  const isSpecificQuery = queryLower.includes('what') || queryLower.includes('how many') || queryLower.includes('which') || queryLower.includes('show');

  return `You are an expert data analyst assistant with deep knowledge of statistical analysis and business intelligence. Your role is to analyze data accurately and provide actionable insights.

**CRITICAL INSTRUCTIONS:**
1. Base your answer EXCLUSIVELY on the provided statistics and sample data below
2. Use EXACT numbers from the statistics - do not estimate or guess
3. Be specific and concrete - cite actual data points
4. Format your response clearly with line breaks (\\n) and bold headers (**header**)
5. If asked about specific columns or values, reference them directly from the data
${isStatsQuery ? '6. Focus on comprehensive statistical analysis with all key metrics' : ''}
${isInsightsQuery ? '6. Focus on discovering meaningful patterns, correlations, and business insights' : ''}
${isVisualizationQuery ? '6. Recommend specific chart types and explain which columns to use for best visualization' : ''}
${isSpecificQuery ? '6. Answer the specific question directly with precise data from the statistics' : ''}

**User's Question:** "${userQuery}"

**Dataset Information:**
- Dataset Name: ${datasetInfo.name}
- Total Rows: ${totalRows.toLocaleString()} (COMPLETE dataset)
- Total Columns: ${datasetInfo.columns.length}
- Sample Data Provided: ${sampledData.length} rows for context

**Column Schema:**
${datasetInfo.columns.map(col => `- ${col.name} (${col.type})`).join('\n')}

**COMPLETE Statistics from ALL ${totalRows} rows:**

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

**Sample Data (first 10 rows for structure reference):**
${JSON.stringify(sampledData.slice(0, 10), null, 2)}

**YOUR RESPONSE REQUIREMENTS:**

1. **Accuracy First**: Use only the statistics provided above. All statistics are from the COMPLETE ${totalRows}-row dataset.

2. **Formatting**: 
   - Use **Bold Headers** for sections
   - Use \\n for line breaks between sections
   - Use bullet points (•) for lists
   - Use ▸ for sub-items
   - Keep paragraphs short and scannable

3. **Content Structure**:
   ${isStatsQuery ? '- Start with key summary statistics\n   - Cover all numeric columns with Min/Max/Average/Median\n   - List categorical column distributions\n   - Highlight any data quality issues (nulls, outliers)' : ''}
   ${isInsightsQuery ? '- Identify 3-5 key insights from the data\n   - Look for correlations, patterns, or anomalies\n   - Explain business implications\n   - Suggest areas for deeper investigation' : ''}
   ${isVisualizationQuery ? '- Recommend 2-3 specific chart types\n   - Specify exact columns to use for X/Y axes\n   - Explain why each visualization fits the data\n   - Mention what insights each chart would reveal' : ''}
   ${isSpecificQuery ? '- Answer the specific question directly first\n   - Provide exact numbers and context\n   - Add relevant additional context if helpful\n   - Reference specific rows or values if applicable' : ''}

4. **Numbers & Citations**:
   - Always include actual values from statistics
   - Use .toLocaleString() format for large numbers
   - Include percentages where relevant
   - Reference column names exactly as they appear

5. **Tone**: Professional, insightful, and actionable. Write like a senior data analyst.

**EXAMPLE GOOD RESPONSE FORMAT:**

**📊 Key Statistics**
• Total records analyzed: [exact number]
• Date range: [if applicable]

**📈 Main Findings**
• Finding 1 with specific numbers
• Finding 2 with specific numbers

**💡 Insights**
• [Actionable insight based on data]

Now provide your data-driven response to: "${userQuery}"`
}

/**
 * Detect if user wants to create a visualization with enhanced pattern matching
 */
function detectVisualizationRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Direct visualization keywords
  const directKeywords = ['create chart', 'create graph', 'make chart', 'build chart', 'draw chart', 'show chart', 'create visual', 'make graph'];
  if (directKeywords.some(keyword => lowerQuery.includes(keyword))) {
    console.log('🎯 Visualization request detected (direct):', query);
    return true;
  }
  
  // Chart type keywords
  const chartTypes = ['pie chart', 'bar chart', 'line chart', 'scatter plot', 'histogram', 'area chart', 'bubble chart'];
  if (chartTypes.some(type => lowerQuery.includes(type))) {
    console.log('🎯 Visualization request detected (chart type):', query);
    return true;
  }
  
  // Visualization actions
  const visualActions = ['visualize', 'plot', 'chart'];
  if (visualActions.some(action => lowerQuery.includes(action))) {
    console.log('🎯 Visualization request detected (action):', query);
    return true;
  }
  
  return false;
}
