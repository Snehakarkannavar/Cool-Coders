import { useData } from '@/contexts/DataContext';

interface DataInsight {
  type: 'summary' | 'correlation' | 'trend' | 'anomaly';
  title: string;
  description: string;
  value?: string | number;
  confidence: number;
}

interface AnalysisRequest {
  query: string;
  dataSourceId?: string;
}

interface AnalysisResponse {
  insights: DataInsight[];
  suggestions: string[];
  chartRecommendations?: Array<{
    type: 'bar' | 'line' | 'pie' | 'scatter';
    title: string;
    description: string;
  }>;
}

export class DataAnalysisService {
  private static instance: DataAnalysisService;

  static getInstance(): DataAnalysisService {
    if (!this.instance) {
      this.instance = new DataAnalysisService();
    }
    return this.instance;
  }

  async analyzeData(request: AnalysisRequest, dataSources: any[], activeData: any[]): Promise<AnalysisResponse> {
    // Simulate AI analysis - in production, this would call Gemini API
    await new Promise(resolve => setTimeout(resolve, 1500));

    const query = request.query.toLowerCase();
    const data = activeData || [];
    
    // Basic data analysis based on query content
    let insights: DataInsight[] = [];
    let suggestions: string[] = [];
    let chartRecommendations: Array<{
      type: 'bar' | 'line' | 'pie' | 'scatter';
      title: string;
      description: string;
    }> = [];

    if (data.length === 0) {
      return {
        insights: [{
          type: 'summary',
          title: 'No Data Available',
          description: 'Please upload data or connect a data source to begin analysis.',
          confidence: 1.0
        }],
        suggestions: [
          'Upload a CSV file with your data',
          'Connect to a SQL database',
          'Connect to a MongoDB collection'
        ]
      };
    }

    // Analyze data structure
    const columns = Object.keys(data[0] || {});
    const numericColumns = columns.filter(col => 
      data.every(row => typeof row[col] === 'number' || !isNaN(Number(row[col])))
    );
    const dateColumns = columns.filter(col => 
      data.some(row => !isNaN(Date.parse(row[col])))
    );

    // Generate insights based on query type
    if (query.includes('trend') || query.includes('time') || query.includes('change')) {
      if (dateColumns.length > 0 && numericColumns.length > 0) {
        insights.push({
          type: 'trend',
          title: 'Time Series Analysis Available',
          description: `Found ${dateColumns.length} date column(s) and ${numericColumns.length} numeric column(s) suitable for trend analysis.`,
          confidence: 0.9
        });
        
        chartRecommendations.push({
          type: 'line' as const,
          title: 'Time Series Chart',
          description: `Track ${numericColumns[0]} over time using ${dateColumns[0]}`
        });
      }
    }

    if (query.includes('correlation') || query.includes('relationship')) {
      if (numericColumns.length >= 2) {
        insights.push({
          type: 'correlation',
          title: 'Correlation Analysis Possible',
          description: `Found ${numericColumns.length} numeric columns that can be analyzed for correlations.`,
          confidence: 0.85
        });

        chartRecommendations.push({
          type: 'scatter' as const,
          title: 'Correlation Plot',
          description: `Explore relationship between ${numericColumns[0]} and ${numericColumns[1]}`
        });
      }
    }

    if (query.includes('distribution') || query.includes('breakdown') || query.includes('category')) {
      const categoricalColumns = columns.filter(col => 
        !numericColumns.includes(col) && !dateColumns.includes(col)
      );
      
      if (categoricalColumns.length > 0) {
        insights.push({
          type: 'summary',
          title: 'Categorical Analysis Available',
          description: `Found ${categoricalColumns.length} categorical column(s) for distribution analysis.`,
          confidence: 0.8
        });

        chartRecommendations.push({
          type: 'pie' as const,
          title: 'Distribution Chart',
          description: `Show distribution of ${categoricalColumns[0]}`
        });
      }
    }

    // General data summary
    insights.push({
      type: 'summary',
      title: 'Dataset Overview',
      description: `Your dataset contains ${data.length} rows and ${columns.length} columns.`,
      value: `${data.length} records`,
      confidence: 1.0
    });

    // Generate context-aware suggestions
    suggestions = [
      'Create a visualization based on your data',
      'Generate a comprehensive report',
      'Export insights to Excel or PDF',
      'Set up automated data refresh',
      'Create a dashboard with key metrics'
    ];

    // Add specific suggestions based on data structure
    if (numericColumns.length > 0) {
      suggestions.push(`Analyze statistics for ${numericColumns.join(', ')}`);
    }
    
    if (dateColumns.length > 0) {
      suggestions.push(`Create time-based analysis using ${dateColumns[0]}`);
    }

    return {
      insights,
      suggestions,
      chartRecommendations
    };
  }

  generateNaturalResponse(insights: DataInsight[], query: string): string {
    if (insights.length === 0) {
      return "I don't have enough information to analyze your data. Please make sure you have data loaded.";
    }

    const mainInsight = insights.find(i => i.confidence > 0.8);
    
    if (mainInsight) {
      let response = `Based on your question about "${query}", here's what I found: ${mainInsight.description}`;
      
      if (insights.length > 1) {
        response += ` I've also identified ${insights.length - 1} additional insights that might be relevant.`;
      }
      
      response += " Would you like me to create a visualization or generate a detailed report based on these findings?";
      
      return response;
    }

    return `I've analyzed your data in relation to "${query}" and found ${insights.length} relevant insights. The data structure looks good for various types of analysis. What specific aspect would you like me to explore further?`;
  }
}

export const dataAnalysisService = DataAnalysisService.getInstance();