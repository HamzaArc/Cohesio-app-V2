import React from 'react';

function StatCard({ icon, title, value, change, changeType }) {
  const isPositive = changeType === 'positive';
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-4">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default StatCard;