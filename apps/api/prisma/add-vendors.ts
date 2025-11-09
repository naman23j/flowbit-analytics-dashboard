import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoreInvoices() {
  try {
    console.log('🔄 Adding more vendor invoices...');

    // Get all vendors
    const vendors = await prisma.vendor.findMany();
    console.log(`Found ${vendors.length} vendors`);

    // Get a customer
    const customer = await prisma.customer.findFirst();
    
    // Add invoices for vendors without spend
    const invoicesData = [
      {
        vendorName: 'belegFuchs',
        amount: 2500.00,
        category: 'Operations',
        description: 'Software License - Annual Subscription'
      },
      {
        vendorName: 'Auto Teile Europa GmbH',
        amount: 3200.50,
        category: 'Facilities',
        description: 'Vehicle Fleet Maintenance'
      },
      {
        vendorName: 'pixa',
        amount: 1800.75,
        category: 'Marketing',
        description: 'Stock Photos and Graphics'
      },
      {
        vendorName: 'Taxon GmbH',
        amount: 4500.00,
        category: 'Operations',
        description: 'Tax Consulting Services Q4'
      },
      {
        vendorName: 'EasyFirma GmbH & Co KG',
        amount: 1950.25,
        category: 'Operations',
        description: 'Invoicing Software Subscription'
      },
      {
        vendorName: 'Muster GmbH',
        amount: 2750.00,
        category: 'Facilities',
        description: 'Office Furniture and Equipment'
      },
      {
        vendorName: 'ABC Seller',
        amount: 1600.00,
        category: 'Operations',
        description: 'Office Supplies and Materials'
      },
    ];

    for (const invoiceData of invoicesData) {
      const vendor = vendors.find(v => v.name === invoiceData.vendorName);
      if (!vendor) {
        console.log(`❌ Vendor not found: ${invoiceData.vendorName}`);
        continue;
      }

      const invoiceDate = new Date('2025-11-01');
      const dueDate = new Date('2025-12-01');

      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          vendorId: vendor.id,
          customerId: customer?.id,
          issueDate: invoiceDate,
          dueDate: dueDate,
          status: 'pending',
          category: invoiceData.category,
          description: invoiceData.description,
          totalAmount: invoiceData.amount,
          taxAmount: invoiceData.amount * 0.19, // 19% VAT
          discountAmount: 0,
          netAmount: invoiceData.amount * 1.19,
          lineItems: {
            create: [
              {
                description: invoiceData.description,
                quantity: 1,
                unitPrice: invoiceData.amount,
                amount: invoiceData.amount,
                category: invoiceData.category,
              },
            ],
          },
        },
      });

      console.log(`✅ Created invoice for ${invoiceData.vendorName}: €${invoiceData.amount}`);
    }

    console.log('🎉 Successfully added invoices for all vendors!');

  } catch (error) {
    console.error('❌ Error adding invoices:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMoreInvoices();
