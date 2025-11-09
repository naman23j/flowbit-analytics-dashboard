import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const trendsRouter = Router();

/**
 * GET /api/invoice-trends
 * Returns monthly invoice count and spend trends
 */
trendsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { months = '12' } = req.query;
    const monthsNum = parseInt(months as string);

    console.log(`Fetching invoice trends for last ${monthsNum} months...`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    // Fetch all invoices within date range
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        issueDate: true,
        totalAmount: true,
      },
      orderBy: {
        issueDate: 'asc',
      },
    });

    // Group by month and calculate totals
    const monthlyData = new Map<string, { count: number; totalSpend: number }>();

    invoices.forEach((invoice) => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyData.get(monthKey) || { count: 0, totalSpend: 0 };
      monthlyData.set(monthKey, {
        count: existing.count + 1,
        totalSpend: existing.totalSpend + invoice.totalAmount,
      });
    });

    // Convert to array and format
    const trends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        invoiceCount: data.count,
        totalSpend: Math.round(data.totalSpend * 100) / 100,
        avgInvoiceValue: Math.round((data.totalSpend / data.count) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log(`✅ Generated trends for ${trends.length} months`);
    res.json(trends);
  } catch (error) {
    console.error('❌ Error fetching invoice trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
