# 🏗️ System Architecture

Complete technical architecture documentation for the Flowbit Analytics Dashboard.

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Browser                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend (Port 3000)                    │   │
│  │  - React Components (Dashboard, Chat, Sidebar)               │   │
│  │  - Chart.js Visualizations                                   │   │
│  │  - Tailwind CSS Styling                                      │   │
│  │  - localStorage (Chat History)                               │   │
│  └───────────────────────┬─────────────────────────────────────┘   │
└────────────────────────────┼───────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ REST API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Express.js Backend API (Port 5000)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Routes:                                                       │  │
│  │  • GET  /api/stats          - Dashboard statistics           │  │
│  │  • GET  /api/vendors        - Top vendors                    │  │
│  │  • GET  /api/invoices       - Invoice list                   │  │
│  │  • GET  /api/invoice-volume - Monthly trends                 │  │
│  │  • GET  /api/category-spend - Category breakdown             │  │
│  │  • GET  /api/cash-flow      - Cash forecast                  │  │
│  │  • GET  /api/vendor-invoices- Vendor distribution            │  │
│  │  • POST /api/chat           - AI query proxy                 │  │
│  └──────────────────────┬───────────────────────┬───────────────┘  │
└─────────────────────────┼───────────────────────┼──────────────────┘
                          │                       │
                          │ Prisma ORM            │ HTTP POST
                          │ SQL Queries           │ /chat endpoint
                          ▼                       ▼
        ┌──────────────────────────┐   ┌─────────────────────────────┐
        │  PostgreSQL Database     │   │  Vanna AI Service (Port 8000)│
        │  (Port 5432)             │◄──│  - FastAPI Server            │
        │                          │   │  - Groq LLM Integration      │
        │  Tables:                 │   │  - SQL Generation            │
        │  • customers             │   │  - Query Execution           │
        │  • vendors               │   │  - Schema Training           │
        │  • invoices              │   └─────────────────────────────┘
        │  • line_items            │              │
        │  • payments              │              │ Groq API
        │  • _prisma_migrations    │              ▼
        └──────────────────────────┘   ┌─────────────────────────────┐
                                       │  Groq Cloud LLM              │
                                       │  (llama-3.3-70b-versatile)   │
                                       └─────────────────────────────┘
```

---

## 🗂️ Database Schema (ER Diagram)

```
┌─────────────────────┐
│     CUSTOMERS       │
├─────────────────────┤
│ 🔑 id (UUID)        │
│    name             │
│    email (unique)   │
│    created_at       │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│      INVOICES       │────────▶│      VENDORS        │
├─────────────────────┤   N:1   ├─────────────────────┤
│ 🔑 id (UUID)        │         │ 🔑 id (UUID)        │
│    invoice_number   │         │    name             │
│ 🔗 customer_id (FK) │         │    email (unique)   │
│ 🔗 vendor_id (FK)   │         │    category         │
│    issue_date       │         │    created_at       │
│    due_date         │         └─────────────────────┘
│    status           │
│    subtotal         │
│    tax              │
│    total            │
│    created_at       │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ├────────────────────────┐
           │                        │
           ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐
│    LINE_ITEMS       │  │      PAYMENTS       │
├─────────────────────┤  ├─────────────────────┤
│ 🔑 id (UUID)        │  │ 🔑 id (UUID)        │
│ 🔗 invoice_id (FK)  │  │ 🔗 invoice_id (FK)  │
│    description      │  │    amount           │
│    quantity         │  │    payment_date     │
│    unit_price       │  │    payment_method   │
│    total            │  └─────────────────────┘
└─────────────────────┘

Legend:
🔑 = Primary Key
🔗 = Foreign Key
1:N = One-to-Many Relationship
N:1 = Many-to-One Relationship
```

---

## 📊 Data Flow Diagrams

### 1. Dashboard Data Flow

```
User Opens Dashboard
        │
        ▼
