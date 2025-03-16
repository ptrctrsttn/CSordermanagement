import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');

    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // If user is not admin, only show their own shifts
    if (session.user.role !== 'admin') {
      where.staffId = session.user.id;
    } else if (staffId) {
      where.staffId = staffId;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        staff: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, clockIn, clockOut, notes } = await request.json();

    if (!date || !clockIn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        staffId: session.user.id,
        date: new Date(date),
        clockIn: new Date(clockIn),
        clockOut: clockOut ? new Date(clockOut) : null,
        notes,
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, clockIn, clockOut, notes } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing shift ID' }, { status: 400 });
    }

    const shift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Only allow staff to edit their own shifts, or admins to edit any shift
    if (shift.staffId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : null,
        notes,
      },
    });

    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 