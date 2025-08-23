import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { rescheduleTimeOffRequest } from '../services/timeOffService';

// Helper function to calculate business days (assuming weekends/holidays are passed as props if needed)
// For now, let's assume a simple version. A more robust implementation would share this logic from a utility file.
const calculateBusinessDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  let start = new Date(startDate);
  let end = new Date(endDate);
  let count = 0;
  const curDate = new Date(start.getTime());
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday and Saturday
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

function RescheduleModal({ isOpen, onClose, request, onRescheduled }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    if (request) {
      setStartDate(request.startDate);
      setEndDate(request.endDate);
    }
  }, [request]);

  useEffect(() => {
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      // In a real app, you'd pass weekends and holidays here
      const days = calculateBusinessDays(startDate, endDate);
      setTotalDays(days);
      setError('');
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      setError('Please select a valid date range.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await rescheduleTimeOffRequest(request.id, startDate, endDate, totalDays);
      onRescheduled();
      onClose();
    } catch (err) {
      setError('Failed to reschedule request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Reschedule Request</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select the new dates for your request. Please note that rescheduling will restart the approval process.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">New Start Date</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">New End Date</label>
                <input type="date" id="endDate" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4 flex items-center"><AlertCircle size={16} className="mr-2"/>{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Submitting...' : 'Submit Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RescheduleModal;