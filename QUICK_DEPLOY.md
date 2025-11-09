# 🚀 Quick Deployment Guide

## Step 1: Push to GitHub (Do this NOW)

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `flowbit-analytics-dashboard` (or your choice)
3. Description: "AI-Powered Analytics Dashboard with Natural Language SQL"
4. **Make it PUBLIC** (required for submission)
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 1.2 Push Your Code

Run these commands in PowerShell:

```powershell
# Navigate to project directory
cd d:\Users\dell\Desktop\Task

# Add all files to git
git add .

# Commit with message
git commit -m "Initial commit: Complete AI Analytics Dashboard with Vanna AI"

# Add your GitHub repository as remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/flowbit-analytics-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Important**: Replace `YOUR-USERNAME` with your actual GitHub username!

---

## Step 2: Deploy Backend API to Vercel

### 2.1 Sign Up / Login to Vercel
- Go to https://vercel.com
- Sign up with GitHub account
- Authorize Vercel to access your repositories

### 2.2 Deploy Backend

1. Click **"Add New Project"**
2. **Import** your `flowbit-analytics-dashboard` repository
3. Click **"Import"**
4. **Configure Project**:
   - **Project Name**: `flowbit-api` (or your choice)
   - **Framework Preset**: Other
   - **Root Directory**: Click "Edit" → Select `apps/api`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables** - Click "Add" for each:
   ```
   DATABASE_URL = (leave blank for now, will add after database setup)
   PORT = 5000
   VANNA_API_BASE_URL = (leave blank for now, will add after Vanna deployment)
   ```

6. Click **"Deploy"**
7. Wait 2-3 minutes for deployment
8. **Copy the URL**: e.g., `https://flowbit-api.vercel.app`
9. **Save this URL** - you'll need it!

---

## Step 3: Deploy Vanna AI to Render.com

### 3.1 Sign Up / Login to Render
- Go to https://render.com
- Sign up with GitHub account
- Authorize Render to access repositories

### 3.2 Deploy Vanna AI Service

1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select `flowbit-analytics-dashboard`
3. **Configure Service**:
   - **Name**: `flowbit-vanna-ai`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `services/vanna`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables** - Add these:
   ```
   DATABASE_URL = (leave blank for now)
   GROQ_API_KEY = your_groq_api_key_here
   PORT = 8000
   PYTHON_VERSION = 3.11.0
   ```

5. **Plan**: Select **"Free"** (spins down after 15 min inactivity)
6. Click **"Create Web Service"**
7. Wait 3-5 minutes for deployment
8. **Copy the URL**: e.g., `https://flowbit-vanna-ai.onrender.com`
9. **Test it**: Visit `https://flowbit-vanna-ai.onrender.com/health`
10. **Save this URL** - you'll need it!

---

## Step 4: Deploy Database to Neon

### 4.1 Sign Up for Neon
- Go to https://neon.tech
- Sign up (free tier available)

### 4.2 Create Database

1. Click **"Create a project"**
2. **Project name**: `flowbit-analytics`
3. **Region**: Choose closest to you
4. **PostgreSQL version**: 14 or higher
5. Click **"Create project"**

### 4.3 Get Connection String

1. After creation, you'll see connection details
2. **Copy the Connection String** - looks like:
   ```
   postgresql://username:password@ep-xyz.region.aws.neon.tech/flowbit_analytics?sslmode=require
   ```
3. **Save this** - you'll need it!

### 4.4 Run Migrations & Seed Data

**Option A: Via Backend Vercel Function** (Easiest)

1. Go to your Backend project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add/Update:
   ```
   DATABASE_URL = postgresql://username:password@host/dbname?sslmode=require
   ```
4. Go to **Deployments** tab
5. Click ⋯ on latest deployment → **"Redeploy"**
6. In Vercel dashboard, click **"Functions"** tab
7. Run migration command (if available)

**Option B: Via Local Terminal** (Recommended)

```powershell
# Set environment variable temporarily
$env:DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"

# Navigate to backend
cd d:\Users\dell\Desktop\Task\apps\api

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Verify
npx prisma studio
```

---

## Step 5: Update Environment Variables

### 5.1 Update Backend API (Vercel)

1. Go to Vercel → Your Backend Project
2. **Settings** → **Environment Variables**
3. **Update**:
   ```
   DATABASE_URL = postgresql://...from-neon...?sslmode=require
   VANNA_API_BASE_URL = https://flowbit-vanna-ai.onrender.com
   ```
4. **Redeploy**: Deployments tab → ⋯ → Redeploy

### 5.2 Update Vanna AI (Render)

1. Go to Render → Your Vanna Service
2. **Environment** tab
3. **Update**:
   ```
   DATABASE_URL = postgresql+psycopg://...from-neon...?sslmode=require
   ```
   (Note: Add `+psycopg` after `postgresql`)
4. Service will **auto-redeploy**

### 5.3 Test Backend API

```powershell
# Test stats endpoint
curl https://flowbit-api.vercel.app/api/stats

# Should return JSON with stats
```

### 5.4 Test Vanna AI

```powershell
# Test health endpoint
curl https://flowbit-vanna-ai.onrender.com/health

# Should return: {"status":"healthy"}
```

---

## Step 6: Deploy Frontend to Vercel

### 6.1 Deploy Frontend

