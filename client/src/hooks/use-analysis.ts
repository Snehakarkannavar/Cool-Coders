import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type AnalyzeInput = z.infer<typeof api.analyze.input>;
type AnalyzeResponse = z.infer<typeof api.analyze.responses[200]>;

export function useAnalyzeData() {
  return useMutation({
    mutationFn: async (input: AnalyzeInput) => {
      const res = await fetch(api.analyze.path, {
        method: api.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to analyze data");
      }
      
      const data = await res.json();
      return api.analyze.responses[200].parse(data);
    }
  });
}
