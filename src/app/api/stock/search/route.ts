import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GilmoursItem, BidfoodItem, OtherItem } from '@/types/stock';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search in Gilmours items
    const gilmoursItems = await prisma.gilmoursItem.findMany({
      where: {
        OR: [
          { productDescription: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // Search in Bidfood items
    const bidfoodItems = await prisma.bidfoodItem.findMany({
      where: {
        OR: [
          { description: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { productCode: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // Search in Other items
    const otherItems = await prisma.otherItem.findMany({
      where: {
        OR: [
          { productName: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // Format results
    const results = [
      ...gilmoursItems.map((item: GilmoursItem) => ({
        id: item.id,
        name: item.productDescription,
        price: parseFloat(item.price.replace('$', '')),
        unit: item.uom,
        source: 'gilmours' as const,
        packSize: item.packSize,
        ctnQty: item.qty,
        lastPrice: item.price
      })),
      ...bidfoodItems.map((item: BidfoodItem) => ({
        id: item.id,
        name: item.description,
        price: parseFloat(item.lastPricePaid.replace('$', '')),
        unit: item.uom,
        source: 'bidfood' as const,
        packSize: item.packSize,
        ctnQty: item.ctnQty,
        lastPrice: item.lastPricePaid
      })),
      ...otherItems.map((item: OtherItem) => ({
        id: item.id,
        name: item.productName,
        price: item.pricePerUnit,
        unit: 'unit',
        source: 'other' as const,
        packSize: '-',
        ctnQty: '-',
        lastPrice: item.pricePerUnit.toString()
      }))
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
} 