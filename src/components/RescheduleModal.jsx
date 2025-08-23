import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, writeBatch, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, AlertCircle } from 'lucide-react';

function RescheduleModal({ isOpen, onClose, request, onRescheduled }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) {
      setStartDate(request.startDate);
      setEndDate(request.endDate);
    }
  }, [request]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      setError('Please select a valid date range.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);

      const requestRef = doc(db, 'timeOffRequests', request.id);
      batch.update(requestRef, {
        startDate,
        endDate,
        status: 'Pending', // Set status back to Pending
      });

      const historyColRef = collection(db, 'timeOffRequests', request.id, 'history');
      batch.set(doc(historyColRef), {
          action: 'Rescheduled',
          timestamp: serverTimestamp(),
      });

      await batch.commit();
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