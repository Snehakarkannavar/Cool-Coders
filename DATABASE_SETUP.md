# 📊 DATABASE CONFIGURATION GUIDE

## Current Storage (Development)

**Location:** Browser localStorage (client-side)

```typescript
// Current implementation in reports.tsx
localStorage.setItem('generatedReports', JSON.stringify(reports));
localStorage.setItem('dataSources', JSON.stringify(sources));
```

**Limitations:**
- ❌ 5-10 MB storage limit
- ❌ Data cleared if browser cache cleared
- ❌ No multi-user support
- ❌ No server-side backup
- ❌ Security concerns (client-side storage)

---

## Recommended Production Setup

### Option 1: PostgreSQL (Recommended)

**Best for:** Multi-user, enterprise-grade, complex queries

**Setup with Drizzle ORM** (already in your project):

1. **Install PostgreSQL dependencies:**
```bash
npm install postgres
npm install @types/postgres --save-dev
```

2. **Update `server/db.ts`:**
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dashboard_db';
const client = postgres(connectionString);
export const db = drizzle(client);
```

3. **Create schema in `shared/schema.ts`:**
```typescript
import { pgTable, serial, text, timestamp, jsonb, integer, varchar } from 'drizzle-orm/pg-core';

// Data Sources Table
export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'csv', 'excel', 'sql', 'mongodb'
  size: varchar('size', { length: 50 }),
  records: integer('records'),
  data: jsonb('data'), // Store actual data as JSONB
  metadata: jsonb('metadata'), // Schema, stats, etc.
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// Generated Reports Table
export const generatedReports = pgTable('generated_reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  templateType: varchar('template_type', { length: 50 }),
  format: varchar('format', { length: 10 }), // 'pdf', 'docx', 'pptx'
  fileName: varchar('file_name', { length: 255 }),
  content: jsonb('content'), // Report content
  validation: jsonb('validation'), // Validation scores and results
  size: varchar('size', { length: 50 }),
  generatedAt: timestamp('generated_at').defaultNow(),
});

// Validation History Table
export const validationHistory = pgTable('validation_history', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').references(() => generatedReports.id),
  dataSourceId: integer('data_source_id').references(() => dataSources.id),
  structuralScore: integer('structural_score'),
  statisticalScore: integer('statistical_score'),
  anomalyScore: integer('anomaly_score'),
  overallScore: integer('overall_score'),
  riskLevel: varchar('risk_level', { length: 20 }),
  aiQualityScore: integer('ai_quality_score'),
  aiLogicalConsistency: integer('ai_logical_consistency'),
  flags: jsonb('flags'),
  insights: jsonb('insights'),
  validatedAt: timestamp('validated_at').defaultNow(),
});

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

4. **Create migrations:**
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

5. **Update `.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard_db
VITE_GEMINI_API_KEY=AIzaSyA0NhTvxyY4Key2B_Xen7p_gdo8ITuzGRs
```

---

### Option 2: SQLite (Simpler Alternative)

**Best for:** Single-user, embedded database, quick setup

**Setup:**

1. **Install:**
```bash
npm install better-sqlite3
npm install drizzle-orm
```

2. **Update `server/db.ts`:**
```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('./data/dashboard.db');
export const db = drizzle(sqlite);
```

3. **Schema (same structure, different imports):**
```typescript
import { sqliteTable, integer, text, blob } from 'drizzle-orm/sqlite-core';

export const dataSources = sqliteTable('data_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  data: text('data', { mode: 'json' }),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }),
});
```

---

### Option 3: MongoDB (NoSQL)

**Best for:** Flexible schema, document-based storage

**Setup:**

1. **Install:**
```bash
npm install mongodb mongoose
```

2. **Create schemas in `server/models/`:**

**`server/models/DataSource.ts`:**
```typescript
import mongoose from 'mongoose';

const dataSourceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['csv', 'excel', 'sql', 'mongodb'], required: true },
  size: String,
  records: Number,
  data: [mongoose.Schema.Types.Mixed], // Array of objects
  metadata: {
    schema: mongoose.Schema.Types.Mixed,
    statistics: mongoose.Schema.Types.Mixed,
  },
  uploadedAt: { type: Date, default: Date.now },
});

export const DataSource = mongoose.model('DataSource', dataSourceSchema);
```

**`server/models/Report.ts`:**
```typescript
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  templateType: String,
  format: { type: String, enum: ['pdf', 'docx', 'pptx'] },
  fileName: String,
  content: mongoose.Schema.Types.Mixed,
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
    }
  },
  size: String,
  generatedAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model('Report', reportSchema);
```

3. **Connect in `server/index.ts`:**
```typescript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard_db')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));
```

---

## API Routes Implementation

Create **`server/routes.ts`** with CRUD operations:

