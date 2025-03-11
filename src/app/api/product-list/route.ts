import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.productList.findMany({
      orderBy: {
        handle: 'asc'
      }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching product list:', error);
    return NextResponse.json({ error: 'Failed to fetch product list' }, { status: 500 });
  }
} 