'use client';

import { useState, useEffect } from 'react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  weeklyHours: number;
  shifts: {
    date: string;
    clockIn: string;
    clockOut: string;
    totalHours: number;
  }[];
}

export default function AdminDashboard() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  useEffect(() => {
    // Here you would fetch staff data from your API
    // For now, we'll use mock data
    const mockStaffMembers: StaffMember[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        weeklyHours: 40,
        shifts: [
          {
            date: '2024-03-11',
            clockIn: '09:00',
            clockOut: '17:00',
            totalHours: 8,
          },
          // Add more shifts as needed
        ],
      },
      // Add more staff members as needed
    ];
    setStaffMembers(mockStaffMembers);
  }, [selectedWeek]);

  const handleWeekChange = (offset: number) => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + offset * 7);
    setSelectedWeek(newDate);
  };

  const formatWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const toggleStaffExpand = (staffId: string) => {
    setExpandedStaff(expandedStaff === staffId ? null : staffId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Staff Hours Overview</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleWeekChange(-1)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Previous Week
          </button>
          <span className="font-medium">{formatWeekRange(selectedWeek)}</span>
          <button
            onClick={() => handleWeekChange(1)}
            className="text-gray-600 hover:text-gray-800"
          >
            Next Week →
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {staffMembers.map(staff => (
          <div key={staff.id} className="bg-white border rounded-lg shadow-sm">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleStaffExpand(staff.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{staff.name}</h3>
                  <div className="text-sm text-gray-600">{staff.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{staff.weeklyHours} hours</div>
                  <div className="text-sm text-gray-600">this week</div>
                </div>
              </div>
            </div>

            {expandedStaff === staff.id && (
              <div className="border-t p-4">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Clock In</th>
                      <th className="pb-2">Clock Out</th>
                      <th className="pb-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {staff.shifts.map((shift, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                        <td className="py-2">{shift.clockIn}</td>
                        <td className="py-2">{shift.clockOut}</td>
                        <td className="py-2 text-right">{shift.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 