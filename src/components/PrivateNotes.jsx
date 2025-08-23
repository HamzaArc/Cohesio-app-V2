import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { MessageSquare } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function PrivateNotes({ employeeId }) {
  const { companyId } = useAppContext();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId || !companyId) return;
    const notesColRef = collection(db, "companies", companyId, "employees", employeeId, "privateNotes");
    const q = query(notesColRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() 
      })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [employeeId, companyId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !companyId) return;
    const notesColRef = collection(db, "companies", companyId, "employees", employeeId, "privateNotes");
    await addDoc(notesColRef, {
      text: newNote,
      timestamp: serverTimestamp()
    });
    setNewNote('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Private Manager Notes</h3>
      <p className="text-sm text-gray-500 mb-4">These notes are only visible to managers and administrators. They are not visible to the employee.</p>
      
      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="mb-6">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add a time-stamped note..."
          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
          rows="3"
        />
        <div className="flex justify-end mt-2">
            <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 text-sm">
                Add Note
            </button>
        </div>
      </form>

      {/* Note List */}
      <div className="space-y-4">
        {notes.map(note => (
          <div key={note.id} className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <MessageSquare size={16} className="text-gray-500"/>
            </div>
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
              <p className="text-xs text-gray-400 mt-1">
                  {note.timestamp ? note.timestamp.toLocaleDateString() : 'Just now'}
              </p>
            </div>
          </div>
        ))}
        {notes.length === 0 && !loading && <p className="text-center text-gray-400 py-4 text-sm">No notes have been added yet.</p>}
      </div>
    </div>
  );
}

export default PrivateNotes;