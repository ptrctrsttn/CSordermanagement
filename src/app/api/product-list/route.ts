import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productList = await prisma.productList.findMany();
    return NextResponse.json(productList);
  } catch (error) {
    console.error('Error fetching product list:', error);
    return NextResponse.json({ error: 'Failed to fetch product list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const productList = await prisma.productList.upsert({
      where: { id: data.id || '' },
      update: {
        addon: data.addon,
        handle: data.handle,
        totalCost: data.totalCost,
        listOfIng: data.listOfIng,
        meat1: data.meat1,
        meat2: data.meat2,
        option1: data.option1,
        option2: data.option2,
        serveware: data.serveware,
        timerA: data.timerA,
        timerB: data.timerB,
        skuSearch: data.skuSearch,
        variantSku: data.variantSku,
      },
      create: {
        id: data.id || crypto.randomUUID(),
        addon: data.addon,
        handle: data.handle,
        totalCost: data.totalCost,
        listOfIng: data.listOfIng,
        meat1: data.meat1,
        meat2: data.meat2,
        option1: data.option1,
        option2: data.option2,
        serveware: data.serveware,
        timerA: data.timerA,
        timerB: data.timerB,
        skuSearch: data.skuSearch,
        variantSku: data.variantSku,
      },
    });
    return NextResponse.json(productList);
  } catch (error) {
    console.error('Error saving product list:', error);
    return NextResponse.json({ error: 'Failed to save product list' }, { status: 500 });
  }
} 