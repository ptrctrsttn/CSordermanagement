import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const otherItems = await prisma.otherItem.findMany();
    return NextResponse.json(otherItems);
  } catch (error) {
    console.error('Error fetching other items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch other items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const otherItem = await prisma.otherItem.create({
      data: {
        sku: data.sku,
        productName: data.productName,
        supplier: data.supplier,
        pricePerUnit: data.pricePerUnit,
      },
    });
    return NextResponse.json(otherItem);
  } catch (error) {
    console.error('Error creating other item:', error);
    return NextResponse.json(
      { error: 'Failed to create other item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // First, update the other item
    const otherItem = await prisma.otherItem.update({
      where: {
        id: data.id,
      },
      data: {
        sku: data.sku,
        productName: data.productName,
        supplier: data.supplier,
        pricePerUnit: data.pricePerUnit,
      },
    });

    // Find all StockSubItems that reference this other item
    const stockSubItems = await prisma.stockSubItem.findMany({
      where: {
        productId: data.id,
        source: 'other',
      },
      include: {
        stockItem: true,
      },
    });

    // Update each StockSubItem and its parent StockItem
    for (const subItem of stockSubItems) {
      // Update the sub-item's price
      await prisma.stockSubItem.update({
        where: {
          id: subItem.id,
        },
        data: {
          price: data.pricePerUnit,
        },
      });

      // Get all sub-items for this stock item to recalculate total cost
      const allSubItems = await prisma.stockSubItem.findMany({
        where: {
          stockItemId: subItem.stockItem.id,
        },
      });

      // Calculate new total cost
      const newTotalCost = allSubItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Update the stock item's total cost
      await prisma.stockItem.update({
        where: {
          id: subItem.stockItem.id,
        },
        data: {
          totalCost: newTotalCost,
        },
      });
    }

    return NextResponse.json(otherItem);
  } catch (error) {
    console.error('Error updating other item:', error);
    return NextResponse.json(
      { error: 'Failed to update other item' },
      { status: 500 }
    );
  }
} 