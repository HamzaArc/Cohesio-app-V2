// src/components/PrivateNotes.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // UPDATED: Import Supabase
import { MessageSquare } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function PrivateNotes({ employeeId }) {
  const { companyId } = useAppContext();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  // SUPABASE: Fetch notes
  useEffect(() => {
    if (!employeeId || !companyId) return;
    
    const fetchNotes = async () => {
        const { data, error } = await supabase
            .from('private_notes')
            .select('*')
            .eq('employee_id', employeeId)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error("Error fetching notes:", error);
        } else {
            setNotes(data.map(note => ({
                ...note,
                timestamp: new Date(note.timestamp)
            })));
        }
        setLoading(false);
    };
    
    fetchNotes();

    // Optional Realtime Subscription
    const subscription = supabase
        .channel(`private_notes:${employeeId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'private_notes', filter: `employee_id=eq.${employeeId}` },
            () => fetchNotes()
        )
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, [employeeId, companyId]);

  // SUPABASE: Add new note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !companyId) return;

    await supabase
      .from('private_notes')
      .insert({ text: newNote, employee_id: employeeId, company_id: companyId });

    setNewNote('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Private Manager Notes</h3>
      <p className="text-sm text-gray-500 mb-4">These notes are only visible to managers and administrators. They are not visible to the employee.</p>
      
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