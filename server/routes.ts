import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register chat routes from integration
  registerChatRoutes(app);

  app.post(api.analyze.path, async (req, res) => {
    try {
      const input = api.analyze.input.parse(req.body);
      const { question, schema, history } = input;

      const systemPrompt = `
You are a data analyst assistant. Your goal is to help users analyze their data by providing:
1. A clear explanation of the analysis.
2. A plan for visualization (chart type and config).
3. A structured query plan (how to filter/group/aggregate the data client-side).

Input Data Schema:
${JSON.stringify(schema, null, 2)}

User Question: "${question}"

Respond with a JSON object (and ONLY a JSON object) with this structure:
{
  "explanation": "Brief explanation of what this analysis shows",
  "visualization": {
    "type": "bar" | "line" | "pie" | "table",
    "config": { ...recharts compatible props or generic config... },
    "title": "Chart Title",
    "description": "Chart Description"
  },
  "query": {
    "columns_needed": ["col1", "col2"],
    "aggregation_type": "sum" | "count" | "avg" | "none",
    "filter_conditions": { ... },
    "group_by": "column_name"
  }
}

For "bar" charts, usually need a categorical X axis and numerical Y axis.
For "line" charts, usually need a time/sequence X axis.
For "pie", need categorical key and numerical value.
      `;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...(history || []).map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: question }
        ]
      });

      const contentBlock = response.content[0];
      if (contentBlock.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Try to parse JSON from the response text
      // Claude might wrap it in ```json ... ```
      let jsonStr = contentBlock.text;
      const jsonMatch = jsonStr.match(/```json\n([\s\S]*?)\n```/) || jsonStr.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const result = JSON.parse(jsonStr);
      res.json(result);

    } catch (err) {
      console.error('Analysis error:', err);
      res.status(500).json({ message: 'Failed to analyze data' });
    }
  });

  return httpServer;
}
