'use client';

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

interface StaffListProps {
  staffList: Staff[];
  onEdit: (staff: Staff) => void;
  onDelete: (id: string) => void;
}

export default function StaffList({ staffList, onEdit, onDelete }: StaffListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Staff List</h2>
      <div className="space-y-4">
        {staffList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No staff members found</p>
        ) : (
          staffList.map((staff) => (
            <div
              key={staff.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {staff.firstName} {staff.lastName}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-1">
                    <p>Email: {staff.email}</p>
                    <p>Phone: {staff.phoneNumber}</p>
                    <p>Pay Rate: {formatCurrency(staff.payRate)}/hr</p>
                    <p>DOB: {formatDate(staff.dateOfBirth)}</p>
                    <p className="text-xs text-gray-500">
                      Added: {formatDate(staff.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {staff.isDriver && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Driver
                      </span>
                    )}
                    {staff.isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(staff)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(staff.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 