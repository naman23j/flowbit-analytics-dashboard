import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const vendorsRouter = Router();

/**
 * GET /api/vendors/top10
 * Returns top 10 vendors by total spend
 */
vendorsRouter.get('/top10', async (req: Request, res: Response) => {
  try {
    console.log('Fetching top 10 vendors by spend...');

    // Group invoices by vendor and calculate total spend
    const topVendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { invoices: true },
        },
        invoices: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    // Calculate total spend per vendor and sort
    const vendorsWithSpend = topVendors
      .map((vendor: any) => ({
        id: vendor.id,
        name: vendor.name,
        invoiceCount: vendor._count.invoices,
        totalSpend: vendor.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0),
      }))
      .sort((a: any, b: any) => b.totalSpend - a.totalSpend)
      .slice(0, 10);

    console.log(`✅ Found ${vendorsWithSpend.length} top vendors`);
    res.json(vendorsWithSpend);
  } catch (error) {
    console.error('❌ Error fetching top vendors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top vendors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/vendors
 * Returns all vendors with optional search
 */
vendorsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    console.log(`Fetching vendors${search ? ` (search: "${search}")` : ''}...`);

    const vendors = await prisma.vendor.findMany({
      where: search ? {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      } : undefined,
      include: {
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    console.log(`✅ Found ${vendors.length} vendors`);
    res.json(vendors);
  } catch (error) {
    console.error('❌ Error fetching vendors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vendors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
