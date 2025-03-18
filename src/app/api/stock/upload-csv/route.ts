import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'File and type are required' },
        { status: 400 }
      );
    }

    const text = await file.text();
    console.log('Raw CSV content:', text.substring(0, 500)); // Log the first 500 chars of CSV

    const { data } = Papa.parse(text, { 
      header: true,
      skipEmptyLines: true
    });

    console.log('Parsed CSV data first row:', data[0]); // Log the first row after parsing

    if (type === 'gilmours') {
      // Process Gilmours CSV
      for (const row of data) {
        const item = row as any;
        console.log('Processing row:', item); // Log each row being processed
        console.log('SKU value:', item['SKU']); // Specifically log the SKU value

        if (!item['SKU']) {
          console.error('Missing SKU for row:', item);
          continue;
        }

        await prisma.gilmoursItem.upsert({
          where: { sku: item['SKU'] },
          update: {
            purchaseDate: item['Purchase date'],
            brand: item['Brand'],
            productDescription: item['Product description'],
            packSize: item['Pack size'],
            uom: item['UoM'],
            price: item['Price'],
            qty: item['Qty'],
            accountName: item['Account name'],
          },
          create: {
            sku: item['SKU'],
            purchaseDate: item['Purchase date'],
            brand: item['Brand'],
            productDescription: item['Product description'],
            packSize: item['Pack size'],
            uom: item['UoM'],
            price: item['Price'],
            qty: item['Qty'],
            accountName: item['Account name'],
          },
        });
      }
    } else if (type === 'bidfood') {
      // Process Bidfood CSV
      for (const row of data) {
        const item = row as any;
        await prisma.bidfoodItem.upsert({
          where: { productCode: item['Product Code'] },
          update: {
            brand: item['Brand'],
            description: item['Description'],
            packSize: item['Pack Size'],
            ctnQty: item['Ctn Qty'],
            uom: item['UOM'],
            qty: item['Qty'],
            lastPricePaid: item['Last Price Paid'],
            totalExGst: item['Total ex GST'],
            account: item['Account'],
            contains: item['Contains'],
          },
          create: {
            productCode: item['Product Code'],
            brand: item['Brand'],
            description: item['Description'],
            packSize: item['Pack Size'],
            ctnQty: item['Ctn Qty'],
            uom: item['UOM'],
            qty: item['Qty'],
            lastPricePaid: item['Last Price Paid'],
            totalExGst: item['Total ex GST'],
            account: item['Account'],
            contains: item['Contains'],
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid type specified' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 