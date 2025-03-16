'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Shift {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  isEditing?: boolean;
}

export default function StaffShiftHistory() {
  const { data: session } = useSession();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());

  useEffect(() => {
    // Here you would fetch shifts from your API
    // For now, we'll use mock data
    const mockShifts: Shift[] = [
      {
        id: '1',
        date: '2024-03-11',
        clockIn: '09:00',
        clockOut: '17:00',
        totalHours: 8,
      },
      // Add more mock shifts as needed
    ];
    setShifts(mockShifts);
  }, [selectedWeek]);

  const handleEditShift = (shiftId: string) => {
    setShifts(shifts.map(shift => 
      shift.id === shiftId 
        ? { ...shift, isEditing: !shift.isEditing }
        : shift
    ));
  };

  const handleSaveShift = (shiftId: string, updatedShift: Partial<Shift>) => {
    setShifts(shifts.map(shift =>
      shift.id === shiftId
        ? { ...shift, ...updatedShift, isEditing: false }
        : shift
    ));
    // Here you would make an API call to save the updated shift
  };

  const calculateWeeklyTotal = () => {
    return shifts.reduce((total, shift) => total + shift.totalHours, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Shift History</h2>
        <div className="text-sm font-medium text-gray-600">
          Weekly Total: {calculateWeeklyTotal()} hours
        </div>
      </div>

      <div className="space-y-4">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-gray-50 rounded-lg p-4">
            {shift.isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clock In</label>
                    <input
                      type="time"
                      defaultValue={shift.clockIn}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      onChange={(e) => handleSaveShift(shift.id, { clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clock Out</label>
                    <input
                      type="time"
                      defaultValue={shift.clockOut}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      onChange={(e) => handleSaveShift(shift.id, { clockOut: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleEditShift(shift.id)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{formatDate(shift.date)}</div>
                  <div className="text-sm text-gray-600">
                    {shift.clockIn} - {shift.clockOut} ({shift.totalHours} hours)
                  </div>
                </div>
                <button
                  onClick={() => handleEditShift(shift.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 