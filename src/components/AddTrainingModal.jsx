// src/components/AddTrainingModal.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, User, Users, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const trainingCategories = ["Onboarding", "Compliance", "Leadership", "Sales", "Technical", "Other"];

function AddTrainingModal({ isOpen, onClose, onProgramAdded }) {
  const { employees, companyId } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Onboarding');
  const [steps, setSteps] = useState([{ id: Date.now(), text: '' }]);
  const [dueDate, setDueDate] = useState('');
  const [assignedEmails, setAssignedEmails] = useState([]);
  const [assignmentType, setAssignmentType] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStepChange = (id, text) => {
    setSteps(steps.map(step => step.id === id ? { ...step, text } : step));
  };
  const handleAddStep = () => setSteps([...steps, { id: Date.now(), text: '' }]);
  const handleRemoveStep = (id) => setSteps(steps.filter(step => step.id !== id));

  const handleEmployeeToggle = (email) => {
    setAssignedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || steps.some(s => !s.text.trim()) || !companyId) {
      setError('Please provide a title and ensure all steps have text.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: programData, error: programError } = await supabase
        .from('training_programs')
        .insert({
            title,
            description,
            category,
            due_date: dueDate || null,
            company_id: companyId,
        })
        .select()
        .single();
      
      if (programError) throw programError;

      const stepsToInsert = steps.map((step, index) => ({
        program_id: programData.id,
        text: step.text,
        order: index
      }));

      if (stepsToInsert.length > 0) {
        const { error: stepsError } = await supabase.from('training_steps').insert(stepsToInsert);
        if (stepsError) throw stepsError;
      }
      
      let finalAssignedEmails = [];
      if (assignmentType === 'all') {
        finalAssignedEmails = employees.map(e => e.email);
      } else {
        finalAssignedEmails = assignedEmails;
      }

      const participantsToInsert = finalAssignedEmails.map(email => {
          const employee = employees.find(e => e.email === email);
          return {
            program_id: programData.id,
            employee_id: employee.id,
            user_email: email,
            status: 'Assigned',
            steps_status: steps.map(step => ({ stepId: step.id.toString(), status: 'Pending', notes: '', completedAt: null }))
          };
      });
      
      if (participantsToInsert.length > 0) {
        const { error: participantsError } = await supabase.from('training_participants').insert(participantsToInsert);
        if (participantsError) throw participantsError;
      }
      
      onProgramAdded();
      handleClose();
    } catch (err) {
      setError('Failed to add program. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setCategory('Onboarding'); setSteps([{ id: Date.now(), text: '' }]);
    setDueDate(''); setAssignedEmails([]); setAssignmentType('all');
    setError(''); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Create Training Program</h2><button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="title" className="block text-sm font-medium text-gray-700">Program Title</label><input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">{trainingCategories.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Steps</label>
                <div className="space-y-2">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2">
                            <span className="text-gray-500">{index + 1}.</span>
                            <input type="text" value={step.text} onChange={(e) => handleStepChange(step.id, e.target.value)} placeholder="e.g., Watch the safety video" className="flex-grow border border-gray-300 rounded-md p-2 text-sm" />
                            <button type="button" onClick={() => handleRemoveStep(step.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddStep} className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/>Add Step</button>
            </div>

            <div><label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label><input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <div className="mt-2 flex rounded-lg border border-gray-300">
                <button type="button" onClick={() => setAssignmentType('all')} className={`flex-1 p-2 rounded-l-md text-sm flex items-center justify-center gap-2 ${assignmentType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><Users size={16}/>All Employees</button>
                <button type="button" onClick={() => setAssignmentType('specific')} className={`flex-1 p-2 rounded-r-md text-sm flex items-center justify-center gap-2 ${assignmentType === 'specific' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><User size={16}/>Specific Employees</button>
              </div>
            </div>

            {assignmentType === 'specific' && (
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                    <input type="checkbox" id={`add-emp-${emp.id}`} checked={assignedEmails.includes(emp.email)} onChange={() => handleEmployeeToggle(emp.email)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor={`add-emp-${emp.id}`} className="ml-3 text-sm text-gray-700">{emp.name}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Program'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTrainingModal;