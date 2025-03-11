import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to Order Management System</h1>
        <p className="mt-2 text-gray-600">Select a section from the navigation menu to get started.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Today's Orders</h2>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">0</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Pending Orders</h2>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Total Revenue</h2>
          <p className="mt-2 text-3xl font-semibold text-green-600">$0</p>
        </div>
      </div>
    </div>
  );
}
