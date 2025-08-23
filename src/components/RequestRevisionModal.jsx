import React, { useState } from 'react';
import { X } from 'lucide-react';

function RequestRevisionModal({ isOpen, onClose, document: doc, onSubmitRevision }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setLoading(true);
    onSubmitRevision(doc.id, 'Revision Requested', notes);
    setLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Request Revision</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Please provide a reason for requesting a revision for the document: <span className="font-semibold">{doc.name}</span>. Your manager will be notified.</p>
                <div>
                    <label htmlFor="revisionNotes" className="block text-sm font-medium text-gray-700">Reason / Notes</label>
                    <textarea 
                        id="revisionNotes" 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        rows="4" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>
            </div>
            <div className="p-6 border-t flex justify-end">
                <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={loading} className="bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400">
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default RequestRevisionModal;