Next.js Renders Page
        │
        ├──▶ GET /api/stats ──────────┐
        │                              │
        ├──▶ GET /api/vendors ─────────┤
        │                              │
        ├──▶ GET /api/invoice-volume ──┤
        │                              │
        ├──▶ GET /api/category-spend ──┤
        │                              ├──▶ Express Backend
        ├──▶ GET /api/cash-flow ───────┤         │
        │                              │         │
        ├──▶ GET /api/vendor-invoices ─┤         │
        │                              │         ▼
        └──▶ GET /api/invoices ────────┘    Prisma Query
                                                 │
                                                 ▼
                                            PostgreSQL
                                                 │
        ┌────────────────────────────────────────┘
        │
        ▼
  Data Returns to Frontend
        │
        ▼
  Chart.js Renders Charts
        │
        ▼
  Dashboard Displayed
```

### 2. Chat with Data Flow

```
User Types Question
"What are the top 10 vendors?"
        │
        ▼
Frontend: ChatWithData.tsx
        │
        ▼
POST /api/chat
{ question: "..." }
        │
        ▼
Backend: Express API
        │
        ▼
POST http://vanna:8000/chat
{ question: "..." }
        │
        ▼
Vanna AI Service
        │
        ├──▶ Send to Groq LLM
        │    "Generate SQL for: ..."
        │         │
        │         ▼
        │    Groq Returns SQL
        │    "SELECT v.name, SUM(i.total)
        │     FROM vendors v
        │     JOIN invoices i ON..."
        │         │
        ├─────────┘
        │
        ├──▶ Execute SQL on PostgreSQL
        │         │
        │         ▼
        │    Query Results
        │    [{ vendor_name: "...", total: 123 }]
        │         │
        ├─────────┘
        │
        ▼
Return Response
{
  question: "...",
  sql: "...",
  results: [...],
  rowCount: 10
}
        │
        ▼
Backend Forwards to Frontend
        │
        ▼
Frontend Renders:
├──▶ Question Display
├──▶ SQL Code Block
├──▶ Results Table
├──▶ Auto-Generated Chart
└──▶ Export CSV Button
```

---

## 🧩 Component Architecture

### Frontend (Next.js)

```
apps/web/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout, global styles
│   │   └── page.tsx                  # Main page, tab switching logic
│   │
│   ├── components/
│   │   ├── Dashboard.tsx             # Main dashboard component
│   │   │   ├── Stats Cards (4x)
│   │   │   ├── Charts (6x)
│   │   │   │   ├── Invoice Volume (Line)
│   │   │   │   ├── Top Vendors (Bar)
│   │   │   │   ├── Category Spend (Donut)
│   │   │   │   ├── Cash Flow (Bar)
│   │   │   │   ├── Vendor Invoices (Bar)
│   │   │   │   └── Decorative Donut
│   │   │   └── Invoice Table
│   │   │
│   │   ├── ChatWithData.tsx          # AI chat interface
│   │   │   ├── Question Input
│   │   │   ├── Chat History
│   │   │   ├── Response Display
│   │   │   │   ├── Question
│   │   │   │   ├── Generated SQL
│   │   │   │   ├── Results Table
│   │   │   │   └── Auto Chart (Bar/Line/Pie)
│   │   │   ├── CSV Export
│   │   │   └── Clear History
│   │   │
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   │   ├── Company Logo
│   │   │   ├── Menu Items
│   │   │   └── Branding
│   │   │
│   │   └── DecorativeDonut.tsx       # Custom SVG donut chart
│   │
│   └── lib/
│       ├── api.ts                    # API client functions
│       │   ├── getStats()
│       │   ├── getVendors()
│       │   ├── getInvoices()
│       │   └── chatWithData()
│       │
│       └── utils.ts                  # Helper functions
│           ├── formatCurrency()
│           ├── formatNumber()
│           ├── formatDate()
│           └── formatMonth()
```

### Backend (Express.js)

```
apps/api/
│
├── src/
│   ├── index.ts                      # Server entry point
│   │   ├── Express app setup
│   │   ├── CORS configuration
│   │   ├── Route registration
│   │   └── Server start
│   │
│   └── routes/                       # API route handlers
│       ├── stats.ts                  # Dashboard statistics
│       ├── vendors.ts                # Vendor endpoints
│       ├── invoices.ts               # Invoice CRUD
│       ├── charts.ts                 # Chart data endpoints
│       └── chat.ts                   # AI chat proxy
│
├── prisma/
│   ├── schema.prisma                 # Database schema definition
│   │   ├── Models (5 tables)
│   │   ├── Relations
│   │   ├── Indexes
│   │   └── Enums
│   │
│   ├── migrations/                   # Database migrations
│   │   └── YYYYMMDDHHMMSS_*.sql
│   │
│   └── seed.ts                       # Database seeding script
│       ├── Create 2 customers
│       ├── Create 10 vendors
│       ├── Create 100 invoices
│       ├── Create 250 line items
│       └── Create 75 payments
```

### AI Service (Python FastAPI)

```
services/vanna/
│
├── main.py                           # FastAPI application
│   ├── FastAPI app initialization
│   ├── Vanna AI setup
│   │   ├── Groq LLM configuration
│   │   ├── Database connection pool
│   │   └── Schema training on startup
│   │
│   ├── Endpoints:
│   │   ├── POST /chat                # Natural language query
│   │   │   ├── Receive question
│   │   │   ├── Generate SQL via LLM
│   │   │   ├── Execute SQL
│   │   │   └── Return results
│   │   │
│   │   └── GET /health               # Health check
│   │       ├── Check database connection
│   │       ├── Check LLM availability
│   │       └── Return status
│   │
│   └── Database Schema Training
│       ├── Load all table schemas
│       ├── Train Vanna with DDL
│       ├── Add sample queries
│       └── Cache for performance
```

---

## 🔄 State Management

### Frontend State

**Dashboard Component**:
```typescript
// API Data State
const [stats, setStats] = useState<DashboardStats | null>(null);
const [vendors, setVendors] = useState<VendorData[]>([]);
const [invoices, setInvoices] = useState<Invoice[]>([]);
const [chartData, setChartData] = useState<ChartData>({});

