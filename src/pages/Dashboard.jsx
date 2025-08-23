// src/pages/Dashboard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
// UPDATED: All firebase and data-fetching imports have been removed.
import { useAppContext } from '../contexts/AppContext';
import { Users, Calendar } from 'lucide-react';

// This is a temporary, data-free version of the Dashboard for testing purposes.
function Dashboard() {
  const { employees, currentUser } = useAppContext();

  const currentUserProfile = React.useMemo(() => {
    return employees.find(e => e.email === currentUser?.email);
  }, [employees, currentUser]);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Good afternoon, {currentUserProfile?.name || 'Admin'}</h1>
          <p className="text-gray-500">Here's what's happening in your company today.</p>
        </div>
        <Link to="/people" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
          <Users size={20} className="mr-2" />
          View People
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Placeholder Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Welcome to Cohesio on Supabase!</h2>
            <p className="text-gray-600">
              The Authentication, People, and Profile pages have been successfully migrated.
              Please use the sidebar to navigate to the <Link to="/people" className="text-blue-600 font-bold hover:underline">People Directory</Link> to begin testing.
            </p>
            <p className="text-gray-600 mt-2">
              Other pages like Payroll, Time Off, and Surveys will be migrated in the next phase.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 mb-4">
              <Calendar className="inline-block mr-2 text-blue-600" />
              Next Steps
            </h2>
            <p className="text-gray-500">
              Follow the test plan provided to validate all the functionalities of the migrated pages. Once testing is complete, we can proceed with migrating the next set of features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;