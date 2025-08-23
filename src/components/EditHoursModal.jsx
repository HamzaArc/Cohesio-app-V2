import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { X } from 'lucide-react';

function EditHoursModal({ isOpen, onClose, entry, onHoursUpdated }) {
  const [formData, setFormData] = useState({});
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date || '',
        project: entry.project || '',
        hours: entry.hours || '',
        note: entry.note || '',
        hourType: entry.hourType || 'Regular Hours',
      });
    }
    if (isOpen) {
        const fetchProjects = async () => {
            const snapshot = await getDocs(collection(db, 'projects'));
            setProjects(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        };
        fetchProjects();
    }
  }, [entry, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const entryRef = doc(db, 'timeTrackingEntries', entry.id);
      await updateDoc(entryRef, {
          ...formData,
          hours: Number(formData.hours)
      });
      onHoursUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update entry.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Time Entry</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div><label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours</label><input type="number" step="0.01" id="hours" value={formData.hours} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
              <div><label htmlFor="hourType" className="block text-sm font-medium text-gray-700">Hour Type</label><select id="hourType" value={formData.hourType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option>Regular Hours</option><option>Overtime</option></select></div>
            </div>
            <div><label htmlFor="project" className="block text-sm font-medium text-gray-700">Project (Optional)</label><select id="project" value={formData.project} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
            <div><label htmlFor="note" className="block text-sm font-medium text-gray-700">Note (Optional)</label><textarea id="note" value={formData.note} onChange={handleChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditHoursModal;
