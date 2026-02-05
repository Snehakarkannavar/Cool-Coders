import { z } from 'zod';

export const api = {
  analyze: {
    method: 'POST' as const,
    path: '/api/analyze',
    input: z.object({
      question: z.string(),
      schema: z.record(z.any()), // Simple key-value of column name -> type/sample
      history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
      })).optional()
    }),
    responses: {
      200: z.object({
        explanation: z.string(),
        visualization: z.object({
          type: z.enum(['bar', 'line', 'pie', 'table', 'scatter', 'area']),
          config: z.any(),
          title: z.string().optional(),
          description: z.string().optional()
        }).optional(),
        query: z.object({
          columns_needed: z.array(z.string()),
          aggregation_type: z.string().optional(),
          filter_conditions: z.any().optional(),
          explanation: z.string().optional()
        }).optional()
      }),
      500: z.object({ message: z.string() })
    }
  }
};
