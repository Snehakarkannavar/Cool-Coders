# 🚀 MongoDB Setup Guide - Quick Start
# Pritesh2004
# mongodb+srv://shivalingkarp_db_user:Pritesh2004@cluster0.7plzf5h.mongodb.net/
## ✅ Step 1: Install MongoDB Locally

### Option A: Windows (Recommended for Development)

1. **Download MongoDB Community Server:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Version: Latest stable (7.0+)

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Install MongoDB Compass" (GUI tool)

3. **Verify Installation:**
   ```powershell
   mongod --version
   ```

4. **Start MongoDB Service:**
   ```powershell
   # Already running if installed as service
   # Or manually start:
   net start MongoDB
   ```

### Option B: MongoDB Atlas (Cloud - FREE)

1. **Create Free Account:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free tier available)

2. **Create Cluster:**
   - Choose FREE tier (M0)
   - Select region (closest to you)
   - Create cluster (takes 3-5 minutes)

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dashboard_manager
   ```

4. **Update .env:**
   ```env
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/dashboard_manager
   ```

---

## ✅ Step 2: Configuration (Already Done!)

Your project is configured with:

✅ `server/mongodb.ts` - Connection manager
✅ `server/models/DataSource.ts` - Data source schema
✅ `server/models/Report.ts` - Report schema
✅ `server/models/User.ts` - User schema
✅ `server/mongodb-routes.ts` - API routes
✅ `.env` - MongoDB URI configured

---

## ✅ Step 3: Test Connection

### Start the Server:

```powershell
cd "D:\Download\Dashboard-Manager (1)\Dashboard-Manager"
npm run dev
```

**Look for:**
```
✅ MongoDB connected successfully
📦 Database: dashboard_manager
✅ MongoDB API routes registered
```

**If you see this, you're connected!** ✅

---

## ✅ Step 4: Test the API

### Using MongoDB Compass (GUI):

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. You should see database `dashboard_manager`
4. Collections will appear after first data upload

### Using API:

```powershell
# Test creating a data source
curl -X POST http://localhost:5000/api/data-sources `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test Data",
    "type": "csv",
    "records": 100,
    "data": [{"id": 1, "name": "Test"}]
  }'

# Get all data sources
curl http://localhost:5000/api/data-sources

# Get statistics
curl http://localhost:5000/api/stats
```

---

## 📊 Available API Endpoints

### Data Sources:
- `POST /api/data-sources` - Upload data source
- `GET /api/data-sources` - Get all data sources
- `GET /api/data-sources/:id` - Get single data source
- `DELETE /api/data-sources/:id` - Delete data source

### Reports:
- `POST /api/reports` - Save generated report
- `GET /api/reports` - Get all reports (paginated)
- `GET /api/reports/:id` - Get single report
- `DELETE /api/reports/:id` - Delete report

### Statistics:
- `GET /api/stats` - Dashboard statistics

### Users:
- `POST /api/users` - Create/login user

---

## 🔧 MongoDB Configuration

### Database Schema:

**Collections:**
1. **datasources** - Uploaded CSV/Excel files
2. **reports** - Generated reports with validation
3. **users** - User accounts

**Indexes (automatically created):**
- User ID + Upload date
- Report accuracy scores
- Email (unique)

---

## 🎯 Next Steps: Update Frontend

Update your React components to use MongoDB API instead of localStorage:

### Example: Save Report to MongoDB

**Before (localStorage):**
```typescript
localStorage.setItem('generatedReports', JSON.stringify(reports));
```

**After (MongoDB API):**
```typescript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: reportContent.title,
    templateType: 'executive',
    format: 'pdf',
    fileName: 'report.pdf',
    content: reportContent,
    validation: reportContent.validation,
    size: '2.4 MB',
  }),
});

const result = await response.json();
console.log('Saved to MongoDB:', result.data);
```

### Example: Load Data Sources

**Before:**
```typescript
const sources = JSON.parse(localStorage.getItem('dataSources') || '[]');
```

**After:**
```typescript
const response = await fetch('/api/data-sources');
const result = await response.json();
const sources = result.data;
```

---

## 💡 Quick MongoDB Commands

### Using MongoDB Shell:

```bash
# Connect to database
mongosh mongodb://localhost:27017/dashboard_manager

# Show all collections
show collections

# Count documents
db.datasources.countDocuments()
db.reports.countDocuments()

# Find reports with high accuracy
db.reports.find({ "validation.scores.overall": { $gte: 90 } })

# Get latest reports
db.reports.find().sort({ generatedAt: -1 }).limit(5)

# Delete all data (CAUTION!)
db.datasources.deleteMany({})
db.reports.deleteMany({})
```

---

## 🚨 Troubleshooting

### "MongoDB connection failed"

**Solution 1:** Check if MongoDB is running
```powershell
# Windows
net start MongoDB

# Or check service status
Get-Service MongoDB
```

**Solution 2:** Check connection string in `.env`
```env
# Local (default)
MONGODB_URI=mongodb://localhost:27017/dashboard_manager

# Cloud
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dashboard_manager
```

**Solution 3:** Check firewall
- Allow MongoDB (port 27017) through Windows Firewall
- For MongoDB Atlas: Add your IP to whitelist

### "Cannot find module 'mongoose'"

```powershell
npm install mongodb mongoose
```

### Port 27017 in use

```powershell
# Find process using port
netstat -ano | findstr :27017

# Kill process (replace PID)
taskkill /PID <process_id> /F
```

---

## 📊 MongoDB vs localStorage

| Feature | localStorage | MongoDB |
|---------|-------------|---------|
| Storage Limit | 5-10 MB | Unlimited |
| Data Persistence | Browser cache | Server database |
| Multi-user | ❌ No | ✅ Yes |
| Backup | ❌ No | ✅ Yes |
| Queries | ❌ Limited | ✅ Advanced |
| Scalability | ❌ Poor | ✅ Excellent |

---

## 🎉 Summary

**Your MongoDB setup is complete!**

✅ MongoDB connection configured
✅ Mongoose models created (DataSource, Report, User)
✅ API routes registered
✅ Error handling implemented
✅ Indexes optimized

**Test it now:**
1. Start server: `npm run dev`
2. Look for "MongoDB connected" message
3. Test API endpoints
4. Use MongoDB Compass to view data

**Next:** Update frontend components to use `/api/data-sources` and `/api/reports` instead of localStorage!

---

## 🔗 Useful Links

- MongoDB Download: https://www.mongodb.com/try/download/community
- MongoDB Atlas (Cloud): https://www.mongodb.com/cloud/atlas
- Mongoose Docs: https://mongoosejs.com/docs/
- MongoDB Compass: https://www.mongodb.com/products/compass