1. Go to Vercel → **"Add New Project"**
2. **Import** same repository: `flowbit-analytics-dashboard`
3. **Configure**:
   - **Project Name**: `flowbit-dashboard`
   - **Framework Preset**: **Next.js** (auto-detected)
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://flowbit-api.vercel.app
   NEXT_PUBLIC_APP_URL = (will be auto-generated, update later)
   ```

5. Click **"Deploy"**
6. Wait 2-3 minutes
7. **Copy the URL**: e.g., `https://flowbit-dashboard.vercel.app`

### 6.2 Update Frontend Environment Variable

1. Go to Frontend project in Vercel
2. **Settings** → **Environment Variables**
3. **Update**:
   ```
   NEXT_PUBLIC_APP_URL = https://flowbit-dashboard.vercel.app
   ```
4. **Redeploy**

---

## Step 7: Test Everything

### 7.1 Visit Your Dashboard
Open: `https://flowbit-dashboard.vercel.app`

### 7.2 Test Features Checklist

- [ ] Dashboard loads without errors
- [ ] All 6 charts display data
- [ ] Stats cards show correct numbers
- [ ] Invoice table loads and is searchable
- [ ] Navigate to "Chat with Data"
- [ ] Ask question: "What are the top 10 vendors by total spend?"
- [ ] SQL is generated and displayed
- [ ] Results table appears
- [ ] Click "Show Chart" - chart appears
- [ ] Click "Export CSV" - file downloads
- [ ] Refresh page - chat history persists
- [ ] All features working ✅

---

## Step 8: Update README with Live URLs

Update `README.md` in your GitHub repo:

```markdown
## 🌐 Live Demo

- **Frontend**: https://flowbit-dashboard.vercel.app
- **Backend API**: https://flowbit-api.vercel.app
- **Vanna AI**: https://flowbit-vanna-ai.onrender.com
- **Demo Video**: [Add YouTube link here]
```

Commit and push:
```powershell
git add README.md
git commit -m "Update README with live deployment URLs"
git push origin main
```

---

## Step 9: Record Demo Video

### Recording Setup
1. **Tool**: OBS Studio (free) or Loom
2. **Duration**: 3-5 minutes
3. **Resolution**: 1080p

### Video Script (Follow DELIVERABLES.md)

**1. Introduction (30s)**
- Show URL: `https://flowbit-dashboard.vercel.app`
- "AI-powered analytics dashboard with natural language SQL"

**2. Dashboard Tour (1 min)**
- Show all 6 charts
- Show stats cards
- Demo table search/filter

**3. Chat with Data (2 min)**
- Ask 3 questions
- Show SQL generation
- Show auto-chart
- Export CSV
- Show history

**4. Tech Stack (30s)**
- Show GitHub repo
- Mention: Next.js, Express, Python, PostgreSQL, Groq LLM

**5. Conclusion (30s)**
- GitHub link
- Thank you

### Upload
1. **YouTube**: Upload as "Unlisted"
2. **Title**: "Flowbit AI Analytics Dashboard - Demo"
3. **Copy URL**
4. **Add to README.md**

---

## Step 10: Final Submission

### 10.1 Prepare Submission Email

Use template from `DELIVERABLES.md`:

```
Subject: Flowbit AI Analytics Dashboard - Internship Submission

Dear Flowbit Team,

I am pleased to submit my completed AI-Powered Analytics Dashboard.

📦 DELIVERABLES:

1. GitHub Repository:
   https://github.com/YOUR-USERNAME/flowbit-analytics-dashboard

2. Live URLs:
   - Frontend: https://flowbit-dashboard.vercel.app
   - Backend: https://flowbit-api.vercel.app/api/stats
   - Vanna AI: https://flowbit-vanna-ai.onrender.com/health

3. Demo Video:
   https://youtu.be/YOUR-VIDEO-ID

[Rest of email from DELIVERABLES.md]
```

### 10.2 Final Checklist

- [ ] GitHub repo is public
- [ ] All services deployed and working
- [ ] Database seeded with data
- [ ] Demo video uploaded
- [ ] README updated with URLs
- [ ] All documentation complete
- [ ] Tested from incognito browser
- [ ] Email drafted
- [ ] **SEND SUBMISSION** ✅

---

## 🆘 Troubleshooting

### Issue: Backend can't connect to Vanna AI
**Solution**: Update `VANNA_API_BASE_URL` in Vercel backend environment variables

### Issue: Vanna AI can't connect to database
**Solution**: 
1. Check `DATABASE_URL` in Render has `+psycopg` suffix
2. Ensure `?sslmode=require` is at the end
3. Check Neon database allows connections from anywhere

### Issue: Frontend CORS errors
**Solution**: 
1. Check `NEXT_PUBLIC_API_BASE_URL` is correct
2. Ensure backend has CORS enabled
3. Redeploy backend after env var changes

### Issue: Prisma migrations fail
**Solution**:
```powershell
# Reset and re-migrate
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma db seed
```

### Issue: Render service keeps spinning down
**Solution**: This is normal on free tier. First request takes 30-60 seconds to wake up. Upgrade to paid plan ($7/month) for always-on.

---

## 📞 Need Help?

Check these docs:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `DELIVERABLES.md` - Submission checklist
- `API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE.md` - System architecture

---

## ✅ Quick Summary

1. ✅ Push code to GitHub
2. ✅ Deploy backend to Vercel
3. ✅ Deploy Vanna AI to Render
4. ✅ Create database on Neon
5. ✅ Seed database
6. ✅ Update environment variables
7. ✅ Deploy frontend to Vercel
8. ✅ Test everything
9. ✅ Record demo video
10. ✅ Submit!

**Total time**: 1-2 hours

**You got this! 🚀**