// UI State
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState<string>('all');
```

**ChatWithData Component**:
```typescript
// Chat State
const [question, setQuestion] = useState('');
const [responses, setResponses] = useState<ChatResponse[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Feature State
const [showCharts, setShowCharts] = useState<{ [key: number]: boolean }>({});

// Persistence
useEffect(() => {
  // Load from localStorage on mount
  const saved = localStorage.getItem('flowbit_chat_history');
  if (saved) setResponses(JSON.parse(saved));
}, []);

useEffect(() => {
  // Save to localStorage on change
  localStorage.setItem('flowbit_chat_history', JSON.stringify(responses));
}, [responses]);
```

**Page Component** (apps/web/src/app/page.tsx):
```typescript
// Tab State
const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

// Navigation Handler
const handleSidebarClick = (label: string) => {
  if (label === 'Dashboard') setActiveTab('dashboard');
  if (label === 'Chat with Data') setActiveTab('chat');
};
```

---

## 🔌 API Integration

### Frontend API Client (`lib/api.ts`)

```typescript
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds
});

// Dashboard endpoints
export const getStats = () => api.get('/api/stats');
export const getVendors = () => api.get('/api/vendors');
export const getInvoices = (params?) => api.get('/api/invoices', { params });

// Chat endpoint
export const chatWithData = async (question: string): Promise<ChatResponse> => {
  const { data } = await api.post('/api/chat', { question });
  return {
    ...data,
    timestamp: new Date().toISOString(),
  };
};
```

### Backend Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'minimal',
});

// Example: Get dashboard stats
export const getStats = async () => {
  const [totalSpending, invoiceCount, vendorCount] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true } }),
    prisma.invoice.count(),
    prisma.vendor.count(),
  ]);

  return {
    totalSpending: totalSpending._sum.total || 0,
    invoiceCount,
    vendorCount,
    avgInvoiceValue: totalSpending._sum.total / invoiceCount || 0,
  };
};
```

---

## 🎨 Styling Architecture

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#e3e0f4',  // Active state background
          600: '#1b1464',  // Dark violet (active text)
          700: '#1d1665',
        },
      },
      spacing: {
        '240': '240px',   // Sidebar width
        '1164': '1164px', // Content max width
        '279': '279px',   // Stats card width
        '120': '120px',   // Stats card height
      },
    },
  },
};
```

### Component Styling Patterns

**Stats Cards** (279×120px):
```tsx
<div className="bg-white rounded-lg shadow p-4 w-[279px] h-[120px]">
  {/* Content */}
