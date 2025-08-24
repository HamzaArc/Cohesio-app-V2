// src/pages/TimeOff.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Plane, Heart, Sun, Trash2, Calendar, List, Filter, Settings, UserCheck, Check, X as XIcon, Eye, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../contexts/AppContext';
import RequestTimeOffModal from '../components/RequestTimeOffModal';
import TeamCalendar from '../components/TeamCalendar';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import DayDrawer from '../components/DayDrawer';
import TimeOffSettings from '../components/TimeOffSettings';
import RescheduleModal from '../components/RescheduleModal';
// MIGRATION FIX: Import the restored RequestDetailsModal
import RequestDetailsModal from '../components/RequestDetailsModal';

const BalanceCard = ({ icon, title, balance, bgColor, iconColor }) => ( <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-start border border-gray-200"><div className={`p-2 rounded-lg mb-4 ${bgColor}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${iconColor}` })}</div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold text-gray-800">{balance}</p><p className="text-sm text-gray-500">Days Balance Today</p></div> );
const MainTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function TimeOff() {
  const { employees, loading: employeesLoading, companyId, currentUser, refetchEmployees } = useAppContext();
  const [allRequests, setAllRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [myTeam, setMyTeam] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // MIGRATION FIX: State for the details modal is restored
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [weekends, setWeekends] = useState({ sat: true, sun: true });
  const [holidays, setHolidays] = useState([]);
  const [scope, setScope] = useState('Mine');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDateForDrawer, setSelectedDateForDrawer] = useState(null);
  const [eventsForDrawer, setEventsForDrawer] = useState([]);
  const [activeTab, setActiveTab] = useState('Requests');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState('All');

  useEffect(() => {
    if (!currentUser || !companyId) {
        setRequestsLoading(false);
        return;
    }
    const fetchAllData = async () => {
        setRequestsLoading(true);
        const { data: policyData } = await supabase.from('time_off_policies').select('*').eq('company_id', companyId).maybeSingle();
        if (policyData) setWeekends(policyData.weekends || { sat: true, sun: true });

        const { data: holidaysData } = await supabase.from('time_off_holidays').select('*').eq('company_id', companyId);
        if (holidaysData) setHolidays(holidaysData);

        const { data: requestsData } = await supabase.from('time_off_requests').select('*').eq('company_id', companyId).order('requested_at', { ascending: false });
        if (requestsData) setAllRequests(requestsData);

        setRequestsLoading(false);
    };

    fetchAllData();

    const channel = supabase.channel(`public:time_off_requests:company_id=eq.${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_off_requests' }, fetchAllData)
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUser, companyId]);

  useEffect(() => {
    if (currentUser && employees.length > 0) {
      const profile = employees.find(e => e.email === currentUser.email);
      setCurrentUserProfile(profile);
      if (profile) {
        setMyTeam(employees.filter(e => e.manager_email === profile.email));
      }
    }
  }, [currentUser, employees]);

  const requestsWithNameAndDept = useMemo(() => {
    if (employees.length === 0) return allRequests;
    const employeeMap = new Map(employees.map(e => [e.email, { name: e.name, department: e.department }]));
    return allRequests.map(req => ({
      ...req,
      employeeName: employeeMap.get(req.user_email)?.name || 'Unknown',
      department: employeeMap.get(req.user_email)?.department || 'N/A'
    }));
  }, [allRequests, employees]);

  const pendingTeamRequests = useMemo(() => {
    const teamEmails = new Set(myTeam.map(e => e.email));
    return requestsWithNameAndDept.filter(req => req.status === 'Pending' && teamEmails.has(req.user_email));
  }, [requestsWithNameAndDept, myTeam]);

  const filteredRequestsForList = useMemo(() => {
    if (!currentUser) return [];
    return requestsWithNameAndDept.filter(req => {
      if (scope === 'Mine' && req.user_email !== currentUser.email) return false;
      if (scope === 'My Team' && !myTeam.some(e => e.email === req.user_email)) return false;
      return true;
    });
  }, [requestsWithNameAndDept, scope, myTeam, currentUser]);

  const uniqueDepartments = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  const filteredCalendarEvents = useMemo(() => {
    return requestsWithNameAndDept.map(req => ({...req, startDate: req.start_date, endDate: req.end_date})).filter(req => {
      const isApproved = req.status === 'Approved';
      let scopeMatch = false;
      if (scope === 'All') scopeMatch = true;
      else if (scope === 'Mine' && req.user_email === currentUser.email) scopeMatch = true;
      else if (scope === 'My Team' && myTeam.some(e => e.email === req.user_email)) scopeMatch = true;
      const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(req.department);
      const leaveTypeMatch = selectedLeaveType === 'All' || req.leave_type === selectedLeaveType;
      return isApproved && scopeMatch && departmentMatch && leaveTypeMatch;
    });
  }, [requestsWithNameAndDept, selectedDepartments, selectedLeaveType, scope, currentUser, myTeam]);

  const handleRequestSubmitted = () => { setIsAddModalOpen(false); };
  const handleRescheduleSubmitted = () => { setIsRescheduleModalOpen(false); setSelectedRequest(null); };

  const handleUpdateRequestStatus = async (request, newStatus) => {
    if (!companyId) return;
    await supabase.from('time_off_requests').update({ status: newStatus }).eq('id', request.id);
    if (newStatus === 'Denied' && request.status === 'Pending' && request.leave_type !== 'Personal (Unpaid)') {
        const balanceFieldMap = { 'Vacation': 'vacation_balance', 'Sick Day': 'sick_balance' };
        const balanceField = balanceFieldMap[request.leave_type];
        if(balanceField) {
            await supabase.rpc('increment_leave_balance', {
                employee_id_param: request.employee_id,
                field_name_param: balanceField,
                increment_value_param: request.total_days
            });
            refetchEmployees();
        }
    }
  };

  const handleDeleteClick = (request) => { setSelectedRequest(request); setIsDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!selectedRequest || !companyId) return;
    setIsDeleting(true);
    await supabase.from('time_off_requests').delete().eq('id', selectedRequest.id);
    if (selectedRequest.status === 'Pending' && selectedRequest.leave_type !== 'Personal (Unpaid)') {
        const balanceFieldMap = { 'Vacation': 'vacation_balance', 'Sick Day': 'sick_balance' };
        const balanceField = balanceFieldMap[selectedRequest.leave_type];
        if (balanceField) {
            await supabase.rpc('increment_leave_balance', {
                employee_id_param: selectedRequest.employee_id,
                field_name_param: balanceField,
                increment_value_param: selectedRequest.total_days
            });
            refetchEmployees();
        }
    }
    setIsDeleteModalOpen(false); setSelectedRequest(null); setIsDeleting(false);
  };

  // MIGRATION FIX: Handlers for the details modal are restored
  const handleWithdrawRequest = (request) => { setIsDetailsModalOpen(false); handleDeleteClick(request); };
  const handleRescheduleClick = (request) => { setSelectedRequest(request); setIsDetailsModalOpen(false); setTimeout(() => setIsRescheduleModalOpen(true), 100); };
  const handleRowClick = (request) => { setSelectedRequest(request); setIsDetailsModalOpen(true); };

  const handleDayClick = (date, events) => { setSelectedDateForDrawer(date); setEventsForDrawer(events); setIsDrawerOpen(true); };
  const handleViewRequestFromDrawer = (request) => { setIsDrawerOpen(false); setTimeout(() => handleRowClick(request), 300); };
  const handleDepartmentToggle = (dept) => {
    setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const isManager = myTeam.length > 0;
  const loading = employeesLoading || requestsLoading;

  return (
    <>
      <RequestTimeOffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onrequestSubmitted={handleRequestSubmitted} currentUserProfile={currentUserProfile} weekends={weekends} holidays={holidays} allRequests={requestsWithNameAndDept} myTeam={myTeam} />
      {/* MIGRATION FIX: The details modal is now rendered */}
      <RequestDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} request={selectedRequest} onWithdraw={handleWithdrawRequest} onReschedule={handleRescheduleClick} />
      <RescheduleModal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} request={selectedRequest} onRescheduled={handleRescheduleSubmitted} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={`request from ${selectedRequest?.start_date}`} loading={isDeleting} />
      <DayDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} date={selectedDateForDrawer} events={eventsForDrawer} onViewRequest={handleViewRequestFromDrawer} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Time Off</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"><Plus size={20} className="mr-2" />Request Time Off</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BalanceCard icon={<Plane />} title="Vacation" balance={currentUserProfile?.vacation_balance ?? '...'} bgColor="bg-blue-100" iconColor="text-blue-600" />
            {isManager && <BalanceCard icon={<UserCheck />} title="Pending Approvals" balance={pendingTeamRequests.length} bgColor="bg-orange-100" iconColor="text-orange-600" />}
            <BalanceCard icon={<Heart />} title="Sick Days" balance={currentUserProfile?.sick_balance ?? '...'} bgColor="bg-green-100" iconColor="text-green-600" />
            <BalanceCard icon={<Sun />} title="Personal (Unpaid)" balance={currentUserProfile?.personal_balance ?? '...'} bgColor="bg-purple-100" iconColor="text-purple-600" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex flex-wrap">
                <MainTab label="Requests" active={activeTab === 'Requests'} onClick={() => setActiveTab('Requests')} />
                <MainTab label="Calendar" active={activeTab === 'Calendar'} onClick={() => setActiveTab('Calendar')} />
                {isManager && <MainTab label="Team Approvals" active={activeTab === 'Approvals'} onClick={() => setActiveTab('Approvals')} />}
                <MainTab label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
            </div>

             {activeTab === 'Requests' && (
                <div className="p-6">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Employee</th><th className="p-4 font-semibold text-gray-500 text-sm">Leave Type</th><th className="p-4 font-semibold text-gray-500 text-sm">Dates</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                        <tbody>
                            {loading ? (<tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>)
                            : filteredRequestsForList.map(req => (
                                <tr key={req.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                    <td className="p-4 font-semibold text-gray-800">{req.employeeName}</td>
                                    <td className="p-4 text-gray-700">{req.leave_type}</td>
                                    <td className="p-4 text-gray-700">{req.start_date} to {req.end_date}</td>
                                    <td className="p-4"><span className={`text-xs font-bold py-1 px-2 rounded-full ${ req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>{req.status}</span></td>
                                    <td className="p-4">
                                        {/* MIGRATION FIX: onClick now opens the details modal */}
                                        <button onClick={() => handleRowClick(req)} className="p-2 hover:bg-gray-200 rounded-full"><Eye size={16} className="text-gray-600" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             {activeTab === 'Calendar' && <TeamCalendar events={filteredCalendarEvents} employees={employees} weekends={weekends} holidays={holidays} onDayClick={handleDayClick} />}
             {activeTab === 'Approvals' && (
                <div className="p-6">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Employee</th><th className="p-4 font-semibold text-gray-500 text-sm">Leave Type</th><th className="p-4 font-semibold text-gray-500 text-sm">Dates</th><th className="p-4 font-semibold text-gray-500 text-sm">Days</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                        <tbody>
                            {loading ? (<tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>)
                            : pendingTeamRequests.length === 0 ? (<tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending requests from your team.</td></tr>)
                            : pendingTeamRequests.map(req => (
                                <tr key={req.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="p-4 font-semibold text-gray-800">{req.employeeName}</td>
                                    <td className="p-4 text-gray-700">{req.leave_type}</td>
                                    <td className="p-4 text-gray-700">{req.start_date} to {req.end_date}</td>
                                    <td className="p-4 text-gray-700">{req.total_days}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2 items-center">
                                            <button onClick={() => handleUpdateRequestStatus(req, 'Denied')} className="p-2 bg-red-100 hover:bg-red-200 rounded-full"><XIcon size={16} className="text-red-600" /></button>
                                            <button onClick={() => handleUpdateRequestStatus(req, 'Approved')} className="p-2 bg-green-100 hover:bg-green-200 rounded-full"><Check size={16} className="text-green-600" /></button>
                                            <button onClick={() => handleRowClick(req)} className="p-2 hover:bg-gray-200 rounded-full"><Eye size={16} className="text-gray-600" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'Settings' && ( <TimeOffSettings /> )}
        </div>
      </div>
    </>
  );
}

export default TimeOff;
