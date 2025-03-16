import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received staff data:', { ...data, password: '[REDACTED]' });

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      dateOfBirth,
      payRate,
      isDriver,
      isAdmin,
      password,
    } = data;

    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        dateOfBirth: new Date(dateOfBirth),
        payRate: parseFloat(payRate),
        isDriver: Boolean(isDriver),
        isAdmin: Boolean(isAdmin),
        password,
      },
    });

    console.log('Created staff:', { ...staff, password: '[REDACTED]' });
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (updateData.email) {
      const existingStaff = await prisma.staff.findFirst({
        where: {
          email: updateData.email,
          NOT: {
            id: id,
          },
        },
      });

      if (existingStaff) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...updateData,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
        payRate: updateData.payRate ? parseFloat(updateData.payRate) : undefined,
        isDriver: updateData.isDriver !== undefined ? Boolean(updateData.isDriver) : undefined,
        isAdmin: updateData.isAdmin !== undefined ? Boolean(updateData.isAdmin) : undefined,
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
} 