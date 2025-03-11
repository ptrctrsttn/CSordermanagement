import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
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

    console.log('Processing file upload:', {
      type,
      fileName: file.name,
      fileSize: file.size,
    });

    const text = await file.text();
    console.log('Raw CSV content:', text.substring(0, 500));

    const result = Papa.parse(text, { 
      header: true,
      skipEmptyLines: true
    });

    if (result.data.length > 0 && typeof result.data[0] === 'object') {
      console.log('CSV Parse Results:', {
        totalRows: result.data.length,
        headers: Object.keys(result.data[0] as object),
        firstFewRows: result.data.slice(0, 5)
      });
    } else {
      console.error('No valid data rows found in CSV');
      return NextResponse.json({ error: 'No valid data rows found in CSV' }, { status: 400 });
    }

    switch (type) {
      case 'product-list':
        await handleProductListUpload(result.data);
        break;
      case 'products':
        await handleProductsUpload(result.data);
        break;
      case 'stock':
        await handleStockUpload(result.data);
        break;
      case 'gilmours':
      case 'bidfood':
      case 'other':
        await handleIngredientsUpload(result.data, type.toUpperCase());
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid upload type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleProductListUpload(records: any[]) {
  console.log('Processing product list upload...');
  
  for (const record of records) {
    try {
      const productData = {
        addon: record.addon || '',
        handle: record.Handle || '',
        totalCost: record.totalCost || null,
        listOfIng: record['list of ing'] || null,
        meat1: record.Meat1 || null,
        meat2: record.Meat2 || null,
        option1: record.option1 || null,
        option2: record.option2 || null,
        serveware: record.Searveware || null,
        timerA: record['Timer A'] || null,
        timerB: record['Timer B'] || null,
        skuSearch: record.SKUSEARCH || null,
        variantSku: record.VariantSKU || ''
      };

      console.log('Creating product list item:', productData);

      await prisma.productList.create({
        data: productData
      });

      console.log('Successfully created product list item:', record.Handle);
    } catch (error: any) {
      console.error('Error processing product:', {
        product: record.Handle,
        error: error.toString(),
        data: record
      });
    }
  }
}

async function handleProductsUpload(records: any[]) {
  console.log('Processing products upload...');
  
  for (const record of records) {
    if (!record.Handle) {
      console.log('Skipping record without Handle:', record);
      continue;
    }

    try {
      const productData = {
        name: record.Handle.trim(),
        sku: record.VariantSKU?.trim() || record.SKU?.trim() || null,
        price: parseFloat(record.Price || '0') || 0
      };

      console.log('Attempting to create product:', productData);

      await prisma.product.create({
        data: productData
      });

      console.log('Successfully created product:', productData.name);
    } catch (error: any) {
      console.error('Error creating product:', {
        product: record.Handle,
        error: error.toString(),
        data: record
      });
    }
  }
}

async function handleStockUpload(records: any[]) {
  console.log('Processing stock items upload...');
  
  for (const record of records) {
    console.log('Processing record:', record);
    
    if (!record.name) {
      console.error('Missing required field "name":', record);
      continue;
    }

    try {
      await prisma.stockItem.upsert({
        where: { 
          name: record.name.trim()
        },
        update: { 
          description: record.description?.trim()
        },
        create: { 
          name: record.name.trim(),
          description: record.description?.trim()
        },
      });
      console.log('Successfully processed stock item:', record.name);
    } catch (error) {
      console.error('Error processing stock item:', record.name, error);
      throw error;
    }
  }
}

async function handleIngredientsUpload(records: any[], supplierType: string) {
  console.log('Processing ingredients upload for supplier:', supplierType);
  
  // First ensure supplier exists
  const supplier = await prisma.supplier.upsert({
    where: { 
      name: supplierType
    },
    update: {},
    create: {
      name: supplierType,
      type: supplierType as 'GILMOURS' | 'BIDFOOD' | 'OTHER',
    },
  });

  for (const record of records) {
    console.log('Processing record:', record);
    
    // Validate required fields
    if (!record.name || !record.unit) {
      console.error('Missing required fields:', record);
      continue;
    }

    // Parse and validate price
    const price = parseFloat(record.price);
    if (isNaN(price)) {
      console.error('Invalid price value:', record);
      continue;
    }

    try {
      await prisma.ingredient.upsert({
        where: { 
          sku: record.sku?.trim() 
        },
        update: {
          name: record.name.trim(),
          unit: record.unit.trim(),
          price: price,
          supplierId: supplier.id,
        },
        create: {
          name: record.name.trim(),
          sku: record.sku?.trim(),
          unit: record.unit.trim(),
          price: price,
          supplierId: supplier.id,
        },
      });
      console.log('Successfully processed ingredient:', record.name);
    } catch (error) {
      console.error('Error processing ingredient:', record.name, error);
      throw error;
    }
  }
} 