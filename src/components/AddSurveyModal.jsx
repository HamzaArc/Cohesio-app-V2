import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';

function AddSurveyModal({ isOpen, onClose, onSurveyAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError('Please enter a survey title.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'surveys'), {
        title,
        description,
        status: 'Active',
        responses: '0/20', // Placeholder
        created: serverTimestamp(),
      });
      onSurveyAdded();
      handleClose();
    } catch (err) {
      setError('Failed to create survey. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Survey</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Survey Title</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-[#4A1D4A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#6E2A6E] disabled:bg-gray-400">
              {loading ? 'Saving...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSurveyModal;
