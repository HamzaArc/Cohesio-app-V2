import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import { Plus, Users, Calendar, Gift, Briefcase, Check, XIcon } from 'lucide-react';

function Dashboard() {
  const { employees, companyId, currentUser } = useAppContext();
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserProfile = useMemo(() => {
    return employees.find(e => e.email === currentUser?.email);
  }, [employees, currentUser]);

  const myTeam = useMemo(() => {
    if (!currentUserProfile) return [];
    return employees.filter(e => e.managerEmail === currentUserProfile.email);
  }, [employees, currentUserProfile]);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    const requestsQuery = query(collection(db, 'companies', companyId, 'timeOffRequests'), orderBy('requestedAt', 'desc'));
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimeOffRequests(requests);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  const pendingApprovals = useMemo(() => {
    const teamEmails = new Set(myTeam.map(e => e.email));
    return timeOffRequests.filter(req => req.status === 'Pending' && teamEmails.has(req.userEmail));
  }, [timeOffRequests, myTeam]);

  const whoIsOut = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return timeOffRequests.filter(req => {
      if (req.status !== 'Approved') return false;
      const startDate = new Date(req.startDate);
      const endDate = new Date(req.endDate);
      return startDate <= endOfWeek && endDate >= startOfWeek;
    }).map(req => ({
      ...req,
      employeeName: employees.find(e => e.email === req.userEmail)?.name || 'Unknown'
    }));
  }, [timeOffRequests, employees]);
  
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextThirtyDays = new Date();
    nextThirtyDays.setDate(today.getDate() + 30);

    const events = [];
    employees.forEach(emp => {
      if (emp.hireDate) {
        const hireDate = new Date(emp.hireDate);
        const nextAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
        if (nextAnniversary < today) {
          nextAnniversary.setFullYear(today.getFullYear() + 1);
        }
        if (nextAnniversary <= nextThirtyDays) {
          events.push({ type: 'Anniversary', employeeName: emp.name, date: nextAnniversary });
        }
      }
      // Placeholder for birthday logic if birthday data existed
      // if (emp.birthDate) { ... }
    });
    return events.sort((a, b) => a.date - b.date);
  }, [employees]);


  if (loading) {
    return <div className="p-8">Loading Dashboard...</div>;
  }

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Good afternoon, {currentUserProfile?.name || 'Admin'}</h1>
          <p className="text-gray-500">Here's what's happening in your company today.</p>
        </div>
        <Link to="/people" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
          <Plus size={20} className="mr-2" />
          Add Employee
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Action Items */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Action Items</h2>
            {pendingApprovals.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {pendingApprovals.map(req => (
                  <li key={req.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-700">{employees.find(e => e.email === req.userEmail)?.name}</p>
                      <p className="text-sm text-gray-500">{req.leaveType} Request: {req.startDate} to {req.endDate}</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-2 bg-red-100 hover:bg-red-200 rounded-full"><XIcon size={16} className="text-red-600" /></button>
                       <button className="p-2 bg-green-100 hover:bg-green-200 rounded-full"><Check size={16} className="text-green-600" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-4">Your inbox is clear!</p>
            )}
          </div>

          {/* Who's Out */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Who's Out This Week</h2>
             {whoIsOut.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {whoIsOut.map(req => (
                   <div key={req.id} className="flex items-start py-2">
                      <img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${req.employeeName.charAt(0)}`} alt={req.employeeName} className="w-10 h-10 rounded-full mr-4" />
                      <div>
                          <p className="font-semibold text-gray-700">{req.employeeName}</p>
                          <p className="text-sm text-gray-500">{req.startDate} to {req.endDate}</p>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Everyone is in this week.</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Upcoming Events</h2>
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <li key={index} className="flex items-start">
                    <div className="p-2 bg-gray-100 rounded-full mr-4">
                      {event.type === 'Anniversary' ? <Briefcase className="text-gray-500" /> : <Gift className="text-gray-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{event.employeeName}'s {event.type}</p>
                      <p className="text-sm text-gray-500">{event.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
                <p className="text-center text-gray-500 py-4">No upcoming events in the next 30 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;