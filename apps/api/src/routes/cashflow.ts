import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const cashflowRouter = Router();

/**
 * GET /api/cash-outflow
 * Returns expected cash outflow forecast based on due dates
 */
cashflowRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { months = '6' } = req.query;
    const monthsNum = parseInt(months as string);

    console.log(`Fetching cash outflow forecast for next ${monthsNum} months...`);

    // Calculate date range (past months for historical data)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    // Fetch all invoices in the date range (including paid for complete picture)
    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        dueDate: true,
        totalAmount: true,
        status: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Group by month
    const monthlyOutflow = new Map<string, { expected: number; overdue: number }>();

    invoices.forEach((invoice) => {
      if (!invoice.dueDate) return;
      
      const date = new Date(invoice.dueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyOutflow.get(monthKey) || { expected: 0, overdue: 0 };
      
      // Count all as expected outflow (historical data)
      if (invoice.status === 'overdue' || invoice.status === 'pending') {
        existing.expected += invoice.totalAmount;
      } else if (invoice.status === 'paid') {
        existing.expected += invoice.totalAmount;
      }
      
      monthlyOutflow.set(monthKey, existing);
    });

    // Convert to array and format
    const forecast = Array.from(monthlyOutflow.entries())
      .map(([month, data]) => ({
        month,
        expectedOutflow: Math.round(data.expected * 100) / 100,
        overdueAmount: Math.round(data.overdue * 100) / 100,
        totalOutflow: Math.round((data.expected + data.overdue) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log(`✅ Generated cash outflow forecast for ${forecast.length} months`);
    res.json(forecast);
  } catch (error) {
    console.error('❌ Error fetching cash outflow:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cash outflow forecast',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
