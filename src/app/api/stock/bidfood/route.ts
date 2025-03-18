import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bidfoodItems = await prisma.bidfoodItem.findMany();
    return NextResponse.json(bidfoodItems);
  } catch (error) {
    console.error('Error fetching Bidfood items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bidfood items' },
      { status: 500 }
    );
  }
} 