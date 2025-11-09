import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const statsRouter = Router();

/**
 * GET /api/stats
 * Returns overview statistics for dashboard cards
 */
statsRouter.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Fetching overview statistics...');

    // TODO: Optimize with parallel queries
    const [
      totalInvoices,
      totalSpend,
      uniqueVendors,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
    ] = await Promise.all([
      // Total number of invoices
      prisma.invoice.count(),
      
      // Total spend (sum of all invoice amounts)
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
      }),
      
      // Unique vendors
      prisma.vendor.count(),
      
      // Pending invoices count
      prisma.invoice.count({
        where: { status: 'pending' },
      }),
      
      // Paid invoices count
      prisma.invoice.count({
        where: { status: 'paid' },
      }),
      
      // Overdue invoices count
      prisma.invoice.count({
        where: { status: 'overdue' },
      }),
    ]);

    // Calculate average invoice value
    const avgInvoiceValue = totalInvoices > 0 
      ? (totalSpend._sum.totalAmount || 0) / totalInvoices 
      : 0;

    const stats = {
      totalInvoices,
      totalSpend: totalSpend._sum.totalAmount || 0,
      uniqueVendors,
      avgInvoiceValue: Math.round(avgInvoiceValue * 100) / 100,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
    };

    console.log('✅ Statistics fetched successfully');
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
