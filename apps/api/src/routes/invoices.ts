import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const invoicesRouter = Router();

/**
 * GET /api/invoices
 * Returns paginated list of invoices with search and filter capabilities
 */
invoicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search = '', 
      status = '',
      vendorId = '',
      sortBy = 'issueDate',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    console.log(`Fetching invoices (page: ${pageNum}, limit: ${limitNum})...`);

    // Build where clause for filters
    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { vendor: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    // Execute queries in parallel
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              lineItems: true,
              payments: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    console.log(`✅ Found ${invoices.length} invoices (total: ${totalCount})`);
    
    res.json({
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/invoices/:id
 * Returns a single invoice with full details
 */
invoicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching invoice ${id}...`);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        customer: true,
        lineItems: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    console.log(`✅ Invoice ${id} fetched successfully`);
    res.json(invoice);
  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
