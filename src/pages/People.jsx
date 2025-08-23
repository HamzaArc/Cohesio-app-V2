// src/pages/People.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash, Users, UserPlus, Share2, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient'; // UPDATED: Import Supabase client
import { useAppContext } from '../contexts/AppContext';
import AddEmployeeModal from '../components/AddEmployeeModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import OrgChart from '../components/OrgChart';
import StatCard from '../components/StatCard';
import InviteEmployeeModal from '../components/InviteEmployeeModal';

const PeopleTab = ({ label, icon, active, onClick }) => ( <button onClick={onClick} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{icon}{label}</button> );

function People() {
  const { employees: allEmployees, loading, companyId } = useAppContext();
  const [activeTab, setActiveTab] = useState('Directory');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allEmployees, searchTerm]);
  
  const newHiresThisMonth = useMemo(() => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return allEmployees.filter(emp => {
          if (!emp.hire_date) return false;
          const hireDate = new Date(emp.hire_date);
          return hireDate >= firstDayOfMonth;
      }).length;
  }, [allEmployees]);

  const handleEditClick = (employee) => { setSelectedEmployee(employee); setIsEditModalOpen(true); };
  const handleDeleteClick = (employee) => { setSelectedEmployee(employee); setIsDeleteModalOpen(true); };
  
  // SUPABASE DELETE LOGIC
  const handleDeleteConfirm = async () => {
    if (!selectedEmployee || !companyId) return;
    setIsDeleting(true);
    try {
      // Delete the employee from the Supabase 'employees' table
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', selectedEmployee.id);
      
      if (error) throw error;

      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
      // NOTE: The AppContext will automatically refetch and update the UI.
    } catch (err) {
      console.error("Error deleting employee:", err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderContent = () => {
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    
    if (activeTab === 'Org Chart') {
        return <OrgChart employees={allEmployees} />;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by name, position, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    />
                </div>
                <button className="text-sm font-semibold text-blue-600 hover:underline">Export to CSV</button>
            </div>
            
            {filteredEmployees.length > 0 ? (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-500 text-sm">Employee</th>
                            <th className="p-4 font-semibold text-gray-500 text-sm">Position</th>
                            <th className="p-4 font-semibold text-gray-500 text-sm">Contact</th>
                            <th className="p-4 font-semibold text-gray-500 text-sm">Status</th>
                            <th className="p-4 font-semibold text-gray-500 text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => (
                            <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-4 flex items-center">
                                    <img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${emp.name.charAt(0)}`} alt={emp.name} className="w-10 h-10 rounded-full mr-4" />
                                    <Link to={`/people/${emp.id}`} className="font-semibold text-gray-800 hover:text-blue-600">{emp.name}</Link>
                                </td>
                                <td className="p-4 text-gray-700">{emp.position}</td>
                                <td className="p-4 text-gray-700">{emp.email}</td>
                                <td className="p-4"><span className={`capitalize text-xs font-bold py-1 px-2 rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{emp.status}</span></td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(emp)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16} className="text-gray-600" /></button>
                                        <button onClick={() => handleDeleteClick(emp)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p className="font-semibold">No employees found</p>
                    <p className="text-sm">Try adjusting your search or add a new employee.</p>
                </div>
            )}
        </div>
    );
  };

  return (
    <>
      <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onEmployeeAdded={() => setIsAddModalOpen(false)} />
      <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={selectedEmployee} onEmployeeUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedEmployee?.name} loading={isDeleting} />
      <InviteEmployeeModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onInvitationSent={() => setIsInviteModalOpen(false)} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">People Directory</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsInviteModalOpen(true)} className="bg-white text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 border border-gray-300 flex items-center shadow-sm">
                <Mail size={16} className="mr-2"/>Invite Employee
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                <Plus size={20} className="mr-2" />Add Employee
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Users size={24}/>} title="Total Employees" value={allEmployees.length} />
            <StatCard icon={<UserPlus size={24}/>} title="New Hires This Month" value={newHiresThisMonth} />
            <StatCard icon={<Users size={24}/>} title="Departments" value={new Set(allEmployees.map(e => e.department)).size} />
            <StatCard icon={<Users size={24}/>} title="Avg. Tenure" value="2.1 years" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <PeopleTab label="Directory" icon={<Users size={16} />} active={activeTab === 'Directory'} onClick={() => setActiveTab('Directory')} />
                <PeopleTab label="Org Chart" icon={<Share2 size={16} />} active={activeTab === 'Org Chart'} onClick={() => setActiveTab('Org Chart')} />
            </div>
            {renderContent()}
        </div>
      </div>
    </>
  );
}

export default People;