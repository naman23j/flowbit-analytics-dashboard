import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RawInvoiceData {
  _id: string;
  name: string;
  status: string;
  extractedData: {
    llmData: {
      invoice?: {
        value?: {
          invoiceId?: { value?: string };
          invoiceDate?: { value?: string };
          deliveryDate?: { value?: string };
        };
      };
      vendor?: {
        value?: {
          vendorName?: { value?: string };
          vendorAddress?: { value?: string };
          vendorTaxId?: { value?: string };
          vendorPartyNumber?: { value?: string };
        };
      };
      customer?: {
        value?: {
          customerName?: { value?: string };
          customerAddress?: { value?: string };
        };
      };
      payment?: {
        value?: {
          dueDate?: { value?: string };
          paymentTerms?: { value?: string };
          bankAccountNumber?: { value?: string };
        };
      };
      summary?: {
        value?: {
          subTotal?: { value?: number };
          totalTax?: { value?: number };
          invoiceTotal?: { value?: number };
        };
      };
      lineItems?: {
        value?: {
          items?: {
            value?: Array<{
              srNo?: { value?: number };
              description?: { value?: string };
              quantity?: { value?: number };
              unitPrice?: { value?: number };
              totalPrice?: { value?: number };
              Sachkonto?: { value?: string };
            }>;
          };
        };
      };
    };
  };
}

// Helper function to safely extract values from nested structure
function extractValue<T>(obj: any, defaultValue: T): T {
  return obj?.value !== undefined && obj.value !== null && obj.value !== '' ? obj.value : defaultValue;
}

// Helper function to parse address into components
function parseAddress(address: string): { address: string; city: string; state: string; zipCode: string; country: string } {
  const parts = address.split(',').map(s => s.trim());
  return {
    address: parts[0] || '',
    city: parts[1] || '',
    state: '',
    zipCode: parts[2]?.match(/\d+/)?.[0] || '',
    country: parts[parts.length - 1] || '',
  };
}

// Helper function to determine invoice status
function determineStatus(invoiceDate: Date, dueDate: Date | null, paymentDate: Date | null): string {
  if (paymentDate) return 'paid';
  if (!dueDate) return 'pending';
  if (new Date() > dueDate) return 'overdue';
  return 'pending';
}

