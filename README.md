# 📊 Flowbit Analytics Dashboard - Full Stack Internship Project

> **Production-grade analytics dashboard with AI-powered "Chat with Data" interface**

A comprehensive full-stack web application built with modern technologies, featuring data visualization, real-time analytics, and natural language SQL queries powered by AI.

## 🎯 Project Overview

This project demonstrates a complete data analytics solution with two main modules:

### 1. **Analytics Dashboard**
- Real-time invoice and vendor analytics
- Interactive charts (Line, Bar, Pie)
- Overview cards with key metrics
- Searchable and filterable invoice table
- Cash outflow forecasting

### 2. **Chat with Data (AI-Powered)**
- Natural language to SQL conversion using Groq LLM
- Self-hosted Vanna AI service
- Real-time query execution
- Visual results display with generated SQL

---

## 🏗️ Architecture

```
flowbit-analytics-dashboard/
├── apps/
│   ├── web/          # Next.js Frontend (React + TypeScript + Tailwind)
│   └── api/          # Express.js Backend (Node.js + Prisma + PostgreSQL)
├── services/
│   └── vanna/        # Python FastAPI (Groq LLM integration)
├── data/
│   └── Analytics_Test_Data.json  # Seed data
└── package.json      # Monorepo workspace configuration
```

---

## 🛠️ Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Custom components with shadcn/ui patterns
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend API (Express.js)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Built-in Express validation
- **CORS**: Enabled for frontend

### AI Service (Python)
- **Framework**: FastAPI
- **LLM Provider**: Groq
- **Model**: Mixtral-8x7b-32768
- **Database Driver**: psycopg2
- **Async Support**: uvicorn