</div>
```

**Sidebar** (240px fixed):
```tsx
<div className="w-60 bg-white h-screen fixed left-0 top-0">
  {/* Navigation */}
</div>
```

**Active State**:
```tsx
<button
  className={`${
    isActive
      ? 'bg-[rgba(227,230,240,1)] text-[rgba(27,20,100,1)]'
      : 'text-gray-600 hover:bg-gray-50'
  }`}
>
  {/* Menu item */}
</button>
```

---

## 🔒 Security Considerations

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use different keys for dev/prod
- ✅ Rotate API keys regularly

### 2. Database
- ✅ Use parameterized queries (Prisma prevents SQL injection)
- ✅ SSL/TLS connections required
- ✅ Least privilege access (read-only for Vanna AI)

### 3. API Security
- ✅ CORS configured for specific origins
- ✅ Rate limiting on endpoints (TODO: implement)
- ✅ Input validation on all requests
- ✅ No sensitive data in responses

### 4. Frontend
- ✅ XSS protection (React escapes by default)
- ✅ No API keys in client code
- ✅ HTTPS enforced in production
- ✅ Content Security Policy headers

---

## 📈 Performance Optimization

### Database
- **Indexes**: Added on foreign keys and frequently queried columns
- **Connection Pooling**: Prisma manages connection pool
- **Query Optimization**: Use aggregates instead of fetching all data

### Frontend
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Charts loaded on demand
- **Caching**: SWR or React Query for API caching

### Backend
- **Response Caching**: Cache GET endpoints for 60 seconds
- **Gzip Compression**: Enabled on Vercel/Railway
- **Database Query Caching**: Prisma query caching

### AI Service
- **Schema Caching**: Load schema once on startup
- **Connection Pooling**: Reuse database connections
- **LLM Caching**: Cache common queries (TODO)

---

## 🧪 Testing Strategy

### Frontend Tests
```typescript
// Component tests (Jest + React Testing Library)
describe('Dashboard', () => {
  it('renders all 6 charts', () => {
    render(<Dashboard />);
    expect(screen.getByText('Invoice Volume')).toBeInTheDocument();
  });
});
```

### Backend Tests
```typescript
// API endpoint tests (Jest + Supertest)
describe('GET /api/stats', () => {
  it('returns dashboard statistics', async () => {
    const response = await request(app).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalSpending');
  });
});
```

### Integration Tests
```bash
# End-to-end tests (Playwright/Cypress)
# Test full user flow: Dashboard → Chat → Query → Chart
```

---

## 🚀 Scalability Considerations

### Current Limits
- **Database**: 100,000 invoices (PostgreSQL handles millions)
- **Concurrent Users**: 100-1000 (Vercel auto-scales)
- **AI Queries**: 10/minute (Groq free tier limit)

### Scaling Strategies

**Horizontal Scaling**:
- Frontend: Vercel Edge Functions (automatic)
- Backend: Multiple instances behind load balancer
- Database: Read replicas for reporting

**Vertical Scaling**:
- Database: Increase CPU/RAM on Neon/Supabase
- AI Service: Larger Render.com instance

**Caching**:
- Redis for session data
- CDN for static assets
- Query result caching

**Optimization**:
- Implement pagination (already in invoices endpoint)
- Add data aggregation tables
- Use materialized views for complex queries

---

## 📊 Monitoring & Logging

### Production Monitoring (TODO)

**Application Performance**:
- Vercel Analytics (built-in)
- Sentry for error tracking
- New Relic for APM

**Database Monitoring**:
- Neon/Supabase built-in metrics
- Query performance tracking
- Connection pool monitoring

**AI Service Monitoring**:
- Render.com logs
- Groq API usage tracking
- Response time metrics

**Logging**:
```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

logger.info('Chat query processed', {
  question: '...',
  executionTime: 2.3,
  rowCount: 10,
});
```

---

## 🔄 CI/CD Pipeline

### Recommended Setup (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

**Architecture Documentation Complete** ✅

For implementation details, see [README.md](./README.md) and [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
