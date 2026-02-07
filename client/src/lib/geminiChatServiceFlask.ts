/**
 * Gemini AI Chat Service - Flask Backend Integration
 * Routes requests through Flask backend for better security and performance
 */

export interface DataColumn {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean';
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
 * Flask Backend URL - configure based on environment
 */
const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5001';

/**
 * Send user query and dataset to Gemini via Flask backend
 * This provides better security (API key on server) and performance (efficient data handling)
 */
export async function askGemini(
  userQuery: string,
  datasetInfo: DatasetInfo,
  apiKey: string
): Promise<ChatGeminiResponse> {
  
  console.log(`📊 Preparing request for dataset: ${datasetInfo.data.length} rows, ${datasetInfo.columns.length} columns`);
  
  try {
    // Call Flask backend instead of Gemini directly
    console.log(`📤 Sending request to Flask backend: ${FLASK_API_URL}/api/chat`);
    
    const response = await fetch(`${FLASK_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: userQuery,
        name: datasetInfo.name,
        data: datasetInfo.data,
        columns: datasetInfo.columns,
        api_key: apiKey
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Flask API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    console.log('✅ Flask backend response received successfully');
    
    if (!result.response) {
      throw new Error('Invalid response from Flask backend: No response text returned');
    }
    
    console.log('📝 AI Response length:', result.response.length, 'characters');
    
    return {
      response: result.response,
      shouldNavigateToVisualBuilder: result.shouldNavigateToVisualBuilder || false
    };
    
  } catch (error: any) {
    console.error('❌ Flask backend error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('fetch')) {
      throw new Error(
        `Cannot connect to Flask backend at ${FLASK_API_URL}. ` +
        `Please ensure the Flask server is running (python server/chatbot_api.py)`
      );
    }
    
    throw error;
  }
}

/**
 * Check if Flask backend is running and healthy
 */
export async function checkFlaskBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${FLASK_API_URL}/api/health`, {
      method: 'GET',
      timeout: 5000
    } as any);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Flask backend is healthy:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️ Flask backend health check failed:', error);
    return false;
  }
}

/**
 * Detect if user wants to create a visualization
 */
function detectVisualizationRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  const visualizationKeywords = [
    'create chart', 'create graph', 'make chart', 'build chart', 'draw chart',
    'show chart', 'create visual', 'make graph', 'visualize', 'plot', 'chart',
    'pie chart', 'bar chart', 'line chart', 'scatter plot', 'histogram'
  ];
  
  return visualizationKeywords.some(keyword => lowerQuery.includes(keyword));
}
