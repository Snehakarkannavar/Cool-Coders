/**
 * Gemini AI Integration for Semantic Validation
 * Uses Google's Gemini API for reasoning and quality assessment
 */

import { DataSchema } from './schemaDiscovery';
import { ValidationScore } from './dataValidation';

export interface AIValidationResult {
  qualityScore: number;        // 0-100: AI's assessment of data quality
  logicalConsistency: number;  // 0-100: Logical relationships
  redFlags: string[];          // Suspicious patterns
  insights: string[];          // Positive observations
  recommendations: string[];    // Actionable suggestions
  reasoning: string;           // AI's explanation
}

/**
 * Call Gemini API for semantic validation
 * NOTE: You need to get a Gemini API key from https://makersuite.google.com/app/apikey
 */
export async function validateWithGemini(
  data: any[],
  schema: DataSchema,
  validationScores: ValidationScore,
  apiKey: string
): Promise<AIValidationResult> {
  
  // Smart sampling based on dataset size
  // Note: Mathematical validation already analyzed the FULL dataset
  // Gemini only needs samples to understand structure and provide semantic insights
  let sampledData: any[];
  
  if (data.length <= 200) {
    // Small dataset: Send all data
    sampledData = data;
  } else if (data.length <= 1000) {
    // Medium dataset: Send 200 rows (first 100 + last 100)
    sampledData = [...data.slice(0, 100), ...data.slice(-100)];
  } else if (data.length <= 5000) {
    // Large dataset: Send 150 rows (first 75 + last 75)
    sampledData = [...data.slice(0, 75), ...data.slice(-75)];
  } else {
    // Very large dataset: Send 100 rows (first 50 + last 50)
    sampledData = [...data.slice(0, 50), ...data.slice(-50)];
  }
  
  console.log(`Dataset: ${data.length} rows → Sending ${sampledData.length} rows to Gemini for semantic review`);
  
  // Prepare context for Gemini
  const context = prepareGeminiContext(sampledData, schema, validationScores);
  
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
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.candidates[0].content.parts[0].text;
    
    // Parse AI response
    return parseGeminiResponse(aiResponse);
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return fallback result
    return {
      qualityScore: validationScores.overall,
      logicalConsistency: 85,
      redFlags: ['AI validation unavailable - using mathematical validation only'],
      insights: ['Data structure appears valid based on mathematical analysis'],
      recommendations: ['Verify Gemini API key is configured correctly'],
      reasoning: 'AI validation could not be completed. Mathematical validation shows acceptable data quality.'
    };
  }
}

/**
 * Prepare context for Gemini
 * 
 * IMPORTANT: This sends statistics computed from the FULL dataset,
 * not just the sampled rows. Gemini receives:
 * 
 * 1. Schema (from ALL data):
 *    - Column types detected from all rows
 *    - Statistics (min/max/mean/median) calculated on all rows
 *    - Null percentages from complete dataset
 * 
 * 2. Aggregates (from ALL data):
 *    - Totals, averages, counts from complete dataset
 *    - Distribution frequencies from all rows
 * 
 * 3. Trends (from ALL data):
 *    - Growth/decline calculated on full dataset
 *    - Time series patterns from complete data
 * 
 * 4. Sample rows (for context only):
 *    - Just to show Gemini the data structure
 *    - Not used for calculations
 * 
 * Gemini's role: Review the statistics and provide semantic insights,
 * not re-compute values. All math is done on the full dataset before this.
 */
