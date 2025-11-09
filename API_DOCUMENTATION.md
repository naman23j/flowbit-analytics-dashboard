# 📡 API Documentation

Complete API reference for the Flowbit Analytics Dashboard.

## Base URLs

- **Backend API**: `http://localhost:5000` (Development)
- **Vanna AI Service**: `http://localhost:8000` (Development)
- **Production**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🔷 Backend API Endpoints

### 1. Dashboard Statistics

Get overview statistics for the dashboard.

**Endpoint**: `GET /api/stats`

**Response**: `200 OK`
```json
{
  "totalSpending": 856420.50,
  "invoiceCount": 100,
  "vendorCount": 10,
  "avgInvoiceValue": 8564.21
}
```

**Fields**:
- `totalSpending` (number): Sum of all invoice totals
- `invoiceCount` (number): Total number of invoices
- `vendorCount` (number): Total number of unique vendors
- `avgInvoiceValue` (number): Average invoice amount

**Example**:
```bash
curl http://localhost:5000/api/stats
```

---

### 2. Vendor Spending Data

Get top vendors by total spending.

**Endpoint**: `GET /api/vendors`

**Query Parameters**:
- `limit` (optional, default: 10): Maximum number of vendors to return

**Response**: `200 OK`
```json
[
  {
    "vendor_name": "CloudHost Inc",
    "total_spend": 125430.00,
    "invoice_count": 15
  },
  {
    "vendor_name": "Office Depot",
    "total_spend": 98250.50,
    "invoice_count": 22
  }
]
```

**Example**:
```bash
curl http://localhost:5000/api/vendors?limit=5
```

---

### 3. Invoice Volume

Get monthly invoice volume trends.

**Endpoint**: `GET /api/invoice-volume`

**Query Parameters**:
- `months` (optional, default: 6): Number of months to retrieve

**Response**: `200 OK`
```json
[
  {
    "month": "2024-11",
    "count": 18,
    "total": 156420.00
  },
  {
    "month": "2024-10",
    "count": 22,
    "total": 189350.50
  }
]
```

**Fields**:
- `month` (string): Month in YYYY-MM format
- `count` (number): Number of invoices in that month
- `total` (number): Total amount for the month

**Example**:
```bash
curl http://localhost:5000/api/invoice-volume?months=12
```

---

### 4. Category Spending

Get spending breakdown by vendor category.

**Endpoint**: `GET /api/category-spend`

**Response**: `200 OK`
```json
[
  {
    "category": "Software",
    "total_spend": 285600.00,
    "percentage": 33.4
  },
  {
    "category": "Office Supplies",
    "total_spend": 198450.50,
    "percentage": 23.2
  }
]
```

**Example**:
```bash
curl http://localhost:5000/api/category-spend
```

---

### 5. Cash Flow Forecast

Get cash outflow forecast for upcoming months.

**Endpoint**: `GET /api/cash-flow`

**Query Parameters**:
- `months` (optional, default: 6): Number of months to forecast

**Response**: `200 OK`
```json
[
  {
    "month": "2024-12",
    "forecasted_amount": 145200.00
  },
  {
    "month": "2025-01",
    "forecasted_amount": 152800.00
  }
]
```

**Example**:
```bash
curl http://localhost:5000/api/cash-flow?months=3
```

---

### 6. Vendor Invoice Distribution

Get invoice count distribution per vendor.

**Endpoint**: `GET /api/vendor-invoices`

**Response**: `200 OK`
```json
[
  {
    "vendor_name": "CloudHost Inc",
    "invoice_count": 15
  },
  {
    "vendor_name": "Office Depot",
    "invoice_count": 22
  }
]
```

**Example**:
```bash
curl http://localhost:5000/api/vendor-invoices
```

---

### 7. Invoice List

Get paginated and filterable invoice list.

