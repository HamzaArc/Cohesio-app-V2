import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Users } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { createTimeOffRequest } from '../services/timeOffService';

// --- Helper Functions ---
const isWeekend = (date, weekends = { sat: true, sun: true }) => {
    const day = date.getDay();
    const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const weekendDays = Object.keys(weekends).filter(d => weekends[d]).map(d => map[d]);
    return weekendDays.includes(day);
};

const isHoliday = (date, holidays) => {
    const dateString = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateString);
};

const getNextBusinessDay = (startDate, weekends, holidays) => {
    let currentDate = new Date(startDate);
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());
    while (isWeekend(currentDate, weekends) || isHoliday(currentDate, holidays)) {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return currentDate;
};

function calculateBusinessDays(startDate, endDate, weekends, holidays) {
  if (!startDate || !endDate) return 0;
  let start = new Date(startDate);
  let end = new Date(endDate);
  let count = 0;
  const holidayDates = new Set(holidays.map(h => h.date));
  const weekendDays = Object.keys(weekends).filter(day => weekends[day]).map(day => {
      const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      return map[day];
  });
  const curDate = new Date(start.getTime());
  curDate.setMinutes(curDate.getMinutes() + curDate.getTimezoneOffset());
  end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    const dateString = curDate.toISOString().split('T')[0];
    if (!weekendDays.includes(dayOfWeek) && !holidayDates.has(dateString)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// --- Main Component ---
function RequestTimeOffModal({ isOpen, onClose, onrequestSubmitted, currentUserProfile, myRequests, weekends, holidays, allRequests, myTeam }) {
  const { companyId, currentUser } = useAppContext();
  const [leaveType, setLeaveType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedDates, setSuggestedDates] = useState(null);
  
  const balanceFieldMap = { 'Vacation': 'vacationBalance', 'Sick Day': 'sickBalance', 'Personal (Unpaid)': 'personalBalance' };

  useEffect(() => {
    if (isOpen) {
      const nextBusinessDay = getNextBusinessDay(new Date(), weekends, holidays);
      setStartDate(nextBusinessDay.toISOString().split('T')[0]);
    }
  }, [isOpen, weekends, holidays]);

  useEffect(() => {
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      const days = calculateBusinessDays(startDate, endDate, weekends, holidays);
      setTotalDays(days);
      setError('');
      setSuggestedDates(null); // Clear suggestion when dates change
    } else {
      setTotalDays(0);
      if (startDate && endDate) { setError('End date cannot be before the start date.'); }
    }
  }, [startDate, endDate, weekends, holidays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error || !startDate || !endDate || totalDays <= 0 || !companyId) {
      setError('Please select a valid date range.');
      return;
    }
    setLoading(true);
    setError('');
    setSuggestedDates(null);

    try {
      if (!currentUser || !currentUserProfile) throw new Error("Could not find user profile.");

      const balanceField = balanceFieldMap[leaveType];
      const currentBalance = currentUserProfile[balanceField.replace(/_/g, '')] ?? 0;

      if (leaveType !== 'Personal (Unpaid)' && currentBalance < totalDays) {
        setError(`Insufficient balance. You only have ${currentBalance} day(s) remaining.`);
        setLoading(false);
        return;
      }

      const isOverlapping = myRequests.some(req =>
        (req.status === 'Pending' || req.status === 'Approved') &&
        new Date(startDate) <= new Date(req.endDate) &&
        new Date(endDate) >= new Date(req.startDate)
      );

      if (isOverlapping) {
        setError("You already have a request that overlaps with these dates.");
        // Suggestion logic can be kept if desired, but simplified here for clarity
        setLoading(false);
        return;
      }

      const newRequestData = {
        company_id: companyId,
        employee_id: currentUserProfile.id,
        user_email: currentUser.email,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        description: description,
        requested_at: new Date().toISOString(),
      };

      await createTimeOffRequest(newRequestData);
      onrequestSubmitted();
      handleClose();
    } catch (err) {
      setError('Failed to submit request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = () => {
      if (suggestedDates) {
          setStartDate(suggestedDates.start);
          setEndDate(suggestedDates.end);
          setSuggestedDates(null);
          setError('');
      }
  };

  const handleClose = () => {
    setLeaveType('Vacation'); setStartDate(''); setEndDate('');
    setDescription(''); setTotalDays(0); setError(''); setSuggestedDates(null);
    onClose();
  };

  const teamAvailability = useMemo(() => {
    if (!myTeam || !allRequests || !startDate || !endDate) return [];
    const teamEmails = new Set(myTeam.map(e => e.email));
    const start = new Date(startDate);
    const end = new Date(endDate);

    return allRequests.filter(req => 
      req.status === 'Approved' &&
      teamEmails.has(req.userEmail) &&
      start <= new Date(req.endDate) &&
      end >= new Date(req.startDate)
    );
  }, [myTeam, allRequests, startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Request Time Off</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select id="leaveType" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option>Vacation</option>
                <option>Sick Day</option>
                <option>Personal (Unpaid)</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" id="endDate" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
            </div>
            
            <div className="md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Summary</h3>
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">Current Balance</p>
                <p className="font-medium text-gray-800">{currentUserProfile?.[balanceFieldMap[leaveType].replace(/_/g, '')] ?? 0} days</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">Days Requested</p>
                <p className="font-medium text-gray-800">{totalDays} days</p>
              </div>
              <div className="flex justify-between items-center text-base border-t pt-3 mt-2">
                <p className="font-semibold text-gray-800">Remaining Balance</p>
                <p className="font-bold text-blue-600">
                  {leaveType !== 'Personal (Unpaid)' ? (currentUserProfile?.[balanceFieldMap[leaveType].replace(/_/g, '')] ?? 0) - totalDays : 'N/A'} days
                </p>
              </div>
            </div>

            {teamAvailability.length > 0 && (
                <div className="md:col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                        <Users size={20} className="text-yellow-700 mr-3"/>
                        <h3 className="font-semibold text-yellow-800 text-sm">Team Members Also Away</h3>
                    </div>
                    <ul className="text-xs text-yellow-700 mt-2 pl-8 list-disc">
                        {teamAvailability.map(req => <li key={req.id}>{req.employeeName} ({req.startDate} to {req.endDate})</li>)}
                    </ul>
                </div>
            )}
          </div>
          
          {error && <p className="text-red-500 text-sm mt-4 flex items-center"><AlertCircle size={16} className="mr-2"/>{error}</p>}

          {suggestedDates && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-sm text-blue-800">Conflict found. How about <span className="font-semibold">{suggestedDates.start}</span> to <span className="font-semibold">{suggestedDates.end}</span>?</p>
                <button type="button" onClick={handleApplySuggestion} className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 py-1 px-3 rounded-full">Use these dates</button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestTimeOffModal;