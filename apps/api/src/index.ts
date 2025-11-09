import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { statsRouter } from './routes/stats';
import { invoicesRouter } from './routes/invoices';
import { vendorsRouter } from './routes/vendors';
import { trendsRouter } from './routes/trends';
import { categoryRouter } from './routes/categories';
import { cashflowRouter } from './routes/cashflow';
import { chatRouter } from './routes/chat';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/stats', statsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/invoice-trends', trendsRouter);
app.use('/api/category-spend', categoryRouter);
app.use('/api/cash-outflow', cashflowRouter);
app.use('/api/chat-with-data', chatRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

export default app;