### Database
- **Primary Database**: PostgreSQL
- **Normalized Schema**: 5 tables (vendors, customers, invoices, line_items, payments)
- **Migrations**: Prisma Migrate

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Python** (v3.9 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd flowbit-analytics-dashboard
```

### 2. Install Dependencies

#### Install Root Dependencies
```bash
npm install
```

#### Install Backend Dependencies
```bash
cd apps/api
npm install
cd ../..
```

#### Install Frontend Dependencies
```bash
cd apps/web
npm install
cd ../..
```

#### Install Python Dependencies
```bash
cd services/vanna
pip install -r requirements.txt
# or
python -m pip install -r requirements.txt
cd ../..
```

### 3. Setup PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Create database
createdb flowbit_analytics

# Or using psql
psql -U postgres
CREATE DATABASE flowbit_analytics;
\q
```

#### Option B: Docker PostgreSQL
```bash
docker run --name flowbit-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=flowbit_analytics \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Configure Environment Variables

#### Backend API (.env)
```bash
cd apps/api
cp .env.example .env
# Edit .env with your database credentials
```

Example `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowbit_analytics?schema=public"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
VANNA_SERVICE_URL="http://localhost:8000"
```

#### Frontend (.env.local)
```bash
cd apps/web
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

#### Vanna AI Service (.env)
```bash
cd services/vanna
cp .env.example .env
# Add your Groq API key
```

Example `services/vanna/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowbit_analytics"
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="mixtral-8x7b-32768"
PORT=8000
CORS_ORIGINS="http://localhost:3000,http://localhost:5000"
```

**Get your Groq API key:** https://console.groq.com/

### 5. Setup Database Schema

```bash
cd apps/api

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 6. Start All Services

#### Terminal 1 - Backend API
```bash
cd apps/api
npm run dev
```
Server runs on: http://localhost:5000

#### Terminal 2 - Frontend
```bash
cd apps/web
npm run dev
```
Server runs on: http://localhost:3000

#### Terminal 3 - Vanna AI Service
```bash
cd services/vanna
python -m uvicorn main:app --reload --port 8000
```
Server runs on: http://localhost:8000

---

## 📡 API Endpoints

### Backend API (Port 5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Overview statistics (total invoices, spend, vendors) |
| `/api/invoice-trends` | GET | Monthly invoice count and spend trends |
| `/api/vendors/top10` | GET | Top 10 vendors by total spend |
| `/api/category-spend` | GET | Spending grouped by category |
| `/api/cash-outflow` | GET | Expected cash outflow forecast |
| `/api/invoices` | GET | Paginated invoices with search & filter |
| `/api/invoices/:id` | GET | Single invoice details |
| `/api/chat-with-data` | POST | Forward query to Vanna AI service |

### Vanna AI Service (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service information |
| `/health` | GET | Health check + database status |
| `/generate-sql` | POST | Convert question to SQL and execute |
| `/schema` | GET | Database schema information |

---

## 💾 Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   vendors    │       │  customers   │       │   invoices   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │───┐   │ id (PK)      │
│ name         │   │   │ name         │   │   │ invoice_num  │
│ address      │   │   │ address      │   │   │ vendor_id FK │───┐
│ tax_id       │   └───│ email        │   └───│ customer_id  │   │
│ email        │       │ phone        │       │ issue_date   │   │
│ phone        │       └──────────────┘       │ due_date     │   │
└──────────────┘                              │ total_amount │   │
                                              │ status       │   │
                                              └──────────────┘   │
                                                      │           │
                    ┌─────────────────────────────────┼───────────┘
                    │                                 │
          ┌─────────▼──────────┐          ┌──────────▼────────┐
          │    line_items      │          │     payments      │
          ├────────────────────┤          ├───────────────────┤
          │ id (PK)            │          │ id (PK)           │
          │ invoice_id (FK)    │          │ invoice_id (FK)   │
          │ description        │          │ payment_date      │
          │ quantity           │          │ amount            │
          │ unit_price         │          │ method            │
          │ amount             │          │ reference         │
          └────────────────────┘          └───────────────────┘
```

---

## 🎨 Features

### Dashboard Features
- ✅ Real-time overview cards (Total Invoices, Spend, Vendors, Avg Value)
- ✅ Status breakdown (Paid, Pending, Overdue)
- ✅ Line chart: Invoice trends over 12 months
- ✅ Bar chart: Top 10 vendors by spend
- ✅ Pie chart: Category spend distribution
- ✅ Searchable invoice table with filters
- ✅ Responsive design for mobile/tablet/desktop

### Chat with Data Features
- ✅ Natural language query input
- ✅ AI-powered SQL generation (Groq LLM)
- ✅ Real-time query execution
- ✅ Display generated SQL
- ✅ Interactive results table
- ✅ Example questions for guidance
- ✅ Error handling and feedback

---

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# Get statistics
curl http://localhost:5000/api/stats

# Get invoices
curl http://localhost:5000/api/invoices?page=1&limit=10
```

### Test Vanna AI Service
```bash
# Health check
curl http://localhost:8000/health

# Test SQL generation
curl -X POST http://localhost:8000/generate-sql \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me the top 5 vendors by total spend"}'
```

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd apps/web
vercel deploy
```

### Backend API (Vercel/Railway)
```bash
cd apps/api
# Deploy to Vercel or Railway
# Update environment variables in platform
```

### Vanna AI Service (Render/Railway/Fly.io)
```bash
cd services/vanna
# Deploy using platform CLI
# Set environment variables in platform
```

### Database (Cloud PostgreSQL)
Options:
- **Neon**: https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **Render**: https://render.com

---

## 📝 Scripts Reference

### Root Level
```bash
npm run dev              # Start all services
npm run build            # Build all packages
npm run dev:api          # Start only API
npm run dev:web          # Start only web
npm run dev:vanna        # Start only Vanna service
```

### Backend (apps/api)
```bash
npm run dev              # Start dev server
npm run build            # Build TypeScript
npm run start            # Start production server
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

### Frontend (apps/web)
```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Vanna Service (services/vanna)
```bash
python -m uvicorn main:app --reload --port 8000    # Development
python -m uvicorn main:app --host 0.0.0.0 --port 8000  # Production
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d flowbit_analytics -c "SELECT 1"
```

### Port Already in Use
```bash
# Kill process on port 5000 (API)
npx kill-port 5000

# Kill process on port 3000 (Web)
npx kill-port 3000

# Kill process on port 8000 (Vanna)
npx kill-port 8000
```

### Prisma Issues
```bash
cd apps/api
rm -rf node_modules
npm install
npx prisma generate
npx prisma migrate dev
```

---

## 📚 Project Structure

```
flowbit-analytics-dashboard/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── seed.ts            # Database seeding script
│   │   ├── src/
│   │   │   ├── routes/            # API route handlers
│   │   │   ├── lib/               # Utilities (Prisma client)
│   │   │   └── index.ts           # Express server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── web/
│       ├── src/
│       │   ├── app/               # Next.js app directory
│       │   ├── components/        # React components
│       │   └── lib/               # API client & utilities
│       ├── package.json
│       ├── tailwind.config.js
│       ├── next.config.js
│       └── tsconfig.json
│
├── services/
│   └── vanna/
│       ├── main.py                # FastAPI application
│       ├── requirements.txt       # Python dependencies
│       ├── package.json
│       └── .env.example
│
├── data/
│   └── Analytics_Test_Data.json  # Sample invoice data
│
├── package.json                   # Root workspace config
├── .gitignore
└── README.md
```

---

## 👨‍💻 Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **Python**: PEP 8 compliant
- **Formatting**: Consistent indentation (2 spaces for TS/JS, 4 for Python)
- **Naming**: camelCase for JS/TS, snake_case for Python

### Commit Messages
```
feat: Add new feature
fix: Bug fix
docs: Documentation update
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

---

## 🤝 Contributing

This is an internship assignment project. For questions or issues:

1. Check existing documentation
2. Review troubleshooting section
3. Contact the project maintainer

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Flowbit** - For the internship opportunity
- **Groq** - For providing fast LLM inference
- **Prisma** - For excellent TypeScript ORM
- **Next.js** - For the amazing React framework
- **FastAPI** - For the modern Python web framework

---

## 📞 Support

For support and questions:
- **Email**: your-email@example.com
- **Documentation**: This README
- **Issues**: GitHub Issues (if applicable)

---

**Built with ❤️ for the Flowbit Full Stack Developer Internship**
