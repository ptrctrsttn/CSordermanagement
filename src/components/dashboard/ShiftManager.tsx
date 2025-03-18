import { useState } from 'react';
import { format } from 'date-fns';

interface Shift {
  id: string;
  startTime: Date;
  endTime: Date | null;
  notes: string | null;
  staffId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ShiftManagerProps {
  staffId: string;
  currentShifts: Shift[];
}

export default function ShiftManager({ staffId, currentShifts }: ShiftManagerProps) {
  const [activeShift, setActiveShift] = useState<Shift | null>(
    currentShifts.find(shift => !shift.endTime) || null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [notes, setNotes] = useState('');

  const handleClockIn = async () => {
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          startTime: new Date(),
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to clock in');

      const newShift = await response.json();
      setActiveShift(newShift);
      setNotes('');
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;

    try {
      const response = await fetch(`/api/shifts/${activeShift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endTime: new Date(),
          notes: notes || activeShift.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to clock out');

      const updatedShift = await response.json();
      setActiveShift(null);
      setNotes('');
      // Refresh the page to update the shifts list
      window.location.reload();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out. Please try again.');
    }
  };

  const handleEditShift = async (shift: Shift) => {
    setSelectedShift(shift);
    setNotes(shift.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedShift) return;

    try {
      const response = await fetch(`/api/shifts/${selectedShift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update shift');

      setIsEditing(false);
      setSelectedShift(null);
      setNotes('');
      // Refresh the page to update the shifts list
      window.location.reload();
    } catch (error) {
      console.error('Error updating shift:', error);
      alert('Failed to update shift. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Shift Management</h2>
      
      {/* Clock In/Out Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Current Status</h3>
        {activeShift ? (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-700">
              Clocked in at: {format(new Date(activeShift.startTime), 'h:mm a')}
            </p>
            <textarea
              className="w-full mt-2 p-2 border rounded"
              placeholder="Add notes about your shift..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleClockOut}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clock Out
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">Not currently clocked in</p>
            <textarea
              className="w-full mt-2 p-2 border rounded"
              placeholder="Add notes for your shift..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleClockIn}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Clock In
            </button>
          </div>
        )}
      </div>

      {/* Recent Shifts Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Recent Shifts</h3>
        <div className="space-y-2">
          {currentShifts.map((shift) => (
            <div
              key={shift.id}
              className="border p-3 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => handleEditShift(shift)}
            >
              <p className="font-medium">
                {format(new Date(shift.startTime), 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(shift.startTime), 'h:mm a')} -{' '}
                {shift.endTime
                  ? format(new Date(shift.endTime), 'h:mm a')
                  : 'In Progress'}
              </p>
              {shift.notes && (
                <p className="text-sm text-gray-500 mt-1">{shift.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Shift Modal */}
      {isEditing && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Edit Shift Notes</h3>
            <textarea
              className="w-full p-2 border rounded mb-4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedShift(null);
                  setNotes('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 