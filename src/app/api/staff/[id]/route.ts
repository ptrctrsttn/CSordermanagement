import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role === 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const staff = await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 