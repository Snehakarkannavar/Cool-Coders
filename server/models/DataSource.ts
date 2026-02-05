import mongoose, { Schema, Document } from 'mongoose';

// Data Source Interface
export interface IDataSource extends Document {
  userId: string;
  name: string;
  type: 'csv' | 'excel' | 'sql' | 'mongodb';
  size?: string;
  records?: number;
  data?: any[];
  metadata?: {
    schema?: any;
    statistics?: any;
    columns?: any[];
  };
  uploadedAt: Date;
}

// Data Source Schema
const DataSourceSchema = new Schema<IDataSource>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['csv', 'excel', 'sql', 'mongodb'],
    required: true,
  },
  size: String,
  records: Number,
  data: [Schema.Types.Mixed],
  metadata: {
    schema: Schema.Types.Mixed,
    statistics: Schema.Types.Mixed,
    columns: [Schema.Types.Mixed],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
DataSourceSchema.index({ userId: 1, uploadedAt: -1 });
DataSourceSchema.index({ name: 1 });

export const DataSource = mongoose.model<IDataSource>('DataSource', DataSourceSchema);
