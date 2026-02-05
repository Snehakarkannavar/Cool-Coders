import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Brain,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationScore } from "@/lib/dataValidation";
import type { AIValidationResult } from "@/lib/geminiValidation";

interface ValidationScoresProps {
  scores: ValidationScore;
  aiValidation?: AIValidationResult;
}

export function ValidationScoresCard({ scores, aiValidation }: ValidationScoresProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Data Confidence Score</h3>
            <p className="text-sm text-slate-500">Hybrid Mathematical + AI Validation</p>
          </div>
        </div>
        <Badge className={cn("text-sm px-4 py-1.5 border-2", getRiskColor(scores.riskLevel))}>
          Risk: {scores.riskLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Overall Score */}
      <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Overall Confidence</p>
            <p className="text-4xl font-bold text-blue-600">{scores.overall}%</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white border-4 border-blue-400 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${scores.overall}%` }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Structural */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {getScoreIcon(scores.structural)}
          </div>
          <p className={cn("text-3xl font-bold", getScoreColor(scores.structural))}>
            {scores.structural}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Structural</p>
        </div>

        {/* Statistical */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {getScoreIcon(scores.statistical)}
          </div>
          <p className={cn("text-3xl font-bold", getScoreColor(scores.statistical))}>
            {scores.statistical}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Statistical</p>
        </div>

        {/* Anomaly */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {getScoreIcon(scores.anomaly)}
          </div>
          <p className={cn("text-3xl font-bold", getScoreColor(scores.anomaly))}>
            {scores.anomaly}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Anomaly</p>
        </div>
      </div>

      {/* AI Validation (if available) */}
      {aiValidation && (
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-slate-900">AI Semantic Validation</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">Quality Score</p>
              <p className={cn("text-2xl font-bold", getScoreColor(aiValidation.qualityScore))}>
                {aiValidation.qualityScore}%
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">Logical Consistency</p>
              <p className={cn("text-2xl font-bold", getScoreColor(aiValidation.logicalConsistency))}>
                {aiValidation.logicalConsistency}%
              </p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm font-medium text-purple-900 mb-2">AI Reasoning</p>
            <p className="text-sm text-slate-700 leading-relaxed">{aiValidation.reasoning}</p>
          </div>
        </div>
      )}

      {/* Validation Flags */}
      {scores.flags.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Validation Flags ({scores.flags.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {scores.flags.slice(0, 5).map((flag, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-3 rounded-lg border text-sm",
                  flag.severity === 'critical' 
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : flag.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="font-medium uppercase text-xs">
                      {flag.severity}
                    </span>
                    {flag.column && (
                      <span className="text-xs ml-2 opacity-75">
                        • {flag.column}
                      </span>
                    )}
                    <p className="mt-1">{flag.message}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    -{flag.impact.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights (if available) */}
      {aiValidation && aiValidation.insights.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Positive Insights
          </h4>
          <div className="space-y-2">
            {aiValidation.insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="flex gap-2 text-sm text-slate-700">
                <span className="text-green-600">✓</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Red Flags (if available) */}
      {aiValidation && aiValidation.redFlags.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            Red Flags
          </h4>
          <div className="space-y-2">
            {aiValidation.redFlags.map((flag, idx) => (
              <div key={idx} className="flex gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                <span className="text-red-600">⚠</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
