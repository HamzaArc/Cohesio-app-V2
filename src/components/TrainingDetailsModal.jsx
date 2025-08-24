import React, { useMemo, useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Check, Edit2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../contexts/AppContext';

function TrainingDetailsModal({ isOpen, onClose, program, employees }) {
  const { companyId, currentUser } = useAppContext();
  const [steps, setSteps] = useState([]);
  const [notes, setNotes] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [currentStepId, setCurrentStepId] = useState(null);
  const [editingStepId, setEditingStepId] = useState(null);
  const [myParticipant, setMyParticipant] = useState(null);

  useEffect(() => {
    if (!program || !currentUser || !companyId) return;

    const myParticipantRecord = program.participants.find(p => p.user_email === currentUser.email);
    setMyParticipant(myParticipantRecord);

  }, [program, currentUser, companyId]);
  
  useEffect(() => {
    if (program && companyId) {
        const fetchSteps = async () => {
            const { data, error } = await supabase
                .from('training_steps')
                .select('*')
                .eq('program_id', program.id)
                .order('order', { ascending: true });
            if (error) console.error("Error fetching steps:", error);
            else setSteps(data);
        };
        fetchSteps();
    }
  }, [program, companyId]);

  const allParticipantsStatus = useMemo(() => {
    if (!program || !employees) return [];
    const employeeMap = new Map(employees.map(e => [e.email, e.name]));
    return (program.participants || []).map(p => ({
        ...p,
        name: employeeMap.get(p.user_email) || p.user_email,
        completionDate: p.completion_date ? new Date(p.completion_date).toLocaleDateString() : null,
    }));
  }, [program, employees]);

  const handleCompleteStep = async () => {
    if (!currentStepId || !myParticipant || !companyId) return;

    const stepsStatus = myParticipant.steps_status || [];
    const completedAt = new Date().toISOString();
    
    let stepFound = false;
    const updatedSteps = stepsStatus.map(s => {
        if (s.stepId === currentStepId) {
            stepFound = true;
            return { ...s, status: 'Completed', notes, completedAt };
        }
        return s;
    });

    if (!stepFound) {
        updatedSteps.push({ stepId: currentStepId, status: 'Completed', notes, completedAt });
    }

    const allTemplateStepsCompleted = steps.length > 0 && steps.every(templateStep =>
        updatedSteps.find(s => s.stepId === templateStep.id)?.status === 'Completed'
    );
    const finalStatus = allTemplateStepsCompleted ? 'Completed' : 'In Progress';
    const completionDate = allTemplateStepsCompleted ? completedAt : null;

    const { data, error } = await supabase
        .from('training_participants')
        .update({
            steps_status: updatedSteps,
            status: finalStatus,
            completion_date: completionDate
        })
        .eq('id', myParticipant.id)
        .select()
        .single();

    if (!error && data) {
        setMyParticipant(data); // Immediately update the local state
    }

    setCurrentStepId(null);
    setNotes('');
  };

  const handleUpdateNote = async (stepId) => {
    if (!companyId || !myParticipant) return;
    const updatedSteps = myParticipant.steps_status.map(s =>
        s.stepId === stepId ? { ...s, notes: editingNote } : s
    );
    
    const { data, error } = await supabase
        .from('training_participants')
        .update({ steps_status: updatedSteps })
        .eq('id', myParticipant.id)
        .select()
        .single();

    if (!error && data) {
        setMyParticipant(data); // Immediately update the local state
    }

    setEditingStepId(null);
    setEditingNote('');
  };

  if (!isOpen || !program) return null;

  const isMyTraining = !!myParticipant;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Training Details</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
        <div className="overflow-y-auto p-6">
            <div className="mb-6"><p className="text-sm text-gray-500">Program Name</p><h3 className="text-lg font-bold text-gray-800">{program.title}</h3>{program.description && <p className="text-sm text-gray-600 mt-1">{program.description}</p>}</div>
            
            {isMyTraining ? (
                <div>
                    <h4 className="font-bold text-gray-800 mb-2">My Progress</h4>
                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const stepStatusData = myParticipant.steps_status?.find(s => s.stepId === step.id);
                            const isCompleted = stepStatusData?.status === 'Completed';
                            return (
                                <div key={step.id} className={`p-4 rounded-lg border transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                    <div className="flex items-start justify-between">
                                        <p className="font-semibold text-gray-800 flex-1 pr-4">{index + 1}. {step.text}</p>
                                        {!isCompleted && <button onClick={() => setCurrentStepId(step.id)} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-full text-xs hover:bg-blue-700 flex-shrink-0">Complete Step</button>}
                                        {isCompleted && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
                                    </div>
                                    
                                    {isCompleted && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            {editingStepId === step.id ? (
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600">Edit your notes</label>
                                                    <textarea value={editingNote} onChange={(e) => setEditingNote(e.target.value)} rows="2" className="w-full border rounded-md p-2 mt-1 text-sm"></textarea>
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button onClick={() => setEditingStepId(null)} className="text-xs font-semibold text-gray-700">Cancel</button>
                                                        <button onClick={() => handleUpdateNote(step.id)} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-full text-xs">Save Note</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-600">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold">Completed on {new Date(stepStatusData.completedAt).toLocaleDateString()}</p>
                                                        <button onClick={() => { setEditingStepId(step.id); setEditingNote(stepStatusData.notes);}} className="flex items-center gap-1 font-semibold text-blue-600 hover:underline"><Edit2 size={12}/> Edit Note</button>
                                                    </div>
                                                    {stepStatusData.notes && <p className="mt-2 pt-2 border-t border-dashed border-green-200">{stepStatusData.notes}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {currentStepId === step.id && (
                                        <div className="mt-4 pt-4 border-t">
                                            <label className="text-xs font-medium text-gray-600">Add completion notes (optional)</label>
                                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" className="w-full border rounded-md p-2 mt-1 text-sm"></textarea>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setCurrentStepId(null)} className="text-xs font-semibold text-gray-700">Cancel</button>
                                                <button onClick={handleCompleteStep} className="bg-green-600 text-white font-semibold py-1 px-3 rounded-full text-xs">Confirm Completion</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div>
                    <h4 className="font-bold text-gray-800 mb-2">Participant Status</h4>
                    <div className="space-y-2 border rounded-lg p-2 max-h-80 overflow-y-auto">
                        {allParticipantsStatus.map((item, index) => (
                            <div key={index} className="p-2 rounded-md hover:bg-gray-50">
                                <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-700">{item.name}</p><span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status === 'Completed' ? <CheckCircle size={14} className="mr-1.5"/> : <Clock size={14} className="mr-1.5"/>}{item.status}</span></div>
                                {item.completionDate && <p className="text-xs text-gray-500 mt-1">Completed on: {item.completionDate}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <div className="mt-auto p-6 border-t flex justify-end">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

export default TrainingDetailsModal;