import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stockItems = await prisma.stockItem.findMany({
      include: {
        subItems: true,
      },
    });
    return NextResponse.json(stockItems);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json({ error: 'Failed to fetch stock items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create the stock item first
    const stockItem = await prisma.stockItem.create({
      data: {
        name: data.name,
        totalCost: data.totalCost,
      },
    });

    // Then create the sub-items with the new stock item's ID
    if (data.subItems && data.subItems.length > 0) {
      await prisma.stockSubItem.createMany({
        data: data.subItems.map((item: any) => ({
          stockItemId: stockItem.id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          source: item.source,
        })),
      });
    }

    // Fetch the complete stock item with its sub-items
    const completeStockItem = await prisma.stockItem.findUnique({
      where: { id: stockItem.id },
      include: { subItems: true },
    });

    return NextResponse.json(completeStockItem);
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Failed to create stock item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Delete existing sub-items
    await prisma.stockSubItem.deleteMany({
      where: {
        stockItemId: data.id,
      },
    });

    // Update stock item
    const stockItem = await prisma.stockItem.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        totalCost: data.totalCost,
      },
    });

    // Create new sub-items
    if (data.subItems && data.subItems.length > 0) {
      await prisma.stockSubItem.createMany({
        data: data.subItems.map((item: any) => ({
          stockItemId: stockItem.id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          source: item.source,
        })),
      });
    }

    // Fetch the complete stock item with its sub-items
    const completeStockItem = await prisma.stockItem.findUnique({
      where: { id: stockItem.id },
      include: { subItems: true },
    });

    return NextResponse.json(completeStockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json({ error: 'Failed to update stock item' }, { status: 500 });
  }
} 