# 💬 Chat with Data - Complete Workflow Documentation

Detailed explanation of how the natural language SQL querying system works.

## 🎯 Overview

The "Chat with Data" feature allows users to ask questions about their data in plain English, which are automatically converted to SQL queries, executed against the database, and returned with visualizations.

---

## 🔄 Complete Workflow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                                  │
└─────────────────────────────────────────────────────────────────────┘
   
   User types question in natural language:
   "What are the top 10 vendors by total spend?"
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (Next.js - ChatWithData.tsx)                            │
└─────────────────────────────────────────────────────────────────────┘
   
   Component: apps/web/src/components/ChatWithData.tsx
   
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     
     try {
       // Call API client
       const response = await chatWithData(question);
       setResponses([response, ...responses]);
       
       // Save to localStorage
       localStorage.setItem('flowbit_chat_history', 
         JSON.stringify([response, ...responses]));
       
       setQuestion('');
     } catch (err) {
       setError('Failed to process your question');
     } finally {
       setLoading(false);
     }
   };
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 3. API CLIENT (lib/api.ts)                                          │
└─────────────────────────────────────────────────────────────────────┘
   
   File: apps/web/src/lib/api.ts
   
   export const chatWithData = async (question: string): Promise<ChatResponse> => {
     const { data } = await axios.post(
       `${API_BASE}/api/chat`,
       { question },
       { timeout: 30000 }  // 30 second timeout
     );
     
     return {
       ...data,
       timestamp: new Date().toISOString(),
     };
   };
   
   HTTP Request:
   POST http://localhost:5000/api/chat
   Content-Type: application/json
   Body: { "question": "What are the top 10 vendors by total spend?" }
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 4. BACKEND API (Express.js)                                         │
└─────────────────────────────────────────────────────────────────────┘
   
   File: apps/api/src/index.ts (or routes/chat.ts)
   
   app.post('/api/chat', async (req, res) => {
     const { question } = req.body;
     
     if (!question) {
       return res.status(400).json({ error: 'Question is required' });
     }
     
     try {
       // Forward request to Vanna AI service
       const response = await axios.post(
         `${process.env.VANNA_API_BASE_URL}/chat`,
         { question },
         { timeout: 30000 }
       );
       
       // Return response to frontend
       res.json(response.data);
     } catch (error) {
       console.error('Vanna AI error:', error);
       res.status(500).json({
         error: 'Failed to process question',
         details: error.message
       });
     }
   });
   
   HTTP Request forwarded to:
   POST http://localhost:8000/chat
   Body: { "question": "What are the top 10 vendors by total spend?" }
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 5. VANNA AI SERVICE (Python FastAPI)                                │
└─────────────────────────────────────────────────────────────────────┘
   
   File: services/vanna/main.py
   
   @app.post("/chat")
   async def chat(request: ChatRequest):
       question = request.question
       
       try:
           # Step 5a: Generate SQL using Groq LLM
           sql = vn.generate_sql(question)
           
           # Step 5b: Execute SQL against PostgreSQL
           results = vn.run_sql(sql)
           
           # Step 5c: Format response
           return ChatResponse(
               question=question,
               sql=sql,
               results=results,
               rowCount=len(results)
           )
       except Exception as e:
           raise HTTPException(
               status_code=500,
               detail=f"Failed to process question: {str(e)}"
           )
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 5a. GROQ LLM (Cloud API)                                            │
└─────────────────────────────────────────────────────────────────────┘
   
   Vanna AI calls Groq LLM API:
   
   # Inside vn.generate_sql(question)
   prompt = f"""
   Given this database schema:
   
   Table: vendors
   Columns: id (UUID), name (VARCHAR), email (VARCHAR), category (VARCHAR)
   
   Table: invoices
   Columns: id (UUID), vendor_id (UUID), total (DECIMAL), issue_date (TIMESTAMP)
   
   Generate a PostgreSQL query for: "{question}"
   
   Return only the SQL query, no explanation.
   """
   
   response = groq_client.chat.completions.create(
       model="llama-3.3-70b-versatile",
       messages=[{"role": "user", "content": prompt}],
       temperature=0.1  # Low temperature for consistent SQL
   )
   
   Generated SQL:
   SELECT 
     v.name as vendor_name, 
     SUM(i.total) as total_spend 
   FROM vendors v 
   JOIN invoices i ON v.id = i.vendor_id 
   GROUP BY v.name 
   ORDER BY total_spend DESC 
   LIMIT 10
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 5b. POSTGRESQL DATABASE                                             │
└─────────────────────────────────────────────────────────────────────┘
   
   Vanna executes the generated SQL:
   
   # Inside vn.run_sql(sql)
   conn = psycopg.connect(DATABASE_URL)
   cursor = conn.cursor()
   cursor.execute(sql)
   results = cursor.fetchall()
   
   Query Results:
   [
     { "vendor_name": "CloudHost Inc", "total_spend": 125430.00 },
     { "vendor_name": "Office Depot", "total_spend": 98250.50 },
     { "vendor_name": "AWS", "total_spend": 87650.75 },
     ...
   ]
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 6. RESPONSE CHAIN (Back through the stack)                          │
└─────────────────────────────────────────────────────────────────────┘
   
   Vanna AI → Backend API → Frontend
   
   Final Response Format:
   {
     "question": "What are the top 10 vendors by total spend?",
     "sql": "SELECT v.name as vendor_name...",
     "results": [
       { "vendor_name": "CloudHost Inc", "total_spend": 125430.00 },
       ...
     ],
     "rowCount": 10,
     "timestamp": "2024-11-09T10:30:00Z"
   }
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 7. FRONTEND RENDERING                                                │
└─────────────────────────────────────────────────────────────────────┘
   
   ChatWithData.tsx renders the response:
   
   <div className="bg-white rounded-lg shadow">
     {/* 7a. Question Display */}
     <div className="bg-gray-50 px-6 py-4 border-b">
       <h3>Question:</h3>
       <p>{response.question}</p>
       <p className="text-xs">{new Date(response.timestamp).toLocaleString()}</p>
     </div>
     
     {/* 7b. Generated SQL */}
     <div className="px-6 py-4 border-b">
       <h3>Generated SQL:</h3>
       <code className="text-green-400">{response.sql}</code>
     </div>
     
     {/* 7c. Results Table */}
     <div className="px-6 py-4">
       <h3>Results ({response.rowCount} rows)</h3>
       <table>
         <thead>
           <tr>
             {Object.keys(response.results[0]).map(key => (
               <th>{key}</th>
             ))}
           </tr>
         </thead>
         <tbody>
           {response.results.map(row => (
             <tr>
               {Object.values(row).map(value => (
                 <td>{value}</td>
               ))}
             </tr>
           ))}
         </tbody>
       </table>
     </div>
   </div>
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 8. AUTO-CHART VISUALIZATION (NEW FEATURE!)                          │
└─────────────────────────────────────────────────────────────────────┘
   
   User clicks "Show Chart" button:
   
   const generateChartConfig = (data: any[]): ChartConfig | null => {
     // Detect columns
     const keys = Object.keys(data[0]);
     
     // Find label column (strings, names, dates)
     const labelKey = keys.find(k => 
       typeof data[0][k] === 'string' || 
       k.includes('name') || 
       k.includes('date')
     );
     
     // Find numeric columns
     const valueKeys = keys.filter(k => 
       k !== labelKey && typeof data[0][k] === 'number'
     );
     
     // Choose chart type
     const chartType = 
       data.length <= 6 ? 'pie' :         // Small dataset → Pie
       valueKeys.some(k => k.includes('trend')) ? 'line' :  // Trends → Line
       'bar';                              // Default → Bar
     
     return {
       type: chartType,
       labels: data.map(row => row[labelKey]),
       datasets: valueKeys.map(key => ({
         label: key.replace(/_/g, ' ').toUpperCase(),
         data: data.map(row => row[key]),
         backgroundColor: 'rgba(27, 20, 100, 0.8)',
       }))
     };
   };
   
   Renders Bar/Line/Pie chart using Chart.js
   
   ↓
   
