import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff member
    const staff = await prisma.staff.findUnique({
      where: { email: session.user.email },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shifts for the staff member
    const shifts = await prisma.shift.findMany({
      where: { staffId: staff.id },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { staffId, startTime, notes } = data;

    // Verify the staff member exists and matches the session
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        email: session.user.email,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if there's already an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        staffId,
        endTime: null,
      },
    });

    if (activeShift) {
      return NextResponse.json(
        { error: 'Already clocked in' },
        { status: 400 }
      );
    }

    // Create new shift
    const shift = await prisma.shift.create({
      data: {
        staffId,
        startTime: new Date(startTime),
        notes,
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
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