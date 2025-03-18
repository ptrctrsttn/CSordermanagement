import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const gilmoursItems = await prisma.gilmoursItem.findMany();
    return NextResponse.json(gilmoursItems);
  } catch (error) {
    console.error('Error fetching Gilmours items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Gilmours items' },
      { status: 500 }
    );
  }
} 