┌─────────────────────────────────────────────────────────────────────┐
│ 9. PERSISTENCE & EXPORT                                              │
└─────────────────────────────────────────────────────────────────────┘
   
   // Save to localStorage (automatic)
   useEffect(() => {
     if (responses.length > 0) {
       localStorage.setItem(
         'flowbit_chat_history',
         JSON.stringify(responses.slice(0, 50))  // Keep last 50
       );
     }
   }, [responses]);
   
   // CSV Export (on button click)
   const exportToCSV = (response: ChatResponse) => {
     const headers = Object.keys(response.results[0]);
     const csvRows = [
       headers.join(','),
       ...response.results.map(row => 
         headers.map(h => {
           const val = String(row[h]);
           return val.includes(',') ? `"${val}"` : val;
         }).join(',')
       )
     ];
     
     const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = `results_${Date.now()}.csv`;
     link.click();
   };
```

---

## 🔍 Detailed Component Breakdown

### 1. Frontend Component (ChatWithData.tsx)

**Location**: `apps/web/src/components/ChatWithData.tsx`

**Key Features**:
- Question input with example questions
- Loading states during query processing
- Error handling with user-friendly messages
- Response history display
- Auto-chart generation
- CSV export functionality
- Persistent history (localStorage)
- Clear history option

**State Management**:
```typescript
const [question, setQuestion] = useState('');           // Current question
const [responses, setResponses] = useState<ChatResponse[]>([]);  // History
const [loading, setLoading] = useState(false);          // Loading state
const [error, setError] = useState<string | null>(null); // Error state
const [showCharts, setShowCharts] = useState<{ [key: number]: boolean }>({}); // Chart visibility
```

**Lifecycle**:
1. **Mount**: Load chat history from localStorage
2. **Question Submit**: Send to API, update responses, save to localStorage
3. **Chart Toggle**: Generate and display chart for specific response
4. **CSV Export**: Convert results to CSV and download
5. **Clear History**: Remove all responses and clear localStorage

---

### 2. Backend API Proxy

**Location**: `apps/api/src/index.ts` (or `routes/chat.ts`)

**Purpose**: 
- Acts as middleware between frontend and Vanna AI
- Provides unified error handling
- Can add authentication/rate limiting later
- Keeps Vanna AI service URL hidden from client

**Implementation**:
```typescript
import axios from 'axios';

