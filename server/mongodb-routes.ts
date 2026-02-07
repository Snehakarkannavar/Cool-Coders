import { Express, Request, Response } from 'express';
import { DataSource } from './models/DataSource';
import { Report } from './models/Report';
import { User } from './models/User';

export function registerMongoDBRoutes(app: Express) {
  
  // ==================== DATA SOURCES ====================
  
  // Create/Upload Data Source
  app.post('/api/data-sources', async (req: Request, res: Response) => {
    try {
      const { name, type, size, records, data, metadata } = req.body;
      
      const dataSource = new DataSource({
        userId: '1', // TODO: Get from authentication session
        name,
        type,
        size,
        records,
        data,
        metadata,
      });
      
      await dataSource.save();
      
      res.status(201).json({
        success: true,
        data: dataSource,
      });
    } catch (error: any) {
      console.error('Error creating data source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save data source',
        message: error.message,
      });
    }
  });
  
  // Get All Data Sources
  app.get('/api/data-sources', async (req: Request, res: Response) => {
    try {
      const userId = '1'; // TODO: Get from authentication
      
      const dataSources = await DataSource.find({ userId })
        .sort({ uploadedAt: -1 })
        .select('-data'); // Exclude large data field from list
      
      res.json({
        success: true,
        data: dataSources,
        count: dataSources.length,
      });
    } catch (error: any) {
      console.error('Error fetching data sources:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data sources',
        message: error.message,
      });
    }
  });
  
  // Get Single Data Source (with data)
  app.get('/api/data-sources/:id', async (req: Request, res: Response) => {
    try {
      const dataSource = await DataSource.findById(req.params.id);
      
      if (!dataSource) {
        return res.status(404).json({
          success: false,
          error: 'Data source not found',
        });
      }
      
      res.json({
        success: true,
        data: dataSource,
      });
    } catch (error: any) {
      console.error('Error fetching data source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data source',
        message: error.message,
      });
    }
  });
  
  // Delete Data Source
  app.delete('/api/data-sources/:id', async (req: Request, res: Response) => {
    try {
      const result = await DataSource.findByIdAndDelete(req.params.id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Data source not found',
        });
      }
      
      res.json({
        success: true,
        message: 'Data source deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting data source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete data source',
        message: error.message,
      });
    }
  });
  
  // ==================== REPORTS ====================
  
  // Create/Save Report
  app.post('/api/reports', async (req: Request, res: Response) => {
    try {
      const { title, templateType, format, fileName, content, validation, size } = req.body;
      
      const report = new Report({
        userId: '1', // TODO: Get from authentication
        title,
        templateType,
        format,
        fileName,
        content,
        validation,
        size,
      });
      
      await report.save();
      
      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save report',
        message: error.message,
      });
    }
  });
  
  // Get All Reports
  app.get('/api/reports', async (req: Request, res: Response) => {
    try {
      const userId = '1'; // TODO: Get from authentication
      const { limit = 50, offset = 0 } = req.query;
      
      const reports = await Report.find({ userId })
        .sort({ generatedAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .select('-content'); // Exclude large content field
      
      const total = await Report.countDocuments({ userId });
      
      res.json({
        success: true,
        data: reports,
        count: reports.length,
        total,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + reports.length < total,
        }
      });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reports',
        message: error.message,
      });
    }
  });
  
  // Get Single Report (with full content)
  app.get('/api/reports/:id', async (req: Request, res: Response) => {
    try {
      const report = await Report.findById(req.params.id);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report',
        message: error.message,
      });
    }
  });
  
  // Delete Report
  app.delete('/api/reports/:id', async (req: Request, res: Response) => {
    try {
      const result = await Report.findByIdAndDelete(req.params.id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }
      
      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete report',
        message: error.message,
      });
    }
  });
  
  // ==================== STATISTICS ====================
  
  // Get Dashboard Statistics
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const userId = '1'; // TODO: Get from authentication
      
      const [
        totalDataSources,
        totalReports,
        avgAccuracy,
        recentReports,
      ] = await Promise.all([
        DataSource.countDocuments({ userId }),
        Report.countDocuments({ userId }),
        Report.aggregate([
          { $match: { userId } },
          { $group: {
            _id: null,
            avgOverall: { $avg: '$validation.scores.overall' },
            avgStructural: { $avg: '$validation.scores.structural' },
            avgStatistical: { $avg: '$validation.scores.statistical' },
            avgAnomaly: { $avg: '$validation.scores.anomaly' },
          }}
        ]),
        Report.find({ userId })
          .sort({ generatedAt: -1 })
          .limit(5)
          .select('title format validation.scores.overall generatedAt'),
      ]);
      
      res.json({
        success: true,
        data: {
          totalDataSources,
          totalReports,
          averageAccuracy: avgAccuracy[0] || {
            avgOverall: 0,
            avgStructural: 0,
            avgStatistical: 0,
            avgAnomaly: 0,
          },
          recentReports,
        }
      });
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: error.message,
      });
    }
  });
  
  // ==================== USERS ====================
  
  // Create or Get User
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      let user = await User.findOne({ email });
      
      if (!user) {
        user = new User({ email, name });
        await user.save();
      } else {
        user.lastLoginAt = new Date();
        await user.save();
      }
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Error creating/updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process user',
        message: error.message,
      });
    }
  });
  
  console.log('[MongoDB] API routes registered');
}
