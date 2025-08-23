import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { X } from 'lucide-react';

function EnterHoursModal({ isOpen, onClose, onHoursSubmitted, preselectedDate }) {
  const [date, setDate] = useState('');
  const [project, setProject] = useState('');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [hourType, setHourType] = useState('Regular Hours');
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(preselectedDate || new Date().toISOString().split('T')[0]);
      const fetchProjects = async () => {
        const snapshot = await getDocs(collection(db, 'projects'));
        setProjects(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
      };
      fetchProjects();
    }
  }, [isOpen, preselectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !hours) {
      setError('Please enter a date and the number of hours.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user signed in.");

      await addDoc(collection(db, 'timeTrackingEntries'), {
        date,
        project,
        hours: parseFloat(hours),
        note,
        hourType,
        status: 'Draft', // New entries are now "Draft"
        submittedAt: serverTimestamp(),
        userEmail: currentUser.email, // Save the user's email
      });
      onHoursSubmitted();
      handleClose();
    } catch (err) {
      setError('Failed to submit hours. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDate(''); setProject(''); setHours(''); setNote('');
    setHourType('Regular Hours'); setError(''); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Enter Hours</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div><label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours</label><input type="number" step="0.01" id="hours" value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
              <div><label htmlFor="hourType" className="block text-sm font-medium text-gray-700">Hour Type</label><select id="hourType" value={hourType} onChange={(e) => setHourType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option>Regular Hours</option><option>Overtime</option></select></div>
            </div>
            <div><label htmlFor="project" className="block text-sm font-medium text-gray-700">Project (Optional)</label><select id="project" value={project} onChange={(e) => setProject(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
            <div><label htmlFor="note" className="block text-sm font-medium text-gray-700">Note (Optional)</label><textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Submitting...' : 'Submit Hours'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EnterHoursModal;
