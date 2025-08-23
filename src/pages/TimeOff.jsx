import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Plane, Heart, Sun, Trash2, Calendar, List, Filter, Settings, UserCheck, Check, XIcon, Eye } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, where, writeBatch, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import RequestTimeOffModal from '../components/RequestTimeOffModal';
import TeamCalendar from '../components/TeamCalendar';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import RequestDetailsModal from '../components/RequestDetailsModal';
import DayDrawer from '../components/DayDrawer';
import TimeOffSettings from '../components/TimeOffSettings';
import RescheduleModal from '../components/RescheduleModal';

const BalanceCard = ({ icon, title, balance, bgColor, iconColor }) => ( <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-start border border-gray-200"><div className={`p-2 rounded-lg mb-4 ${bgColor}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${iconColor}` })}</div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold text-gray-800">{balance}</p><p className="text-sm text-gray-500">Days Balance Today</p></div> );
const MainTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function TimeOff() {
  const { employees, loading: employeesLoading, companyId, currentUser } = useAppContext();
  const [allRequests, setAllRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [myTeam, setMyTeam] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    const policyRef = doc(db, 'companies', companyId, 'policies', 'timeOff');
    const holidaysColRef = collection(policyRef, 'holidays');
    const unsubPolicy = onSnapshot(policyRef, (docSnap) => { if (docSnap.exists()) setWeekends(docSnap.data().weekends || { sat: true, sun: true }); });
    const unsubHolidays = onSnapshot(holidaysColRef, (snapshot) => { setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    
    const requestsQuery = query(collection(db, 'companies', companyId, 'timeOffRequests'), orderBy('requestedAt', 'desc'));
    const unsubRequests = onSnapshot(requestsQuery, (reqSnapshot) => {
      setAllRequests(reqSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setRequestsLoading(false);
    });
    return () => { unsubPolicy(); unsubHolidays(); unsubRequests(); };
  }, [currentUser, companyId]);

  useEffect(() => {
    if (currentUser && employees.length > 0) {
      const profile = employees.find(e => e.email === currentUser.email);
      setCurrentUserProfile(profile);
      if (profile) {
        setMyTeam(employees.filter(e => e.managerEmail === profile.email));
      }
    }
  }, [currentUser, employees]);

  const requestsWithNameAndDept = useMemo(() => {
    if (employees.length === 0) return allRequests;
    const employeeMap = new Map(employees.map(e => [e.email, { name: e.name, department: e.department }]));
    return allRequests.map(req => ({
      ...req,
      employeeName: employeeMap.get(req.userEmail)?.name || 'Unknown',
      department: employeeMap.get(req.userEmail)?.department || 'N/A'
    }));
  }, [allRequests, employees]);

  const pendingTeamRequests = useMemo(() => {
    const teamEmails = new Set(myTeam.map(e => e.email));
    return requestsWithNameAndDept.filter(req => req.status === 'Pending' && teamEmails.has(req.userEmail));
  }, [requestsWithNameAndDept, myTeam]);

  const filteredRequestsForList = useMemo(() => {
    if (!currentUser) return [];
    return requestsWithNameAndDept.filter(req => {
      if (scope === 'Mine' && req.userEmail !== currentUser.email) return false;
      if (scope === 'My Team' && !myTeam.some(e => e.email === req.userEmail)) return false;
      return true;
    });
  }, [requestsWithNameAndDept, scope, myTeam, currentUser]);
  
  const uniqueDepartments = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  const filteredCalendarEvents = useMemo(() => {
    return requestsWithNameAndDept.filter(req => {
      const isApproved = req.status === 'Approved';
      
      let scopeMatch = false;
      if (scope === 'All') scopeMatch = true;
      else if (scope === 'Mine' && req.userEmail === currentUser.email) scopeMatch = true;
      else if (scope === 'My Team' && myTeam.some(e => e.email === req.userEmail)) scopeMatch = true;

      const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(req.department);
      const leaveTypeMatch = selectedLeaveType === 'All' || req.leaveType === selectedLeaveType;
      
      return isApproved && scopeMatch && departmentMatch && leaveTypeMatch;
    });
  }, [requestsWithNameAndDept, selectedDepartments, selectedLeaveType, scope, currentUser, myTeam]);

  const addHistoryLog = async (requestId, action) => { 
      if (!companyId) return;
      await addDoc(collection(db, 'companies', companyId, 'timeOffRequests', requestId, 'history'), { action, timestamp: serverTimestamp() }); 
    };
  const handleRequestSubmitted = (newRequestId) => { setIsAddModalOpen(false); addHistoryLog(newRequestId, 'Created'); };

  const handleUpdateRequestStatus = async (request, newStatus) => {
    if (!companyId) return;
    const employee = employees.find(e => e.email === request.userEmail);
    if (!employee) { console.error("Could not find employee to update balance."); return; }

    const requestRef = doc(db, 'companies', companyId, 'timeOffRequests', request.id);
    const employeeRef = doc(db, 'companies', companyId, 'employees', employee.id);
    
    const balanceFieldMap = { 'Vacation': 'vacationBalance', 'Sick Day': 'sickBalance', 'Personal (Unpaid)': 'personalBalance' };
    const balanceField = balanceFieldMap[request.leaveType];
    const days = request.totalDays;
    const batch = writeBatch(db);

    batch.update(requestRef, { status: newStatus });
    if (newStatus === 'Denied' && request.status === 'Pending') { batch.update(employeeRef, { [balanceField]: increment(days) }); }
    
    await batch.commit();
    await addHistoryLog(request.id, newStatus);
  };

  const handleDeleteClick = (request) => { setSelectedRequest(request); setIsDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!selectedRequest || !companyId) return;
    setIsDeleting(true);
    const employee = employees.find(e => e.email === selectedRequest.userEmail);
    const requestRef = doc(db, 'companies', companyId, 'timeOffRequests', selectedRequest.id);
    const batch = writeBatch(db);
    batch.delete(requestRef);
    if (employee && selectedRequest.status === 'Pending') {
        const balanceFieldMap = { 'Vacation': 'vacationBalance', 'Sick Day': 'sickBalance', 'Personal (Unpaid)': 'personalBalance' };
        const balanceField = balanceFieldMap[selectedRequest.leaveType];
        const days = selectedRequest.totalDays;
        const employeeRef = doc(db, 'companies', companyId, 'employees', employee.id);
        batch.update(employeeRef, { [balanceField]: increment(days) });
    }
    await batch.commit();
    setIsDeleteModalOpen(false); setSelectedRequest(null); setIsDeleting(false);
  };

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
      <RequestTimeOffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onrequestSubmitted={handleRequestSubmitted} currentUserProfile={currentUserProfile} myRequests={allRequests} weekends={weekends} holidays={holidays} allRequests={requestsWithNameAndDept} myTeam={myTeam} />
      <RequestDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} request={selectedRequest} onWithdraw={handleWithdrawRequest} onReschedule={handleRescheduleClick} />
      <RescheduleModal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} request={selectedRequest} onRescheduled={() => setSelectedRequest(null)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={`request from ${selectedRequest?.startDate}`} loading={isDeleting} />
      <DayDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} date={selectedDateForDrawer} events={eventsForDrawer} onViewRequest={handleViewRequestFromDrawer} />
      
      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Time Off</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"><Plus size={20} className="mr-2" />Request Time Off</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BalanceCard icon={<Plane />} title="Vacation" balance={currentUserProfile?.vacationBalance ?? '...'} bgColor="bg-blue-100" iconColor="text-blue-600" />
            {isManager && <BalanceCard icon={<UserCheck />} title="Pending Approvals" balance={pendingTeamRequests.length} bgColor="bg-orange-100" iconColor="text-orange-600" />}
            <BalanceCard icon={<Heart />} title="Sick Days" balance={currentUserProfile?.sickBalance ?? '...'} bgColor="bg-green-100" iconColor="text-green-600" />
            <BalanceCard icon={<Sun />} title="Personal (Unpaid)" balance={currentUserProfile?.personalBalance ?? '...'} bgColor="bg-purple-100" iconColor="text-purple-600" />
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
                    <div className="p-4 border-b flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-500"/>
                            <select value={scope} onChange={e => setScope(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm p-2">
                                <option value="Mine">My Requests</option>
                                {isManager && <option value="My Team">My Team</option>}
                                <option value="All">All Company</option>
                            </select>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Employee</th><th className="p-4 font-semibold text-gray-500 text-sm">Leave Type</th><th className="p-4 font-semibold text-gray-500 text-sm">Dates</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                        <tbody>
                            {loading ? (<tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>) 
                            : filteredRequestsForList.map(req => (
                                <tr key={req.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                    <td className="p-4 font-semibold text-gray-800">{req.employeeName}</td>
                                    <td className="p-4 text-gray-700">{req.leaveType}</td>
                                    <td className="p-4 text-gray-700">{req.startDate} to {req.endDate}</td>
                                    <td className="p-4"><span className={`text-xs font-bold py-1 px-2 rounded-full ${ req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>{req.status}</span></td>
                                    <td className="p-4">
                                        <button onClick={() => handleRowClick(req)} className="p-2 hover:bg-gray-200 rounded-full"><Eye size={16} className="text-gray-600" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'Calendar' && (
                <div>
                    <div className="p-4 border-b flex flex-wrap items-center gap-x-6 gap-y-4">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-500"/>
                            <select value={scope} onChange={e => setScope(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm p-2">
                                <option value="Mine">My View</option>
                                {isManager && <option value="My Team">My Team</option>}
                                <option value="All">All Company</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-600">Leave Type:</span>
                            <select value={selectedLeaveType} onChange={e => setSelectedLeaveType(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm p-2">
                                <option>All</option><option>Vacation</option><option>Sick Day</option><option>Personal (Unpaid)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-600">Departments:</span>
                            <div className="flex items-center gap-2 flex-wrap">
                                {uniqueDepartments.map(dept => (
                                    <button key={dept} onClick={() => handleDepartmentToggle(dept)} className={`text-xs font-semibold py-1 px-3 rounded-full ${selectedDepartments.includes(dept) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{dept}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <TeamCalendar events={filteredCalendarEvents} employees={employees} weekends={weekends} holidays={holidays} onDayClick={handleDayClick} />
                </div>
            )}
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
                                    <td className="p-4 text-gray-700">{req.leaveType}</td>
                                    <td className="p-4 text-gray-700">{req.startDate} to {req.endDate}</td>
                                    <td className="p-4 text-gray-700">{req.totalDays}</td>
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