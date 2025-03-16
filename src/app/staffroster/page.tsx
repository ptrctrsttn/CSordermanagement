'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import StaffClockInOut from './components/StaffClockInOut';
import StaffShiftHistory from './components/StaffShiftHistory';
import AdminDashboard from './components/AdminDashboard';

export default function StaffRoster() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin - this would need to be implemented based on your auth system
    setIsAdmin(session?.user?.role === 'admin');
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Roster</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your work hours and view shift history
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Clock In/Out Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <StaffClockInOut />
          </div>

          {/* Shift History Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <StaffShiftHistory />
          </div>
        </div>

        {/* Admin Dashboard - only visible to admins */}
        {isAdmin && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <AdminDashboard />
          </div>
        )}
      </div>
    </div>
  );
} 