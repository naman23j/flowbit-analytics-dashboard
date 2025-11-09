# 🚀 Deployment Guide

Complete guide for deploying the Flowbit Analytics Dashboard to production.

## 📋 Deployment Checklist

- [ ] PostgreSQL database hosted
- [ ] Database seeded with sample data
- [ ] Groq API key obtained
- [ ] Vanna AI service deployed
- [ ] Backend API deployed
- [ ] Frontend deployed
- [ ] Environment variables configured
- [ ] DNS/domain configured (optional)
- [ ] SSL certificates enabled

---

## 🗄️ Step 1: Deploy Database (PostgreSQL)

### Option A: Neon (Recommended - Free Tier)

1. **Sign up** at [neon.tech](https://neon.tech)

2. **Create new project**:
   - Project name: `flowbit-analytics`
   - Region: Choose closest to your users
   - PostgreSQL version: 14+

3. **Get connection string**:
   ```
   postgresql://username:password@ep-xyz.region.aws.neon.tech/flowbit_analytics?sslmode=require
   ```

4. **Save for later** - you'll need this for all services

**Pros**: 
- ✅ Free tier: 0.5 GB storage
- ✅ Auto-scaling
- ✅ Instant branching
- ✅ Good performance

### Option B: Supabase

1. **Sign up** at [supabase.com](https://supabase.com)

2. **Create new project**:
   - Name: `flowbit-analytics`
   - Database password: Generate strong password
   - Region: Choose closest

3. **Get connection string** from Settings → Database:
   ```
   postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
   ```

**Pros**:
- ✅ Free tier: 500 MB database
- ✅ Includes auth & storage
- ✅ Real-time capabilities
- ✅ Dashboard UI

### Option C: Railway

1. **Sign up** at [railway.app](https://railway.app)

2. **New Project** → Add **PostgreSQL**

3. **Get connection string** from Variables tab

**Pros**:
- ✅ $5 free credit/month
- ✅ Easy deployment
- ✅ Simple pricing

---

## 🐍 Step 2: Deploy Vanna AI Service

### Platform: Render.com (Recommended)

1. **Sign up** at [render.com](https://render.com)

2. **New Web Service**:
   - Connect your GitHub repository
   - Name: `flowbit-vanna-ai`
   - Environment: `Python 3`
   - Root Directory: `services/vanna`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**:
   ```env
   DATABASE_URL=postgresql+psycopg://username:password@host:5432/dbname
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
   PORT=8000
   ```

4. **Deploy** and wait for build to complete

5. **Copy URL**: `https://flowbit-vanna-ai.onrender.com`

**Pricing**: Free tier available (spins down after inactivity)

### Alternative: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
cd services/vanna
railway init

# Add environment variables
railway variables set DATABASE_URL="postgresql+psycopg://..."
railway variables set GROQ_API_KEY="gsk_..."

# Deploy
railway up
```

---

## 🔧 Step 3: Deploy Backend API

### Platform: Vercel (Recommended)

1. **Sign up** at [vercel.com](https://vercel.com)

2. **New Project**:
   - Import your GitHub repository
   - Framework Preset: **Other**
   - Root Directory: `apps/api`

3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables**:
   ```env
   DATABASE_URL=postgresql://username:password@host:5432/dbname
   VANNA_API_BASE_URL=https://flowbit-vanna-ai.onrender.com
   PORT=5000
   ```

5. **Deploy**

6. **Run Migrations** (one-time):
   ```bash
   # In Vercel dashboard, go to Settings → Functions
   # Add build command:
   npx prisma migrate deploy && npx prisma db seed
   ```

7. **Copy URL**: `https://flowbit-api.vercel.app`

### Alternative: Railway

```bash
cd apps/api

# Initialize
railway init

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set VANNA_API_BASE_URL="https://..."

# Deploy
railway up

# Run migrations
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

---

## 🌐 Step 4: Deploy Frontend

### Platform: Vercel (Recommended)

1. **New Project** in Vercel:
   - Import GitHub repository
   - Framework Preset: **Next.js**
   - Root Directory: `apps/web`

2. **Build Settings** (auto-detected):
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://flowbit-api.vercel.app
   NEXT_PUBLIC_APP_URL=https://flowbit-dashboard.vercel.app
   ```

4. **Deploy**

5. **Custom Domain** (Optional):
   - Go to Settings → Domains
   - Add your domain: `analytics.yourdomain.com`
   - Configure DNS as instructed

6. **Copy URL**: `https://flowbit-dashboard.vercel.app`

### Alternative: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd apps/web
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

---

## 🔑 Step 5: Get Groq API Key

1. **Sign up** at [console.groq.com](https://console.groq.com)

2. **Create API Key**:
   - Go to API Keys section
   - Click "Create API Key"
   - Name: `Flowbit Vanna AI`
   - Copy the key (starts with `gsk_`)

3. **Add to Vanna AI service** environment variables

**Free Tier**: 14,400 requests/day with fast inference

---

## 🗃️ Step 6: Seed Database

After deploying the backend, seed the database:

### Option 1: Via Railway/Render CLI

```bash
# Railway
railway run npx prisma migrate deploy
railway run npx prisma db seed

# Render
# Use Render Shell from dashboard
npx prisma migrate deploy
npx prisma db seed
```

### Option 2: Via Local Connection

```bash
cd apps/api

# Set DATABASE_URL to production
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Seed data
npx prisma db seed
```

### Option 3: Manual SQL Import

If seed script fails, import data manually:

```bash
# Export from local
pg_dump -U postgres flowbit_analytics > backup.sql

# Import to production (Neon example)
psql "postgresql://username:password@host:5432/dbname" < backup.sql
```

---

## ✅ Step 7: Verify Deployment

### Test All Services

```bash
# 1. Test Vanna AI health
curl https://flowbit-vanna-ai.onrender.com/health

# 2. Test Backend API stats
curl https://flowbit-api.vercel.app/api/stats

# 3. Test Chat endpoint
curl -X POST https://flowbit-api.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the top 5 vendors?"}'

# 4. Visit Frontend
open https://flowbit-dashboard.vercel.app
```

### Checklist

- [ ] Frontend loads without errors
- [ ] Dashboard shows all 6 charts
- [ ] Stats cards display correct data
- [ ] Invoice table loads and is searchable
- [ ] Chat with Data works (AI queries)
- [ ] Charts auto-generate from chat results
- [ ] CSV export works
- [ ] Chat history persists

---

## 🌍 Production URLs Summary

After deployment, you'll have these URLs:

```
Frontend:    https://flowbit-dashboard.vercel.app
Backend API: https://flowbit-api.vercel.app
Vanna AI:    https://flowbit-vanna-ai.onrender.com
Database:    ep-xyz.region.aws.neon.tech:5432
```

**Save these URLs** - you'll need them for:
- GitHub README
- Internship submission
- Demo video

---

## 🔧 Environment Variables Summary

### Production .env Files

**Frontend** (Vercel):
```env
NEXT_PUBLIC_API_BASE_URL=https://flowbit-api.vercel.app
NEXT_PUBLIC_APP_URL=https://flowbit-dashboard.vercel.app
```

**Backend** (Vercel/Railway):
```env
DATABASE_URL=postgresql://user:pass@host:5432/flowbit_analytics?sslmode=require
VANNA_API_BASE_URL=https://flowbit-vanna-ai.onrender.com
PORT=5000
```

**Vanna AI** (Render):
```env
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/flowbit_analytics?sslmode=require
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
PORT=8000
```

---

## 📊 Performance Optimization

### Vercel Settings

1. **Enable Caching**:
   - Add `vercel.json` to backend:
   ```json
   {
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "s-maxage=60, stale-while-revalidate"
           }
         ]
       }
     ]
   }
   ```

2. **Enable Compression**:
   - Automatically enabled on Vercel

### Database Optimization

1. **Add Indexes** (already in Prisma schema):
   ```sql
   CREATE INDEX idx_invoices_vendor ON invoices(vendor_id);
   CREATE INDEX idx_invoices_customer ON invoices(customer_id);
   CREATE INDEX idx_invoices_date ON invoices(issue_date);
   ```

2. **Connection Pooling**:
   - Neon: Built-in pooling
   - Supabase: Use Supavisor
   - Manual: Add `?pgbouncer=true` to connection string

---

## 🔒 Security Checklist

- [ ] All environment variables stored securely (not in code)
- [ ] Database uses SSL connections (`?sslmode=require`)
- [ ] API endpoints have rate limiting (add middleware)
- [ ] CORS configured correctly:
  ```typescript
  // apps/api/src/index.ts
  app.use(cors({
    origin: ['https://flowbit-dashboard.vercel.app'],
    credentials: true
  }));
  ```
- [ ] Groq API key never exposed to frontend
- [ ] No sensitive data in logs

---

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend

**Problem**: CORS errors in browser console

**Solution**:
```typescript
// Backend: apps/api/src/index.ts
import cors from 'cors';
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Backend Can't Connect to Vanna AI

**Problem**: `ECONNREFUSED` or timeout errors

**Solution**:
1. Check Vanna AI service is running (visit `/health`)
2. Verify `VANNA_API_BASE_URL` environment variable
3. Check Render.com logs for errors

### Database Connection Fails

**Problem**: `Connection refused` or `SSL required`

**Solution**:
1. Add `?sslmode=require` to DATABASE_URL
2. Use correct format:
   - Backend: `postgresql://`
   - Vanna: `postgresql+psycopg://`
3. Check IP allowlist (Neon/Supabase)

### Vanna AI Slow/Timeout

**Problem**: Queries take >30 seconds

**Solution**:
1. Render free tier spins down after inactivity (first request slow)
2. Upgrade to paid plan for always-on
3. Or use Railway (doesn't spin down)

### Prisma Migrations Fail

**Problem**: Can't run migrations in production

**Solution**:
```bash
# Use shadow database (Neon)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Or reset database
npx prisma migrate reset --force
npx prisma db seed
```

---

## 💰 Cost Estimate

### Free Tier (Recommended for Demo)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | $0/month |
| Neon | Free | $0/month |
| Render | Free | $0/month |
| Groq API | Free | $0/month |
| **Total** | | **$0/month** |

**Limitations**:
- Render spins down after 15 min inactivity (first request ~30s)
- Neon: 0.5 GB storage, 1 branch
- Vercel: 100 GB bandwidth
- Groq: 14,400 requests/day

### Paid Tier (Production)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Neon | Pro | $19/month |
| Render | Starter | $7/month |
| Groq API | Pay-as-go | ~$5/month |
| **Total** | | **$51/month** |

**Benefits**:
- Always-on services
- Better performance
- More storage/bandwidth
- Priority support

---

## 📝 Deployment Script

Save this as `deploy.sh` for quick redeployment:

```bash
#!/bin/bash

echo "🚀 Deploying Flowbit Analytics Dashboard..."

# 1. Deploy Vanna AI
echo "📦 Deploying Vanna AI service..."
cd services/vanna
railway up
cd ../..

# 2. Deploy Backend API
echo "📦 Deploying Backend API..."
cd apps/api
vercel --prod
cd ../..

# 3. Run migrations
echo "🗄️ Running database migrations..."
cd apps/api
railway run npx prisma migrate deploy
railway run npx prisma db seed
cd ../..

# 4. Deploy Frontend
echo "📦 Deploying Frontend..."
cd apps/web
vercel --prod
cd ../..

echo "✅ Deployment complete!"
echo "Frontend: https://flowbit-dashboard.vercel.app"
echo "Backend: https://flowbit-api.vercel.app"
echo "Vanna: https://flowbit-vanna-ai.onrender.com"
```

---

## 🎥 Demo Video Script

For your 3-5 minute demo video:

1. **Introduction** (30s)
   - Show deployed URL
   - Brief overview of features

2. **Dashboard Tour** (1min)
   - Stats cards
   - All 6 charts
   - Invoice table with search/filter

3. **Chat with Data** (2min)
   - Ask 3-4 questions
   - Show SQL generation
   - Show auto-chart feature
   - Demo CSV export
   - Show chat history

4. **Technical Stack** (30s)
   - Quick code walkthrough
   - Architecture diagram
   - Deployment platforms

5. **Conclusion** (30s)
   - GitHub repo link
   - Contact information

---

## 📧 Submission Checklist

For Flowbit internship submission:

- [ ] GitHub repo public or invite sent
- [ ] README.md updated with live URLs
- [ ] All documentation complete
- [ ] Frontend URL working
- [ ] Backend API accessible
- [ ] Vanna AI service running
- [ ] Database seeded with data
- [ ] Demo video recorded and uploaded
- [ ] Email sent with all links

---

**Deployment Complete! 🎉**

Your dashboard is now live and ready for evaluation!
