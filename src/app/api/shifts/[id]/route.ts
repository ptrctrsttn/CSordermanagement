import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { endTime, notes } = data;

    // Verify the shift exists and belongs to the user
    const shift = await prisma.shift.findFirst({
      where: {
        id: params.id,
        staff: {
          email: session.user.email,
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Update the shift
    const updatedShift = await prisma.shift.update({
      where: { id: params.id },
      data: {
        endTime: endTime ? new Date(endTime) : undefined,
        notes,
      },
    });

    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the shift exists and belongs to the user
    const shift = await prisma.shift.findFirst({
      where: {
        id: params.id,
        staff: {
          email: session.user.email,
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Delete the shift
    await prisma.shift.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 