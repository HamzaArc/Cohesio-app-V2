import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function AddJourneyEventModal({ isOpen, onClose, onEventAdded, employeeId }) {
  const { companyId } = useAppContext();
  const [eventType, setEventType] = useState('Salary Change');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventType || !effectiveDate || !details || !companyId) {
      setError('Please fill out all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // We create the event inside a subcollection of the employee
      const journeyCollectionRef = collection(db, 'companies', companyId, 'employees', employeeId, 'journey');
      await addDoc(journeyCollectionRef, {
        type: eventType,
        date: effectiveDate,
        details,
        createdAt: serverTimestamp(),
      });
      onEventAdded();
      handleClose();
    } catch (err) {
      setError('Failed to add event. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEventType('Salary Change');
    setEffectiveDate('');
    setDetails('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Journey Event</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Event Type</label>
              <select id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option>Salary Change</option>
                <option>Promotion</option>
                <option>Title Change</option>
                <option>Department Change</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">Effective Date</label>
              <input type="date" id="effectiveDate" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">Details / Description</label>
              <input type="text" id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g., To $80,000/year" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-[#4A1D4A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#6E2A6E] disabled:bg-gray-400">
              {loading ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddJourneyEventModal;