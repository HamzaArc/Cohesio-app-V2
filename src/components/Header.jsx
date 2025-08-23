// src/components/Header.jsx

import React from 'react';
import { Search, Bell, Calendar, ChevronDown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext'; // UPDATED: Import useAppContext

function Header() {
  // UPDATED: Get the current user from the AppContext, not Firebase
  const { currentUser } = useAppContext();

  return (
    <header className="bg-white h-16 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#4A1D4A] rounded-md flex items-center justify-center font-bold text-white">
            C
        </div>
        <h1 className="text-xl font-bold text-gray-800">Cohesio</h1>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Search size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Calendar size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
        </button>
        
        <div className="h-8 border-l border-gray-200"></div>

        <div className="flex items-center gap-3">
            <img 
                src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${currentUser?.email?.charAt(0).toUpperCase()}`} 
                alt="User" 
                className="w-8 h-8 rounded-full"
            />
            <div>
                <p className="font-semibold text-sm text-gray-800">{currentUser?.email || 'Admin User'}</p>
                <p className="text-xs text-gray-500">Admin</p>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}

export default Header;