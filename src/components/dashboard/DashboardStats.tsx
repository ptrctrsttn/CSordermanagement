import { useMemo } from 'react';
import { format, differenceInHours, differenceInMinutes, startOfWeek, endOfWeek } from 'date-fns';

interface Shift {
  id: string;
  startTime: Date;
  endTime: Date | null;
  notes: string | null;
  staffId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardStatsProps {
  staffId: string;
  shifts: Shift[];
}

export default function DashboardStats({ staffId, shifts }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const thisWeekShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= weekStart && shiftDate <= weekEnd && shift.endTime;
    });

    const totalHours = shifts.reduce((total, shift) => {
      if (!shift.endTime) return total;
      const hours = differenceInHours(new Date(shift.endTime), new Date(shift.startTime));
      return total + hours;
    }, 0);

    const thisWeekHours = thisWeekShifts.reduce((total, shift) => {
      if (!shift.endTime) return total;
      const hours = differenceInHours(new Date(shift.endTime), new Date(shift.startTime));
      return total + hours;
    }, 0);

    const averageShiftLength = shifts.reduce((total, shift) => {
      if (!shift.endTime) return total;
      const minutes = differenceInMinutes(new Date(shift.endTime), new Date(shift.startTime));
      return total + minutes;
    }, 0) / (shifts.filter(s => s.endTime).length || 1);

    return {
      totalShifts: shifts.length,
      completedShifts: shifts.filter(s => s.endTime).length,
      totalHours,
      thisWeekHours,
      averageShiftLength: Math.round(averageShiftLength / 60), // Convert to hours
    };
  }, [shifts]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-700">This Week</h3>
          <p className="text-3xl font-bold text-blue-900">{stats.thisWeekHours}h</p>
          <p className="text-sm text-blue-600">Hours Worked</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-700">Total</h3>
          <p className="text-3xl font-bold text-green-900">{stats.totalHours}h</p>
          <p className="text-sm text-green-600">Hours Worked</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-purple-700">Average Shift</h3>
          <p className="text-3xl font-bold text-purple-900">{stats.averageShiftLength}h</p>
          <p className="text-sm text-purple-600">Length</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-orange-700">Shifts</h3>
          <p className="text-3xl font-bold text-orange-900">{stats.completedShifts}</p>
          <p className="text-sm text-orange-600">Completed</p>
        </div>
      </div>
    </div>
  );
} 