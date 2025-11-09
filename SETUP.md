# 🚀 Quick Start Guide - Flowbit Analytics Dashboard

This guide will help you get the project up and running in 10 minutes.

## ⚡ Fast Track Setup

### Step 1: Prerequisites Check
```bash
# Check Node.js (should be v18+)
node --version

# Check npm (should be v9+)
npm --version

# Check Python (should be v3.9+)
python --version

# Check PostgreSQL (should be v14+)
psql --version
```

### Step 2: Clone and Install

```bash
# Clone the repository
cd d:\Users\dell\Desktop\Task

# Install all dependencies at once
npm install

# Install backend dependencies
cd apps/api
npm install
cd ../..

# Install frontend dependencies  
cd apps/web
npm install
cd ../..

# Install Python dependencies
cd services/vanna
pip install -r requirements.txt
cd ../..
```

### Step 3: Database Setup

#### Option A: Quick Local Setup
```powershell
# Create database
createdb flowbit_analytics

# If createdb doesn't work, use psql:
psql -U postgres
# In psql:
CREATE DATABASE flowbit_analytics;
\q
```

#### Option B: Docker (Recommended)
```powershell
docker run --name flowbit-postgres `
  -e POSTGRES_PASSWORD=password `
  -e POSTGRES_DB=flowbit_analytics `
  -p 5432:5432 `
  -d postgres:14
```

### Step 4: Environment Variables

#### Backend API
```powershell
cd apps/api
Copy-Item .env.example .env
```

Edit `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowbit_analytics?schema=public"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
VANNA_SERVICE_URL="http://localhost:8000"
```

#### Frontend
```powershell
cd apps/web
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

#### Vanna AI Service
```powershell
cd services/vanna
Copy-Item .env.example .env
```

Edit `services/vanna/.env` and add your Groq API key:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowbit_analytics"
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="mixtral-8x7b-32768"
PORT=8000
```

**🔑 Get Groq API Key:** https://console.groq.com/keys

### Step 5: Initialize Database

```powershell
cd apps/api

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with real data
npm run db:seed
```

You should see output like:
```
🌱 Starting database seed...
📄 Reading data from: ../../data/Analytics_Test_Data.json
📊 Found XXXX invoices to process
...
🎉 Seed completed!
```

### Step 6: Start All Services

Open **3 separate PowerShell/CMD windows**:

#### Window 1 - Backend API
```powershell
cd apps/api
npm run dev
```
✅ Should see: `🚀 API server running on http://localhost:5000`

#### Window 2 - Frontend
```powershell
cd apps/web
npm run dev
```
✅ Should see: `✓ Ready in X seconds`

#### Window 3 - Vanna AI Service
```powershell
cd services/vanna
python -m uvicorn main:app --reload --port 8000
```
✅ Should see: `🚀 Starting Vanna AI Service on http://0.0.0.0:8000`

### Step 7: Access the Application

Open your browser:
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000/health
- **Vanna AI Service**: http://localhost:8000/health

---

## ✅ Verification Checklist

- [ ] All 3 services are running without errors
- [ ] Database has been seeded with data
- [ ] Frontend loads and shows dashboard
- [ ] Overview cards display statistics
- [ ] Charts render properly
- [ ] Invoice table shows data
- [ ] Chat tab is accessible
- [ ] No console errors in browser

---

## 🔧 Common Issues & Fixes

### Issue: "Port already in use"
```powershell
# Kill processes
npx kill-port 3000
npx kill-port 5000
npx kill-port 8000
```

### Issue: "Database connection failed"
```powershell
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL service (Windows)
net stop postgresql-x64-14
net start postgresql-x64-14
```

### Issue: "Module not found"
```powershell
# Delete node_modules and reinstall
cd apps/api
Remove-Item -Recurse -Force node_modules
npm install

cd ../web
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: "Prisma Client not generated"
```powershell
cd apps/api
npx prisma generate
```

### Issue: "Python dependencies failed"
```powershell
# Use virtual environment
cd services/vanna
python -m venv venv
.\venv\Scripts\Activate.ps1  # PowerShell
# or
.\venv\Scripts\activate.bat  # CMD

pip install -r requirements.txt
```

---

## 🧪 Test Your Setup

### Test Backend API
```powershell
# Health check
curl http://localhost:5000/health

# Get statistics
curl http://localhost:5000/api/stats

# Get invoices
curl http://localhost:5000/api/invoices?page=1&limit=5
```

### Test Vanna AI Service
```powershell
# Health check
curl http://localhost:8000/health

# Test SQL generation (PowerShell)
$body = @{question="Show me the top 5 vendors by total spend"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8000/generate-sql -Body $body -ContentType "application/json"
```

### Test Frontend
1. Open http://localhost:3000
2. Should see dashboard with charts
3. Click "Chat with Data" tab
4. Try: "Show top 5 vendors by spend"
5. Should see SQL query and results

---

## 📊 Sample Queries for Chat

Try these in the Chat with Data interface:

1. **"Show top 5 vendors by spend"**
2. **"What is the total spend in the last 90 days?"**
3. **"How many invoices are overdue?"**
4. **"List all pending invoices"**
5. **"What is the average invoice value?"**
6. **"Show invoices from January 2024"**
7. **"Which category has the highest spending?"**

---

## 🎯 Next Steps

### For Development:
1. Explore the codebase structure
2. Review API endpoints in `apps/api/src/routes/`
3. Check React components in `apps/web/src/components/`
4. Understand the Prisma schema in `apps/api/prisma/schema.prisma`

### For Customization:
1. Modify charts in `Dashboard.tsx`
2. Add new API endpoints in `apps/api/src/routes/`
3. Customize the AI prompts in `services/vanna/main.py`
4. Adjust the color scheme in `tailwind.config.js`

### For Production:
1. Follow deployment guide in main README.md
2. Set up environment variables on hosting platform
3. Use cloud PostgreSQL database
4. Enable HTTPS
5. Add authentication/authorization

---

## 💡 Tips

- **Keep all 3 terminals open** while developing
- **Use `npm run db:studio`** to visually browse your database
- **Check logs** in each terminal if something isn't working
- **Clear browser cache** if seeing stale data
- **Restart services** after environment variable changes

---

## 📞 Need Help?

1. Check the main README.md for detailed documentation
2. Review the troubleshooting section
3. Check console logs for error messages
4. Verify all environment variables are set correctly

---

**Happy Coding! 🚀**