// Helper function to categorize invoice
function categorizeInvoice(description: string, vendorName: string): string {
  const desc = description.toLowerCase();
  const vendor = vendorName.toLowerCase();
  
  // Marketing related
  if (desc.includes('marketing') || desc.includes('advertising') || desc.includes('campaign') || 
      desc.includes('social media') || desc.includes('branding') || vendor.includes('marketing')) {
    return 'Marketing';
  }
  
  // Facilities related
  if (desc.includes('facility') || desc.includes('rent') || desc.includes('utilities') || 
      desc.includes('maintenance') || desc.includes('cleaning') || desc.includes('building') ||
      vendor.includes('facility') || vendor.includes('property')) {
    return 'Facilities';
  }
  
  // Operations related (default for business operations)
  if (desc.includes('software') || desc.includes('license') || desc.includes('service') ||
      desc.includes('consulting') || desc.includes('equipment') || desc.includes('supply') ||
      desc.includes('hardware') || desc.includes('office') || desc.includes('it')) {
    return 'Operations';
  }
  
  // Distribute remaining randomly between the three categories for variety
  const categories = ['Operations', 'Marketing', 'Facilities'];
  return categories[Math.floor(Math.random() * categories.length)];
}

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Read the JSON data file
    const dataPath = path.join(__dirname, '../../../data/Analytics_Test_Data.json');
    console.log(`📄 Reading data from: ${dataPath}`);
    
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const rawInvoices: RawInvoiceData[] = JSON.parse(rawData);

    console.log(`📊 Found ${rawInvoices.length} invoices to process`);

    // Clear existing data (optional - remove if you want to preserve data)
    console.log('🗑️  Clearing existing data...');
    await prisma.payment.deleteMany();
    await prisma.lineItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.vendor.deleteMany();

    // Keep track of created vendors and customers to avoid duplicates
    const vendorMap = new Map<string, string>(); // name -> id
    const customerMap = new Map<string, string>(); // name -> id

    let processedCount = 0;
    let skippedCount = 0;

    for (const rawInvoice of rawInvoices) {
      try {
        const llmData = rawInvoice.extractedData?.llmData;
        
        // Extract vendor information
        const vendorName = extractValue(llmData?.vendor?.value?.vendorName, 'Unknown Vendor');
        const vendorAddress = extractValue(llmData?.vendor?.value?.vendorAddress, '');
        const vendorTaxId = extractValue(llmData?.vendor?.value?.vendorTaxId, null);
        
        // Extract customer information
        const customerName = extractValue(llmData?.customer?.value?.customerName, null);
        const customerAddress = extractValue(llmData?.customer?.value?.customerAddress, '');
        
        // Extract invoice information
        const invoiceId = extractValue(llmData?.invoice?.value?.invoiceId, rawInvoice._id);
        const invoiceDate = extractValue(llmData?.invoice?.value?.invoiceDate, null);
        const dueDate = extractValue(llmData?.payment?.value?.dueDate, null);
        
        // Extract financial information
        const subTotal = Math.abs(extractValue(llmData?.summary?.value?.subTotal, 0));
        const totalTax = Math.abs(extractValue(llmData?.summary?.value?.totalTax, 0));
        const invoiceTotal = Math.abs(extractValue(llmData?.summary?.value?.invoiceTotal, 0));
        
        // Skip if critical data is missing
        if (!vendorName || !invoiceId || !invoiceDate || invoiceTotal === 0) {
          console.log(`⚠️  Skipping invoice ${rawInvoice._id} - missing critical data`);
          skippedCount++;
          continue;
        }

        console.log(`\n📝 Processing invoice: ${invoiceId} (${vendorName})`);

        // Create or get vendor
        let vendorId = vendorMap.get(vendorName);
        if (!vendorId) {
          console.log(`  👤 Creating vendor: ${vendorName}`);
          const addressParts = vendorAddress ? parseAddress(vendorAddress) : {
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          };
          
          const vendor = await prisma.vendor.create({
            data: {
              name: vendorName,
              address: addressParts.address || vendorAddress,
              city: addressParts.city,
              state: addressParts.state,
              zipCode: addressParts.zipCode,
              country: addressParts.country,
              taxId: vendorTaxId,
            },
          });
          vendorId = vendor.id;
          vendorMap.set(vendorName, vendorId);
        }

        // Create or get customer (if exists)
        let customerId: string | undefined;
        if (customerName) {
          customerId = customerMap.get(customerName);
          if (!customerId) {
            console.log(`  👥 Creating customer: ${customerName}`);
            const addressParts = customerAddress ? parseAddress(customerAddress) : {
              address: '',
              city: '',
              state: '',
              zipCode: '',
              country: '',
            };
            
            const customer = await prisma.customer.create({
              data: {
                name: customerName,
                address: addressParts.address || customerAddress,
                city: addressParts.city,
                state: addressParts.state,
                zipCode: addressParts.zipCode,
                country: addressParts.country,
              },
            });
            customerId = customer.id;
            customerMap.set(customerName, customerId);
          }
        }

        // Extract line items
        const lineItemsData = llmData?.lineItems?.value?.items?.value || [];
        const lineItems = lineItemsData
          .filter((item: any) => item.description?.value && item.quantity?.value && item.unitPrice?.value)
          .map((item: any) => ({
            description: extractValue(item.description, 'Item'),
            quantity: Math.abs(extractValue(item.quantity, 1)),
            unitPrice: Math.abs(extractValue(item.unitPrice, 0)),
            amount: Math.abs(extractValue(item.totalPrice, 0)),
            category: extractValue(item.Sachkonto, null),
          }));

        // Determine invoice status
        const issueDateObj = new Date(invoiceDate);
        const dueDateObj = dueDate ? new Date(dueDate) : null;
        const status = determineStatus(issueDateObj, dueDateObj, null);

        // Categorize invoice
        const firstItemDesc = lineItems[0]?.description || '';
        const category = categorizeInvoice(firstItemDesc, vendorName);

        // Create invoice with line items
        console.log(`  📄 Creating invoice with ${lineItems.length} line items`);
        await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${invoiceId}`,
            vendorId,
            customerId,
            issueDate: issueDateObj,
            dueDate: dueDateObj,
            paymentDate: status === 'paid' ? issueDateObj : null,
            status,
            category,
            description: rawInvoice.name,
            totalAmount: subTotal,
            taxAmount: totalTax,
            discountAmount: 0,
            netAmount: invoiceTotal,
            lineItems: lineItems.length > 0 ? {
              create: lineItems,
            } : undefined,
          },
        });

        processedCount++;
        console.log(`  ✅ Invoice ${invoiceId} created successfully`);
      } catch (error) {
        console.error(`❌ Error processing invoice ${rawInvoice._id}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Seed completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Vendors: ${vendorMap.size}`);
    console.log(`   - Customers: ${customerMap.size}`);
    console.log(`   - Invoices processed: ${processedCount}`);
    console.log(`   - Invoices skipped: ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