app.post('/api/chat', async (req, res) => {
  const { question } = req.body;
  
  // Validation
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Valid question is required' });
  }
  
  try {
    // Forward to Vanna AI
    const vannaResponse = await axios.post(
      `${process.env.VANNA_API_BASE_URL}/chat`,
      { question },
      { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // Return response
    res.json(vannaResponse.data);
    
  } catch (error) {
    console.error('Vanna AI error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI service unavailable',
        details: 'Please try again later'
      });
    }
    
    res.status(500).json({
      error: 'Failed to process question',
      details: error.response?.data?.detail || error.message
    });
  }
});
```

---

### 3. Vanna AI Service (Python FastAPI)

**Location**: `services/vanna/main.py`

**Core Functionality**:

#### Initialization
```python
from vanna.groq import Groq_Chat as Vanna
import psycopg

# Initialize Vanna with Groq LLM
vn = Vanna(
    model='llama-3.3-70b-versatile',
    api_key=os.getenv('GROQ_API_KEY')
)

# Set database connection
vn.connect_to_postgres(
    host=db_host,
    dbname=db_name,
    user=db_user,
    password=db_password,
    port=db_port
)
```

#### Schema Training (on startup)
```python
@app.on_event("startup")
async def train_vanna():
    # Train Vanna with database schema
    tables = ['customers', 'vendors', 'invoices', 'line_items', 'payments']
    
    for table in tables:
        ddl = get_table_ddl(table)  # Get CREATE TABLE statement
        vn.train(ddl=ddl)
    
    # Add sample queries for better context
    vn.train(
        question="What are the top vendors?",
        sql="SELECT name, SUM(total) FROM vendors v JOIN invoices i ON v.id = i.vendor_id GROUP BY name ORDER BY SUM(total) DESC"
    )
