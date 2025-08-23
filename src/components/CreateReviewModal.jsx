import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext'; // Import our new hook

function CreateReviewModal({ isOpen, onClose, onReviewCreated }) {
  const { employees } = useAppContext(); // Use the App Brain
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        const templatesSnapshot = await getDocs(collection(db, 'reviewTemplates'));
        setTemplates(templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchTemplates();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !selectedTemplate || !selectedEmployee || !dueDate) {
      setError('Please fill out all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const newReviewRef = await addDoc(collection(db, 'reviews'), {
        title,
        templateId: selectedTemplate,
        employeeId: selectedEmployee,
        dueDate,
        status: 'In Progress',
        created: serverTimestamp(),
      });
      onReviewCreated(newReviewRef.id);
      handleClose();
    } catch (err) {
      setError('Failed to create review. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setSelectedTemplate(''); setSelectedEmployee('');
    setDueDate(''); setError(''); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Review</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div><label htmlFor="title" className="block text-sm font-medium text-gray-700">Review Title</label><input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="selectedTemplate" className="block text-sm font-medium text-gray-700">Select Template</label><select id="selectedTemplate" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">Choose a template...</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label htmlFor="selectedEmployee" className="block text-sm font-medium text-gray-700">Select Employee (Reviewee)</label><select id="selectedEmployee" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">Choose an employee...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
            <div><label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label><input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Create Review'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateReviewModal;
