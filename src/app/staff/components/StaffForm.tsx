'use client';

import { useState, useEffect } from 'react';

interface Staff {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  email: string;
  phoneNumber: string;
  payRate: number;
  isDriver: boolean;
  isAdmin: boolean;
}

interface StaffFormProps {
  onSubmit: (data: Omit<Staff, 'id'>) => void;
  initialData?: Staff | null;
  onCancel: () => void;
}

export default function StaffForm({ onSubmit, initialData, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState<Omit<Staff, 'id'>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    email: '',
    phoneNumber: '',
    payRate: 0,
    isDriver: false,
    isAdmin: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        dateOfBirth: initialData.dateOfBirth,
        address: initialData.address,
        email: initialData.email,
        phoneNumber: initialData.phoneNumber,
        payRate: initialData.payRate,
        isDriver: initialData.isDriver,
        isAdmin: initialData.isAdmin,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        address: '',
        email: '',
        phoneNumber: '',
        payRate: 0,
        isDriver: false,
        isAdmin: false,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">
        {initialData ? 'Edit Staff Member' : 'Add New Staff Member'}
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pay Rate ($/hr)</label>
          <input
            type="number"
            name="payRate"
            value={formData.payRate}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex space-x-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isDriver"
            checked={formData.isDriver}
            onChange={handleChange}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Driver</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isAdmin"
            checked={formData.isAdmin}
            onChange={handleChange}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Admin</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        {initialData && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialData ? 'Update Staff Member' : 'Add Staff Member'}
        </button>
      </div>
    </form>
  );
} 