**Endpoint**: `GET /api/invoices`

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `status` (optional): Filter by status (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- `vendor` (optional): Filter by vendor name
- `search` (optional): Search in invoice number or vendor name

**Response**: `200 OK`
```json
{
  "invoices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "INV-2024-001",
      "vendor_name": "CloudHost Inc",
      "issue_date": "2024-11-01T00:00:00Z",
      "due_date": "2024-11-30T00:00:00Z",
      "status": "PAID",
      "total": 12450.00
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

**Example**:
```bash
# Get all invoices
curl http://localhost:5000/api/invoices

# Filter by status
curl http://localhost:5000/api/invoices?status=PAID

# Search
curl http://localhost:5000/api/invoices?search=CloudHost

# Pagination
curl http://localhost:5000/api/invoices?page=2&limit=10
```

---

### 8. Chat with Data (Proxy to Vanna AI)

Send natural language query to AI for SQL generation and execution.

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "question": "What are the top 10 vendors by total spend?"
}
```

**Response**: `200 OK`
```json
{
  "question": "What are the top 10 vendors by total spend?",
  "sql": "SELECT v.name as vendor_name, SUM(i.total) as total_spend FROM vendors v JOIN invoices i ON v.id = i.vendor_id GROUP BY v.name ORDER BY total_spend DESC LIMIT 10",
  "results": [
    {
      "vendor_name": "CloudHost Inc",
      "total_spend": 125430.00
    }
  ],
  "rowCount": 10,
  "timestamp": "2024-11-09T10:30:00Z"
}
```

**Error Response**: `400 Bad Request`
```json
{
  "error": "Question is required"
}
```

**Error Response**: `500 Internal Server Error`
```json
{
  "error": "Failed to process question",
  "details": "Connection to Vanna AI service failed"
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me monthly invoice trends"}'
```

---

## 🔷 Vanna AI Service Endpoints

### 1. Natural Language SQL Query

Process natural language question and return SQL + results.

**Endpoint**: `POST /chat`

**Request Body**:
```json
{
  "question": "What are the top 5 vendors by spending in the last 3 months?"
}
```

**Response**: `200 OK`
```json
{
  "question": "What are the top 5 vendors by spending in the last 3 months?",
  "sql": "SELECT v.name as vendor_name, SUM(i.total) as total_spend FROM vendors v JOIN invoices i ON v.id = i.vendor_id WHERE i.issue_date >= NOW() - INTERVAL '3 months' GROUP BY v.name ORDER BY total_spend DESC LIMIT 5",
  "results": [
    {
      "vendor_name": "CloudHost Inc",
      "total_spend": 45230.00
    },
    {
      "vendor_name": "Office Depot",
      "total_spend": 38450.50
    }
  ],
  "rowCount": 5,
  "executionTime": 0.045
}
```

**Error Response**: `400 Bad Request`
```json
{
  "error": "Question is required"
}
```

**Error Response**: `500 Internal Server Error`
```json
{
  "error": "Failed to generate SQL",
  "details": "LLM API rate limit exceeded"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How many invoices are overdue?"}'
```

---

### 2. Health Check

Check if the Vanna AI service is running and connected to database.

**Endpoint**: `GET /health`

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "database": "connected",
  "llm": "operational",
  "timestamp": "2024-11-09T10:30:00Z"
}
```

**Error Response**: `503 Service Unavailable`
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

**Example**:
```bash
curl http://localhost:8000/health
```

---

## 📊 Database Schema

### Tables Overview

```sql
-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    vendor_id UUID REFERENCES vendors(id),
    issue_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Line Items
CREATE TABLE line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(50) NOT NULL
);
```

---

## 🔒 Authentication

Currently, the API does not require authentication as it's a demo project. For production deployment, consider adding:

- **JWT tokens** for API authentication
- **API keys** for service-to-service communication
- **Rate limiting** to prevent abuse

---

## 🚨 Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 📈 Rate Limits

Development environment has no rate limits. Production deployment should implement:

- **Backend API**: 100 requests/minute per IP
- **Vanna AI**: 10 requests/minute per IP (due to LLM costs)

---

## 🧪 Testing Examples

### Using cURL

```bash
# Get dashboard stats
curl http://localhost:5000/api/stats

# Get top 5 vendors
curl http://localhost:5000/api/vendors?limit=5

# Search invoices
curl http://localhost:5000/api/invoices?search=Cloud

# Chat query
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all paid invoices from last month"}'
```

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Get stats
const stats = await axios.get(`${API_BASE}/api/stats`);
console.log(stats.data);

// Chat query
const response = await axios.post(`${API_BASE}/api/chat`, {
  question: 'What are the top vendors?'
});
console.log(response.data);
```

### Using Python (requests)

```python
import requests

API_BASE = 'http://localhost:5000'

# Get stats
response = requests.get(f'{API_BASE}/api/stats')
print(response.json())

# Chat query
response = requests.post(f'{API_BASE}/api/chat', json={
    'question': 'Show me overdue invoices'
})
print(response.json())
```

---

## 📝 Example Queries for Chat with Data

```
1. "What are the top 10 vendors by total spend?"
2. "Show me all overdue invoices"
3. "How many invoices were issued last month?"
4. "What is the average invoice amount by category?"
5. "List vendors with more than 10 invoices"
6. "Show me monthly spending trends for the last 6 months"
7. "Which customers have the highest total spend?"
8. "What percentage of invoices are paid on time?"
9. "Show me all invoices over $10,000"
10. "What is the total revenue by vendor category?"
```

---

**Last Updated**: November 9, 2024
