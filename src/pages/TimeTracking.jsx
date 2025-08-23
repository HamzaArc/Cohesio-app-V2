import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash, Briefcase, Clock, ChevronLeft, ChevronRight, Send, UserCheck } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import EnterHoursModal from '../components/EnterHoursModal';
import EditHoursModal from '../components/EditHoursModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import AddProjectModal from '../components/AddProjectModal';

const TimeTrackingTab = ({ label, icon, active, onClick }) => ( <button onClick={onClick} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{icon}{label}</button> );
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

function TimeTracking() {
  const [allEntries, setAllEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('My Timesheet');
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    
    // --- NEW: More robust, chained data fetching ---
    const employeesQuery = query(collection(db, 'employees'), orderBy('name'));
    const unsubEmployees = onSnapshot(employeesQuery, (empSnap) => {
        const employeeList = empSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setEmployees(employeeList);
        setMyTeam(employeeList.filter(e => e.managerEmail === currentUser.email));

        const entriesQuery = query(collection(db, 'timeTrackingEntries'), orderBy('submittedAt', 'desc'));
        const unsubEntries = onSnapshot(entriesQuery, (entrySnap) => {
            setAllEntries(entrySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            
            const projectsQuery = query(collection(db, 'projects'), orderBy('name'));
            const unsubProjects = onSnapshot(projectsQuery, (projSnap) => {
                setProjects(projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false); // Only set loading false after all data is fetched
            });
            return () => unsubProjects();
        });
        return () => unsubEntries();
    });

    return () => unsubEmployees();
  }, [currentUser]);

  const myEntries = useMemo(() => allEntries.filter(e => e.userEmail === currentUser?.email), [allEntries, currentUser]);
  
  const teamTimesheets = useMemo(() => {
    const teamEmails = myTeam.map(e => e.email);
    const submitted = allEntries.filter(e => teamEmails.includes(e.userEmail) && e.status === 'Submitted');
    const grouped = {};
    submitted.forEach(entry => {
        const weekStart = getStartOfWeek(entry.date).toISOString().split('T')[0];
        const key = `${entry.userEmail}-${weekStart}`;
        if (!grouped[key]) {
            grouped[key] = { employeeName: employees.find(e => e.email === entry.userEmail)?.name || 'Unknown', weekStart, entries: [] };
        }
        grouped[key].entries.push(entry);
    });
    return Object.values(grouped);
  }, [allEntries, myTeam, employees]);

  const handleEditClick = (entry) => { setSelectedEntry(entry); setIsEditModalOpen(true); };
  const handleDeleteClick = (entry) => { setSelectedEntry(entry); setIsDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;
    setIsDeleting(true);
    await deleteDoc(doc(db, 'timeTrackingEntries', selectedEntry.id));
    setIsDeleteModalOpen(false);
    setSelectedEntry(null);
    setIsDeleting(false);
  };
  const handleAddHoursClick = (date) => { setPreselectedDate(date.toISOString().split('T')[0]); setIsEnterModalOpen(true); };

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeek);
        day.setDate(currentWeek.getDate() + i);
        days.push(day);
    }
    return days;
  }, [currentWeek]);

  const weekEntries = useMemo(() => {
    const weekMap = new Map();
    weekDays.forEach(day => {
        const dateString = day.toISOString().split('T')[0];
        const entriesForDay = myEntries.filter(e => e.date === dateString);
        weekMap.set(dateString, entriesForDay);
    });
    return weekMap;
  }, [myEntries, weekDays]);

  const weekTotal = useMemo(() => {
    let total = 0;
    weekEntries.forEach(dayEntries => {
        dayEntries.forEach(entry => {
            total += entry.hours || 0;
        });
    });
    return total;
  }, [weekEntries]);

  const goToPreviousWeek = () => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)));
  const goToNextWeek = () => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)));

  const handleSubmitWeek = async () => {
    const batch = writeBatch(db);
    weekEntries.forEach(dayEntries => {
        dayEntries.forEach(entry => {
            if (entry.status === 'Draft') {
                const docRef = doc(db, 'timeTrackingEntries', entry.id);
                batch.update(docRef, { status: 'Submitted' });
            }
        });
    });
    await batch.commit();
  };
  
  const handleApproveWeek = async (timesheet) => {
      const batch = writeBatch(db);
      timesheet.entries.forEach(entry => {
          const docRef = doc(db, 'timeTrackingEntries', entry.id);
          batch.update(docRef, { status: 'Approved' });
      });
      await batch.commit();
  };
  
  const handleDenyWeek = async (timesheet) => {
      const batch = writeBatch(db);
      timesheet.entries.forEach(entry => {
          const docRef = doc(db, 'timeTrackingEntries', entry.id);
          batch.update(docRef, { status: 'Denied' });
      });
      await batch.commit();
  };

  const renderContent = () => {
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    switch(activeTab) {
        case 'Team Timesheets':
            return (
                <div>
                    {teamTimesheets.length === 0 ? (
                        <p className="text-center text-gray-500 p-8">No timesheets have been submitted by your team.</p>
                    ) : (
                        teamTimesheets.map(timesheet => (
                            <div key={timesheet.weekStart + timesheet.employeeName} className="mb-4 p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{timesheet.employeeName}</p>
                                        <p className="text-sm text-gray-500">Week of {timesheet.weekStart}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDenyWeek(timesheet)} className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-200 text-sm">Deny</button>
                                        <button onClick={() => handleApproveWeek(timesheet)} className="bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 text-sm">Approve</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            );
        case 'My Projects':
            return (
                <div>
                    <button onClick={() => setIsProjectModalOpen(true)} className="mb-4 bg-blue-50 text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-100 text-sm flex items-center">
                        <Plus size={16} className="mr-2"/>Add Project
                    </button>
                    <div className="space-y-2">
                        {projects.map(p => <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border">{p.name}</div>)}
                    </div>
                </div>
            );
        case 'My Timesheet':
        default:
            const isWeekSubmittable = Array.from(weekEntries.values()).flat().some(e => e.status === 'Draft');
            return (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={goToPreviousWeek} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
                            <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
                            <h3 className="font-semibold text-gray-800">{weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Week Total</p>
                                <p className="font-bold text-xl text-gray-800">{weekTotal.toFixed(2)}</p>
                            </div>
                            {isWeekSubmittable && <button onClick={handleSubmitWeek} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"><Send size={16} className="mr-2"/>Submit Week</button>}
                        </div>
                    </div>
                    <div className="grid grid-cols-7 border-t border-l border-gray-200">
                        {weekDays.map(day => {
                            const dateString = day.toISOString().split('T')[0];
                            const dayEntries = weekEntries.get(dateString) || [];
                            const dayTotal = dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
                            return (
                                <div key={dateString} className="border-r border-b border-gray-200 p-2 min-h-[120px]">
                                    <div className="flex justify-between items-center"><p className="font-semibold text-sm">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p><p className="font-bold text-sm text-gray-800">{dayTotal.toFixed(2)}</p></div>
                                    <div className="mt-2 space-y-1">
                                        {dayEntries.map(entry => (
                                            <div key={entry.id} className={`p-1.5 rounded text-xs cursor-pointer hover:bg-gray-200 ${entry.status === 'Submitted' ? 'bg-yellow-100' : entry.status === 'Approved' ? 'bg-green-100' : entry.status === 'Denied' ? 'bg-red-100' : 'bg-gray-100'}`} onClick={() => handleEditClick(entry)}>
                                                <p className="font-semibold">{(entry.hours || 0).toFixed(2)} hrs</p>
                                                <p className="text-gray-600 truncate">{entry.project || 'No Project'}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => handleAddHoursClick(day)} className="w-full text-center text-blue-600 hover:bg-blue-50 rounded mt-2 p-1 text-xs font-semibold">+ Add</button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            );
    }
  };

  return (
    <>
      <EnterHoursModal isOpen={isEnterModalOpen} onClose={() => setIsEnterModalOpen(false)} onHoursSubmitted={() => setIsEnterModalOpen(false)} preselectedDate={preselectedDate} />
      <EditHoursModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} entry={selectedEntry} onHoursUpdated={() => setIsEditModalOpen(false)} />
      <AddProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onProjectAdded={() => setIsProjectModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={`time entry for ${selectedEntry?.date}`} loading={isDeleting} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Time Tracking</h1>
        </header>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <TimeTrackingTab label="My Timesheet" icon={<Clock size={16}/>} active={activeTab === 'My Timesheet'} onClick={() => setActiveTab('My Timesheet')} />
                <TimeTrackingTab label="Team Timesheets" icon={<UserCheck size={16}/>} active={activeTab === 'Team Timesheets'} onClick={() => setActiveTab('Team Timesheets')} />
                <TimeTrackingTab label="My Projects" icon={<Briefcase size={16}/>} active={activeTab === 'My Projects'} onClick={() => setActiveTab('My Projects')} />
            </div>
            <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    </>
  );
}

export default TimeTracking;
