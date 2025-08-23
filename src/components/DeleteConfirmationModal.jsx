import React from 'react';
import { AlertTriangle } from 'lucide-react';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, employeeName, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <div className="mx-auto bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <AlertTriangle size={40} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Employee?</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-bold">{employeeName}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={onClose} 
            className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading}
            className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 disabled:bg-red-400"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
