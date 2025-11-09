import { Router, Request, Response } from 'express';
import axios from 'axios';

export const chatRouter = Router();

const VANNA_SERVICE_URL = process.env.VANNA_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/chat-with-data
 * Forwards user query to Vanna AI service and returns SQL + results
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Question is required and must be a string' 
      });
    }

    console.log(`💬 Processing chat query: "${question}"`);

    // Forward request to Vanna AI service
    const vannaResponse = await axios.post(
      `${VANNA_SERVICE_URL}/generate-sql`,
      { question },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { sql, results, error } = vannaResponse.data;

    if (error) {
      console.error('❌ Vanna AI returned error:', error);
      return res.status(400).json({
        error: 'Query processing failed',
        message: error,
      });
    }

    console.log(`✅ Query processed successfully, returned ${results?.length || 0} rows`);
    
    res.json({
      question,
      sql,
      results,
      rowCount: results?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error processing chat query:', error);
    
    // Handle axios-specific errors
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Vanna AI service unavailable',
          message: 'Unable to connect to the AI service. Please ensure it is running.',
        });
      }
      
      if (error.response) {
        return res.status(error.response.status).json({
          error: 'Vanna AI service error',
          message: error.response.data?.message || error.message,
        });
      }
    }

    res.status(500).json({ 
      error: 'Failed to process chat query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chat-with-data/health
 * Check if Vanna AI service is reachable
 */
chatRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${VANNA_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    
    res.json({
      vannaService: 'connected',
      status: response.data,
    });
  } catch (error) {
    res.status(503).json({
      vannaService: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
