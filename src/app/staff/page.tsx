'use client';

import { useState, useEffect } from 'react';
import StaffForm from './components/StaffForm';
import StaffList from './components/StaffList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  email: string;
  phoneNumber: string;
  payRate: number;
  isDriver: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StaffPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  useEffect(() => {
    if (!session?.user?.role === 'admin') {
      router.push('/');
      return;
    }
    fetchStaff();
  }, [session]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffSubmit = async (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/staff', {
        method: editingStaff ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingStaff ? { ...staffData, id: editingStaff.id } : staffData),
      });

      if (response.ok) {
        fetchStaff();
        setEditingStaff(null);
      }
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add, edit, and manage staff members
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <StaffForm
              onSubmit={handleStaffSubmit}
              initialData={editingStaff}
              onCancel={() => setEditingStaff(null)}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <StaffList
              staffList={staffList}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 