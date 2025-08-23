import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, DollarSign, Clock, Calendar, FileText, BookOpen, MessageSquare, BarChart2, Building, Settings, LogOut } from 'lucide-react';
import { auth } from '../firebase';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: <Home size={20} /> },
  { path: '/profile', label: 'Profile', icon: <User size={20} /> },
  { path: '/people', label: 'People', icon: <Users size={20} /> },
  { path: '/payroll', label: 'Payroll', icon: <DollarSign size={20} /> },
  { path: '/time-off', label: 'Time Off', icon: <Calendar size={20} /> },
  { path: '/documents', label: 'Documents', icon: <FileText size={20} /> },
  { path: '/training', label: 'Training', icon: <BookOpen size={20} /> },
  { path: '/surveys', label: 'Surveys', icon: <MessageSquare size={20} /> },
  // { path: '/performance', label: 'Performance', icon: <BarChart2 size={20} /> }, // This line is now removed
  { path: '/reporting', label: 'Reporting', icon: <BarChart2 size={20} /> },
  { path: '/company', label: 'Company', icon: <Building size={20} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

const NavLink = ({ to, children, icon }) => {
  const location = useLocation();
  // Updated logic to handle nested routes
  const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== '/dashboard');

  return (
    <Link to={to} className={`flex items-center p-2.5 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${ isActive ? 'bg-gradient-to-r from-blue-50 to-sky-100 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }`}>
      <div className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>{icon}</div>
      {children}
    </Link>
  );
};

function Sidebar() {
  return (
    <div className="w-64 bg-white text-white flex flex-col p-4 border-r border-gray-200">
      <nav className="flex-1 mt-4">
        {navItems.map(item => (
            <NavLink key={item.path} to={item.path} icon={item.icon}>{item.label}</NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <button onClick={() => auth.signOut()} className="flex items-center w-full p-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            <LogOut size={20} className="mr-3 text-gray-400" />
            Log Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;