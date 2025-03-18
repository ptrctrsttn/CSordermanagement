import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ShiftManager from '@/components/dashboard/ShiftManager';
import DashboardStats from '@/components/dashboard/DashboardStats';

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch the staff member's details
  const staff = await prisma.staff.findUnique({
    where: { email: session.user.email },
    include: {
      shifts: {
        orderBy: { startTime: 'desc' },
        take: 10, // Get last 10 shifts
      },
    },
  });

  if (!staff) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {staff.firstName}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <ShiftManager staffId={staff.id} currentShifts={staff.shifts} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <DashboardStats staffId={staff.id} shifts={staff.shifts} />
        </div>
      </div>
    </div>
  );
} 