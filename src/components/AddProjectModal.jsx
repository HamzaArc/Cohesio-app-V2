import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X } from 'lucide-react';

function AddProjectModal({ isOpen, onClose, onProjectAdded }) {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName) {
      setError('Please enter a project name.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'projects'), {
        name: projectName,
      });
      onProjectAdded();
      handleClose();
    } catch (err) {
      setError('Failed to add project.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Project</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
              <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProjectModal;
