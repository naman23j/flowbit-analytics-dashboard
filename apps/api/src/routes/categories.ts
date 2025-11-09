import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const categoryRouter = Router();

/**
 * GET /api/category-spend
 * Returns spending grouped by category
 */
categoryRouter.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Fetching category spend data...');

    // Fetch all invoices with categories
    const invoices = await prisma.invoice.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
        totalAmount: true,
      },
    });

    // Group by category and calculate totals
    const categorySpend = new Map<string, { totalSpend: number; count: number }>();

    invoices.forEach((invoice: { category: string | null; totalAmount: number }) => {
      const category = invoice.category || 'Uncategorized';
      const existing = categorySpend.get(category) || { totalSpend: 0, count: 0 };
      
      categorySpend.set(category, {
        totalSpend: existing.totalSpend + invoice.totalAmount,
        count: existing.count + 1,
      });
    });

    // Convert to array and format
    const categories = Array.from(categorySpend.entries())
      .map(([category, data]) => ({
        category,
        totalSpend: Math.round(data.totalSpend * 100) / 100,
        invoiceCount: data.count,
        percentage: 0, // Will calculate after we have total
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    // Calculate percentages
    const totalSpend = categories.reduce((sum, cat) => sum + cat.totalSpend, 0);
    categories.forEach((cat) => {
      cat.percentage = totalSpend > 0 
        ? Math.round((cat.totalSpend / totalSpend) * 10000) / 100 
        : 0;
    });

    console.log(`✅ Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching category spend:', error);
    res.status(500).json({ 
      error: 'Failed to fetch category spend',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
