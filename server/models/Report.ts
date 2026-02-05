import mongoose, { Schema, Document } from 'mongoose';

// Report Interface
export interface IReport extends Document {
  userId: string;
  title: string;
  templateType?: string;
  format: 'pdf' | 'docx' | 'pptx';
  fileName?: string;
  content?: any;
  validation?: {
    scores: {
      structural: number;
      statistical: number;
      anomaly: number;
      overall: number;
      riskLevel: string;
    };
    aiValidation?: {
      qualityScore: number;
      logicalConsistency: number;
      redFlags: string[];
      insights: string[];
      recommendations: string[];
      reasoning?: string;
    };
    flags?: Array<{
      severity: string;
      column?: string;
      message: string;
    }>;
  };
  size?: string;
  generatedAt: Date;
}

// Report Schema
const ReportSchema = new Schema<IReport>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  templateType: String,
  format: {
    type: String,
    enum: ['pdf', 'docx', 'pptx'],
    required: true,
  },
  fileName: String,
  content: Schema.Types.Mixed,
  validation: {
    scores: {
      structural: Number,
      statistical: Number,
      anomaly: Number,
      overall: Number,
      riskLevel: String,
    },
    aiValidation: {
      qualityScore: Number,
      logicalConsistency: Number,
      redFlags: [String],
      insights: [String],
      recommendations: [String],
      reasoning: String,
    },
    flags: [{
      severity: String,
      column: String,
      message: String,
    }],
  },
  size: String,
  generatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
ReportSchema.index({ userId: 1, generatedAt: -1 });
ReportSchema.index({ title: 1 });
ReportSchema.index({ 'validation.scores.overall': -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