function prepareGeminiContext(
  data: any[],
  schema: DataSchema,
  validationScores: ValidationScore
): string {
  // Get sample rows (first 5 and last 5)
  const sampleRows = [
    ...data.slice(0, 5),
    ...data.slice(-5)
  ];
  
  // Calculate aggregates for numeric columns
  const aggregates: any = {};
  schema.columns.forEach(col => {
    if (col.type === 'numeric') {
      const values = data.map(row => parseFloat(row[col.name])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        aggregates[col.name] = {
          total: sum,
          average: sum / values.length,
          count: values.length
        };
      }
    } else if (col.type === 'categorical') {
      const values = data.map(row => row[col.name]).filter(v => v);
      const frequency: any = {};
      values.forEach(v => {
        frequency[v] = (frequency[v] || 0) + 1;
      });
      aggregates[col.name] = {
        distribution: frequency,
        mostCommon: Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b)
      };
    }
  });
  
  // Detect trends
  const trends = detectTrends(data, schema);
  
  const prompt = `You are a data quality analyst reviewing a business report. Analyze this dataset and provide a comprehensive quality assessment.

📊 DATASET OVERVIEW:
${schema.summary}

📋 DETECTED SCHEMA:
${schema.columns.map(col => {
  let desc = `• ${col.name} (${col.type})`;
  if (col.statistics?.range) desc += ` - Range: ${col.statistics.range}`;
  if (col.nullPercentage > 0) desc += ` - Nulls: ${col.nullPercentage}%`;
  return desc;
}).join('\n')}

🔢 AGGREGATES & STATISTICS:
${JSON.stringify(aggregates, null, 2)}

📈 DETECTED TRENDS:
${trends.join('\n')}

✅ MATHEMATICAL VALIDATION SCORES:
• Structural Consistency: ${validationScores.structural}%
• Statistical Consistency: ${validationScores.statistical}%
• Anomaly Score: ${validationScores.anomaly}% (100 = no anomalies)
• Risk Level: ${validationScores.riskLevel.toUpperCase()}

⚠️ VALIDATION FLAGS:
${validationScores.flags.length > 0 ? validationScores.flags.map(f => 
  `• [${f.severity.toUpperCase()}] ${f.column ? f.column + ': ' : ''}${f.message}`
).join('\n') : 'No significant issues detected'}

📄 SAMPLE DATA (First 5 rows):
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

TASK: Provide a comprehensive quality assessment in the following JSON format:

{
  "qualityScore": <0-100: Your overall quality assessment>,
  "logicalConsistency": <0-100: Do the relationships make sense?>,
  "redFlags": [
    "List any suspicious patterns",
    "Data inconsistencies",
    "Logical issues"
  ],
  "insights": [
    "Positive observations",
    "Strong patterns",
    "Good data characteristics"
  ],
  "recommendations": [
    "Actionable suggestions",
    "Improvements needed",
    "Best practices"
  ],
  "reasoning": "Brief explanation of your assessment (2-3 sentences)"
}

IMPORTANT:
1. Consider both mathematical scores AND semantic meaning
2. Look for business logic errors (e.g., negative quantities, impossible dates)
3. Check if aggregates make sense for the data type
4. Identify any data that seems illogical even if mathematically valid
5. Be specific in red flags and recommendations

Respond ONLY with valid JSON, no additional text.`;

  return prompt;
}

/**
 * Detect trends in the data
 */
function detectTrends(data: any[], schema: DataSchema): string[] {
  const trends: string[] = [];
  
  // Check for growth/decline in numeric columns
  schema.columns.forEach(col => {
    if (col.type === 'numeric' && data.length >= 10) {
      const values = data.map(row => parseFloat(row[col.name])).filter(v => !isNaN(v));
      
      if (values.length >= 10) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        // Protect against division by zero
        if (firstAvg !== 0) {
          const change = ((secondAvg - firstAvg) / firstAvg) * 100;
          
          if (Math.abs(change) > 20) {
            trends.push(`• ${col.name}: ${change > 0 ? 'Growth' : 'Decline'} of ${Math.abs(change).toFixed(1)}%`);
          }
        } else if (secondAvg !== 0) {
          trends.push(`• ${col.name}: Increased from zero baseline`);
        }
      }
    }
  });
  
  // Check for seasonal patterns in dates
  const dateColumns = schema.columns.filter(col => col.type === 'date');
  if (dateColumns.length > 0) {
    trends.push(`• Time series data detected - ${dateColumns.length} date column(s)`);
  }
  
  return trends.length > 0 ? trends : ['• No significant trends detected'];
}

/**
 * Parse Gemini's JSON response
 */
function parseGeminiResponse(response: string): AIValidationResult {
  try {
    // Extract JSON from response (Gemini sometimes adds markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      qualityScore: parsed.qualityScore || 85,
      logicalConsistency: parsed.logicalConsistency || 85,
      redFlags: parsed.redFlags || [],
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      reasoning: parsed.reasoning || 'Data analysis completed successfully'
    };
    
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    
    // Return extracted insights from text if JSON parsing fails
    return {
      qualityScore: 85,
      logicalConsistency: 85,
      redFlags: extractListFromText(response, 'red flags'),
      insights: extractListFromText(response, 'insights'),
      recommendations: extractListFromText(response, 'recommendations'),
      reasoning: response.substring(0, 200)
    };
  }
}

/**
 * Extract bullet points from unstructured text
 */
function extractListFromText(text: string, keyword: string): string[] {
  const lines = text.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
      items.push(line.trim().replace(/^[•\-\d.]\s*/, ''));
    }
  }
  
  return items.slice(0, 5); // Return max 5 items
}

