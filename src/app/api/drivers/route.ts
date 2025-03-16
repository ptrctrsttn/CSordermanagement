import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
} 