```

#### Chat Endpoint
```python
@app.post("/chat")
async def chat(request: ChatRequest):
    question = request.question
    
    try:
        # Step 1: Generate SQL using Groq LLM
        sql = vn.generate_sql(question)
        
        # Step 2: Execute SQL
        results = vn.run_sql(sql)
        
        # Step 3: Convert to list of dicts
        if results:
            columns = [desc[0] for desc in results.cursor.description]
            results_list = [dict(zip(columns, row)) for row in results]
        else:
            results_list = []
        
        # Step 4: Return response
        return {
            "question": question,
            "sql": sql,
            "results": results_list,
            "rowCount": len(results_list),
            "executionTime": time.time() - start_time
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )
```

---

### 4. Groq LLM Integration

**How Vanna Uses Groq**:

1. **Context Building**: Vanna sends the database schema + question to Groq
2. **Prompt Engineering**: Vanna formats the prompt for SQL generation
3. **LLM Response**: Groq returns SQL query
4. **Validation**: Vanna validates SQL syntax
5. **Execution**: Query is run against PostgreSQL

**Example Prompt to Groq**:
```
You are a PostgreSQL expert. Given the following database schema:

Table: vendors
- id: UUID (Primary Key)
- name: VARCHAR(255)
- email: VARCHAR(255)
- category: VARCHAR(100)
- created_at: TIMESTAMP

Table: invoices
- id: UUID (Primary Key)
- vendor_id: UUID (Foreign Key → vendors.id)
- total: DECIMAL(12,2)
- issue_date: TIMESTAMP
- status: VARCHAR(20)

Generate a PostgreSQL query to answer: "What are the top 10 vendors by total spend?"

Requirements:
- Use proper JOINs
- Include column aliases
- Use SUM for aggregation
- ORDER BY descending
- LIMIT to 10 results

Return ONLY the SQL query, no explanation.
```

**Groq Response**:
```sql
SELECT 
  v.name as vendor_name,
  SUM(i.total) as total_spend
