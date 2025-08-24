// src/components/EditTrainingModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const trainingCategories = ["Onboarding", "Compliance", "Leadership", "Sales", "Technical", "Other"];

function EditTrainingModal({ isOpen, onClose, program, onProgramUpdated }) {
  const { companyId } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Onboarding');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (program) {
      setTitle(program.title || '');
      setDescription(program.description || '');
      setCategory(program.category || 'Onboarding');
      setDueDate(program.due_date || '');
    }
  }, [program]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !companyId) { setError('Please enter a program title.'); return; }
    setLoading(true);
    setError('');

    try {
      await supabase
        .from('training_programs')
        .update({
            title,
            description,
            category,
            due_date: dueDate || null,
        })
        .eq('id', program.id);

      onProgramUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update program.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Edit Training Program</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <p className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-md mb-4">Note: Editing assigned employees or training steps is not currently supported after creation to maintain progress integrity.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">Program Title</label><input type="text" id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">Category</label><select id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">{trainingCategories.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label><textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
            <div><label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label><input type="date" id="edit-dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTrainingModal;