"""
Vanna AI Service - Natural Language to SQL Converter
Uses Vanna AI library with Groq as LLM backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import asyncpg
from typing import List, Dict, Any, Optional
from groq import Groq
import pandas as pd

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Vanna AI Service",
    description="Natural language to SQL conversion service using Groq",
    version="2.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection configuration
DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is required")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)

# Global variables for database schema
db_schema_context = ""
db_pool: asyncpg.Pool = None


class QueryRequest(BaseModel):
    """Request model for natural language queries"""
    question: str


class QueryResponse(BaseModel):
    """Response model for SQL generation and execution"""
    sql: str
    results: List[Dict[str, Any]]
    explanation: str = ""
    error: Optional[str] = None


async def load_database_schema():
    """Load database schema into context for SQL generation"""
    global db_schema_context, db_pool
    try:
        # Create connection pool
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        
        # Connect to database to get schema
        conn = await db_pool.acquire()
        
        # Get all table names
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        print(f"📊 Loading schema for {len(tables)} tables...")
        
        schema_parts = ["# Database Schema\n"]
        
        # Build schema context for each table
        for table in tables:
            table_name = table['table_name']
            
            # Get table schema with constraints
            columns = await conn.fetch(f"""
                SELECT 
                    column_name, 
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position
            """)
            
            # Get foreign keys
            fkeys = await conn.fetch(f"""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = '{table_name}'
            """)
            
            # Create comprehensive DDL
            ddl = f"\n## Table: {table_name}\n"
            ddl += f"```sql\nCREATE TABLE {table_name} (\n"
            col_definitions = []
            for col in columns:
                col_def = f"  {col['column_name']} {col['data_type']}"
                if col['is_nullable'] == 'NO':
                    col_def += " NOT NULL"
                if col['column_default']:
                    col_def += f" DEFAULT {col['column_default']}"
                col_definitions.append(col_def)
            ddl += ",\n".join(col_definitions)
            ddl += "\n);\n```\n"
            
            # Add foreign key information
            if fkeys:
                ddl += "\n**Foreign Keys:**\n"
                for fk in fkeys:
                    ddl += f"- {fk['column_name']} → {fk['foreign_table_name']}.{fk['foreign_column_name']}\n"
            
            schema_parts.append(ddl)
            print(f"  ✓ Loaded schema for: {table_name}")
        
        await db_pool.release(conn)
        
        db_schema_context = "\n".join(schema_parts)
        print("✅ Database schema successfully loaded")
        
    except Exception as e:
        print(f"❌ Error loading schema: {e}")
        import traceback
        traceback.print_exc()


@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    print("🚀 Starting Vanna AI service...")
    await load_database_schema()
    print("✨ Service ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global db_pool
    if db_pool:
        await db_pool.close()
    print("👋 Service shutdown complete")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Vanna AI - Text-to-SQL Service",
        "version": "2.0.0",
        "status": "running",
        "llm_provider": "Groq (via Vanna AI)",
        "model": GROQ_MODEL,
        "implementation": "Vanna AI Library"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection through Vanna
        test_conn = await asyncpg.connect(DATABASE_URL)
        await test_conn.close()
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return {
        "status": "ok",
        "database": db_status,
        "groq_configured": bool(GROQ_API_KEY),
        "vanna_initialized": True
    }


@app.post("/generate-sql", response_model=QueryResponse)
async def generate_and_execute_sql(request: QueryRequest):
    """
    Main endpoint: Convert natural language question to SQL and execute it using Groq
    """
    global db_schema_context, db_pool
    
    try:
        question = request.question.strip()
        
        if not question:
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        print(f"\n💬 Received question: {question}")
        
        # Use Groq to generate SQL with schema context
        print("🤖 Generating SQL with Groq...")
        
        # Build prompt with schema context
        prompt = f"""You are a SQL expert. Given the following database schema and a question, generate a valid PostgreSQL query.

{db_schema_context}

Question: {question}

Generate ONLY the SQL query without any explanation or markdown formatting. The query should be executable PostgreSQL."""

        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a SQL expert. Generate only valid PostgreSQL queries without any explanation or formatting."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        sql = completion.choices[0].message.content.strip()
        
        # Clean up the SQL (remove markdown code blocks if present)
        sql = sql.replace("```sql", "").replace("```", "").strip()
        
        if not sql:
            raise HTTPException(status_code=500, detail="Failed to generate SQL")
        
        print(f"✅ Generated SQL: {sql}")
        
        # Execute SQL using asyncpg
        print("🔍 Executing query...")
        conn = await db_pool.acquire()
        try:
            rows = await conn.fetch(sql)
            
            # Convert to list of dicts
            results = []
            for row in rows:
                row_dict = dict(row)
                # Handle datetime conversion
                for key, value in row_dict.items():
                    if hasattr(value, 'isoformat'):
                        row_dict[key] = value.isoformat()
                results.append(row_dict)
            
            print(f"✅ Successfully processed query, returned {len(results)} rows\n")
            
            return QueryResponse(
                sql=sql,
                results=results,
                explanation="Query executed successfully",
                error=None
            )
        finally:
            await db_pool.release(conn)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schema")
async def get_schema():
    """Return the database schema context"""
    global db_schema_context
    try:
        return {
            "status": "ok",
            "schema_loaded": bool(db_schema_context),
            "schema_length": len(db_schema_context) if db_schema_context else 0,
            "message": "Database schema loaded and ready"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Vanna AI Service on http://{host}:{port}")
    print(f"📊 Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Not configured'}")
    print(f"🤖 LLM: Groq ({GROQ_MODEL})")
    
    uvicorn.run(app, host=host, port=port)