FROM vendors v
JOIN invoices i ON v.id = i.vendor_id
GROUP BY v.name
ORDER BY total_spend DESC
LIMIT 10
```

---

## 📊 Auto-Chart Feature Workflow

### Chart Generation Logic

```typescript
const generateChartConfig = (data: any[]): ChartConfig | null => {
  if (!data || data.length === 0) return null;
  
  const keys = Object.keys(data[0]);
  if (keys.length < 2) return null;  // Need at least 2 columns
  
  // 1. Identify label column (categorical data)
  const labelKey = keys.find(k => 
    typeof data[0][k] === 'string' ||           // String values
    k.toLowerCase().includes('name') ||         // Name columns
    k.toLowerCase().includes('vendor') ||       // Vendor columns
    k.toLowerCase().includes('category') ||     // Category columns
    k.toLowerCase().includes('month') ||        // Time columns
    k.toLowerCase().includes('date')
  ) || keys[0];  // Default to first column
  
  // 2. Identify value columns (numeric data)
  const valueKeys = keys.filter(k => 
    k !== labelKey &&                           // Not the label
    typeof data[0][k] === 'number'             // Numeric values
  );
  
  if (valueKeys.length === 0) return null;      // No numeric data
  
  // 3. Extract labels and data
  const labels = data.map(row => String(row[labelKey])).slice(0, 15);  // Max 15 items
  
  // 4. Create datasets
  const colors = [
    'rgba(27, 20, 100, 0.8)',    // Dark violet
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(168, 85, 247, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(251, 146, 60, 0.8)',   // Orange
  ];
  
  const datasets = valueKeys.map((key, idx) => ({
    label: key.replace(/_/g, ' ').toUpperCase(),
    data: data.slice(0, 15).map(row => Number(row[key]) || 0),
    backgroundColor: colors[idx % colors.length],
    borderColor: colors[idx % colors.length].replace('0.8', '1'),
    borderWidth: 2,
  }));
  
  // 5. Choose chart type
  const chartType: 'bar' | 'line' | 'pie' = 
    data.length <= 6 ? 'pie' :                  // Small dataset → Pie chart
    valueKeys.some(k => 
      k.includes('trend') || 
      k.includes('time') || 
      k.includes('date')
    ) ? 'line' :                                // Time series → Line chart
    'bar';                                      // Default → Bar chart
  
  return { type: chartType, labels, datasets };
};
```

### Chart Rendering

```typescript
// When user clicks "Show Chart"
{showCharts[idx] && (() => {
  const chartConfig = generateChartConfig(response.results);
  if (!chartConfig) return null;
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: response.question,
        font: { size: 14, weight: 'bold' as const }
      },
    },
    scales: chartConfig.type !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            // Format currency values
            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
            return '$' + value;
          }
        }
      }
    } : undefined,
  };
  
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div style={{ maxWidth: '800px', margin: '0 auto', height: '400px' }}>
        {chartConfig.type === 'bar' && <Bar data={chartConfig} options={chartOptions} />}
        {chartConfig.type === 'line' && <Line data={chartConfig} options={chartOptions} />}
        {chartConfig.type === 'pie' && <Pie data={chartConfig} options={chartOptions} />}
      </div>
    </div>
  );
})()}
```

---

## 🔐 Security Considerations

### SQL Injection Prevention
- ✅ **Vanna AI validates SQL** before execution
- ✅ **Parameterized queries** used by database driver
- ✅ **Read-only database user** for Vanna service (recommended)
- ✅ **Query timeout** prevents long-running queries

### API Security
- ✅ **CORS configured** for specific frontend origin
- ✅ **Rate limiting** should be added in production
- ✅ **Input validation** on all endpoints
- ✅ **Error messages** don't expose sensitive info

### Data Privacy
- ✅ **No personal data** in example questions
- ✅ **Query results** limited to 1000 rows (configurable)
- ✅ **Groq API key** never exposed to frontend
- ✅ **Database URL** only in backend services

---

## 🚀 Performance Optimization

### Frontend
- **Debounce input**: Prevent excessive API calls
- **Virtual scrolling**: For large result sets
- **Chart memoization**: Cache chart configs
- **Lazy loading**: Load Chart.js only when needed

### Backend
- **Connection pooling**: Reuse database connections
- **Response caching**: Cache common queries (60s TTL)
- **Timeout handling**: 30s limit for AI queries
- **Error recovery**: Retry failed LLM calls

### Vanna AI Service
- **Schema caching**: Load once on startup
- **Query caching**: Cache LLM responses (TODO)
- **Connection pooling**: psycopg pool for PostgreSQL
- **Warm-up**: Keep service active (paid hosting)

---

## 📈 Monitoring & Debugging

### Logging

**Frontend** (Browser Console):
```typescript
console.log('Chat query started:', question);
console.log('API response:', response);
console.error('Chat error:', error);
```

**Backend** (Server Logs):
```typescript
console.log(`Chat request: ${question}`);
console.log(`Vanna response time: ${duration}ms`);
console.error(`Vanna error: ${error.message}`);
```

**Vanna AI** (Python Logs):
```python
logger.info(f"Processing question: {question}")
logger.info(f"Generated SQL: {sql}")
logger.info(f"Query executed in {execution_time}s")
logger.error(f"Error: {str(e)}")
```

### Health Checks

```bash
# Check Vanna AI service
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "llm": "operational",
  "timestamp": "2024-11-09T10:30:00Z"
}
```

---

## 🎯 Example Queries

### Simple Aggregations
- "How many invoices are there?"
- "What is the total spending?"
- "How many vendors do we have?"

### Top N Queries
- "Show me the top 10 vendors by total spend"
- "What are the top 5 categories by spending?"
- "List the 10 highest invoices"

### Time-Based Queries
- "Show me monthly spending for the last 6 months"
- "How many invoices were issued in November?"
- "What's the spending trend over time?"

### Filtered Queries
- "Show me all overdue invoices"
- "Which vendors have more than 10 invoices?"
- "List all invoices over $10,000"

### Complex Queries
- "What percentage of invoices are paid on time?"
- "Show me average invoice amount by category"
- "Compare spending between Q3 and Q4"

---

## 🐛 Troubleshooting

### Common Issues

**1. "AI service unavailable"**
- Check Vanna AI service is running: `curl http://localhost:8000/health`
- Verify `VANNA_API_BASE_URL` in backend .env
- Check Groq API key is valid

**2. "Failed to generate SQL"**
- Check Groq API quota (14,400 requests/day free)
- Verify database schema is loaded (check Vanna logs)
- Try rephrasing the question

**3. "Query timeout"**
- Query too complex or slow
- Database not indexed properly
- Increase timeout in frontend (current: 30s)

**4. Chart not showing**
- Click "Show Chart" button
- Ensure results have numeric columns
- Check browser console for errors

**5. History not persisting**
- Check localStorage is enabled
- Clear browser cache and reload
- Max 50 queries stored (FIFO)

---

**Workflow Documentation Complete** ✅

This system provides a powerful, user-friendly interface for data analysis without requiring SQL knowledge!