```typescript
import { Express } from 'express';
import { db } from './db';
import { dataSources, generatedReports, validationHistory } from '../shared/schema';
import { eq } from 'drizzle-orm';

export function registerRoutes(app: Express) {
  
  // Upload Data Source
  app.post('/api/data-sources', async (req, res) => {
    try {
      const { name, type, size, records, data, metadata } = req.body;
      
      const [newSource] = await db.insert(dataSources).values({
        userId: 1, // TODO: Get from auth session
        name,
        type,
        size,
        records,
        data,
        metadata,
      }).returning();
      
      res.json(newSource);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save data source' });
    }
  });
  
  // Get All Data Sources
  app.get('/api/data-sources', async (req, res) => {
    try {
      const sources = await db.select().from(dataSources)
        .where(eq(dataSources.userId, 1)); // TODO: Filter by authenticated user
      
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data sources' });
    }
  });
  
  // Save Generated Report
  app.post('/api/reports', async (req, res) => {
    try {
      const { title, templateType, format, fileName, content, validation, size } = req.body;
      
      const [newReport] = await db.insert(generatedReports).values({
        userId: 1,
        title,
        templateType,
        format,
        fileName,
        content,
        validation,
        size,
      }).returning();
      
      // Save validation history
      if (validation) {
        await db.insert(validationHistory).values({
          reportId: newReport.id,
          dataSourceId: null, // TODO: Track source
          structuralScore: validation.scores.structural,
          statisticalScore: validation.scores.statistical,
          anomalyScore: validation.scores.anomaly,
          overallScore: validation.scores.overall,
          riskLevel: validation.scores.riskLevel,
          aiQualityScore: validation.aiValidation?.qualityScore,
          aiLogicalConsistency: validation.aiValidation?.logicalConsistency,
          flags: validation.flags,
          insights: validation.aiValidation?.insights,
        });
      }
      
      res.json(newReport);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save report' });
    }
  });
  
  // Get All Reports
  app.get('/api/reports', async (req, res) => {
    try {
      const reports = await db.select().from(generatedReports)
        .where(eq(generatedReports.userId, 1))
        .orderBy(generatedReports.generatedAt);
      
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });
  
  // Delete Data Source
  app.delete('/api/data-sources/:id', async (req, res) => {
    try {
      await db.delete(dataSources)
        .where(eq(dataSources.id, parseInt(req.params.id)));
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete data source' });
    }
  });
}
```

---

## Migration from localStorage to Database

**Create migration utility:**

```typescript
// server/migrate-from-localstorage.ts
import { db } from './db';
import { dataSources, generatedReports } from '../shared/schema';

export async function migrateFromLocalStorage() {
  // This would be run client-side or you'd export localStorage data
  const savedReports = localStorage.getItem('generatedReports');
  const savedSources = localStorage.getItem('dataSources');
  
  if (savedReports) {
    const reports = JSON.parse(savedReports);
    for (const report of reports) {
      await db.insert(generatedReports).values({
        userId: 1,
        title: report.title,
        templateType: report.templateType,
        format: report.format,
        fileName: report.fileName,
        content: report.content,
        validation: report.validation,
        size: report.size,
      });
    }
    console.log(`✅ Migrated ${reports.length} reports`);
  }
  
  if (savedSources) {
    const sources = JSON.parse(savedSources);
    for (const source of sources) {
      await db.insert(dataSources).values({
        userId: 1,
        name: source.name,
        type: source.type,
        size: source.size,
        records: source.records,
        data: source.data,
      });
    }
    console.log(`✅ Migrated ${sources.length} data sources`);
  }
}
```

---

## Recommended: PostgreSQL + Drizzle

**Why?**
- ✅ Your project already has `drizzle.config.ts`
- ✅ Type-safe queries
- ✅ Excellent for complex data relationships
- ✅ Supports millions of records
- ✅ ACID compliance
- ✅ Free (open-source)

**Quick Start:**

1. Install PostgreSQL locally or use cloud service (Neon, Supabase, Railway)

2. Update `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard_db
```

3. Run migrations:
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

4. Update client code to use API instead of localStorage

---

## Summary

| Option | Best For | Complexity | Scalability |
|--------|----------|------------|-------------|
| **localStorage** | Prototyping | Easy | Poor |
| **SQLite** | Single-user apps | Easy | Good |
| **PostgreSQL** | Production apps | Medium | Excellent |
| **MongoDB** | Flexible schemas | Medium | Excellent |

**Recommendation:** Use **PostgreSQL with Drizzle ORM** - it's already configured in your project and provides the best balance of performance, scalability, and developer experience.

---

## Next Steps

1. Choose database (PostgreSQL recommended)
2. Run schema migrations
3. Update API routes
4. Replace localStorage calls with API calls
5. Test data persistence
6. Deploy database (Neon, Supabase, or Railway for PostgreSQL)

**Need help setting this up? Let me know which database you prefer and I'll create the complete implementation!**
