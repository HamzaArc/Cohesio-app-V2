// src/pages/Training.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, Edit, Trash, Check, Library, Clock, Users, Eye, CheckCircle, X, Edit2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../contexts/AppContext';
import AddTrainingModal from '../components/AddTrainingModal';
import EditTrainingModal from '../components/EditTrainingModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import StatCard from '../components/StatCard';

// The TrainingDetailsModal is included here to maintain the original file structure
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

const TrainingTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

const categoryColors = {
  "Onboarding": "bg-blue-50 text-blue-600",
  "Compliance": "bg-red-50 text-red-600",
  "Leadership": "bg-purple-50 text-purple-600",
  "Sales": "bg-green-50 text-green-600",
  "Technical": "bg-indigo-50 text-indigo-600",
  "Other": "bg-gray-50 text-gray-600",
};

function Training() {
  const { employees, companyId, currentUser } = useAppContext();
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('My Training');

  useEffect(() => {
    if (!companyId) {
        setLoading(false);
        return;
    }
    
    const fetchTrainingData = async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select(`
          *,
          training_participants (
            *
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching training programs:", error);
      } else {
        setAllPrograms(data.map(p => ({...p, participants: p.training_participants})));
      }
      setLoading(false);
    };

    fetchTrainingData();

    const channel = supabase.channel('public:training_programs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_programs' }, fetchTrainingData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_participants' }, fetchTrainingData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const { myPrograms, stats } = useMemo(() => {
    if (!currentUser) return { myPrograms: [], stats: {} };

    const my = allPrograms.filter(p => 
      p.participants.some(participant => participant.user_email === currentUser.email)
    );

    const calculatedStats = {
        inProgress: my.filter(p => p.participants.find(part => part.user_email === currentUser.email)?.status !== 'Completed').length,
        completed: my.filter(p => p.participants.find(part => part.user_email === currentUser.email)?.status === 'Completed').length,
        overdue: allPrograms.filter(p => {
            const myParticipant = p.participants.find(part => part.user_email === currentUser.email);
            return p.due_date && new Date(p.due_date) < new Date() && myParticipant?.status !== 'Completed';
        }).length,
    };

    return { myPrograms: my, stats: calculatedStats };
  }, [allPrograms, currentUser]);
  
  const handleEditClick = (e, program) => { e.stopPropagation(); setSelectedProgram(program); setIsEditModalOpen(true); };
  const handleDeleteClick = (e, program) => { e.stopPropagation(); setSelectedProgram(program); setIsDeleteModalOpen(true); };
  const handleDetailsClick = (program) => { setSelectedProgram(program); setIsDetailsModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!selectedProgram || !companyId) return;
    setIsDeleting(true);
    await supabase.from('training_programs').delete().eq('id', selectedProgram.id);
    setIsDeleteModalOpen(false);
    setSelectedProgram(null);
    setIsDeleting(false);
  };
  
  const TrainingCard = ({ program }) => {
    const myParticipant = program.participants.find(p => p.user_email === currentUser.email);
    const status = myParticipant?.status || 'Assigned';
    const isOverdue = program.due_date && new Date(program.due_date) < new Date() && status !== 'Completed';

    const totalParticipants = program.participants.length;
    const completedCount = program.participants.filter(p => p.status === 'Completed').length;
    const completionRate = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0;
    const colorClass = categoryColors[program.category] || categoryColors["Other"];

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <span className={`text-xs font-semibold py-1 px-2.5 rounded-full ${colorClass}`}>{program.category || 'General'}</span>
            <div className="flex items-center gap-1">
                <button onClick={() => handleDetailsClick(program)} className="p-2 hover:bg-gray-100 rounded-full" title="View Details"><Eye size={18} className="text-gray-600" /></button>
                <button onClick={(e) => handleEditClick(e, program)} className="p-2 hover:bg-gray-100 rounded-full" title="Edit Program"><Edit size={18} className="text-gray-600" /></button>
                <button onClick={(e) => handleDeleteClick(e, program)} className="p-2 hover:bg-gray-100 rounded-full" title="Delete Program"><Trash size={18} className="text-red-600" /></button>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mt-2">{program.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{program.description}</p>
        </div>
        <div className="mt-6">
            {activeTab === 'Admin View' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1"><span>Team Progress</span><span>{completedCount}/{totalParticipants} Completed</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionRate}%`}}></div></div>
                </div>
            )}
            <button onClick={() => handleDetailsClick(program)} className="w-full text-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                {status === 'Completed' ? <CheckCircle size={16} /> : <BookOpen size={16} />}
                {status === 'Completed' ? 'View Completion' : 'Start Training'}
            </button>
            {isOverdue && <p className="text-xs text-red-600 text-center mt-2">This training is overdue.</p>}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center">Loading programs...</div>;
    
    const programsToDisplay = activeTab === 'My Training' ? myPrograms : allPrograms;

    return programsToDisplay.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-b-lg">
            <h3 className="text-lg font-semibold text-gray-800">No Training Programs Found</h3>
            <p className="text-gray-500 mt-1">{activeTab === 'My Training' ? "You have no assigned training." : "Get started by creating a new training program."}</p>
        </div>
    ) : (
        <div className="p-6 bg-gray-50 rounded-b-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programsToDisplay.map(p => <TrainingCard key={p.id} program={p} />)}
        </div>
    );
  };

  return (
    <>
      <AddTrainingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProgramAdded={() => setIsAddModalOpen(false)} />
      <EditTrainingModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={selectedProgram} onProgramUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedProgram?.title} loading={isDeleting} />
      <TrainingDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} program={selectedProgram} employees={employees} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Learning Hub</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            Create Program
          </button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Library size={24}/>} title="In Progress" value={stats.inProgress || 0} />
            <StatCard icon={<Check size={24}/>} title="Completed" value={stats.completed || 0} />
            <StatCard icon={<Clock size={24}/>} title="Overdue" value={stats.overdue || 0} />
            <StatCard icon={<Users size={24}/>} title="Total Programs" value={allPrograms.length} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <TrainingTab label="My Training" active={activeTab === 'My Training'} onClick={() => setActiveTab('My Training')} />
                <TrainingTab label="Admin View" active={activeTab === 'Admin View'} onClick={() => setActiveTab('Admin View')} />
            </div>
            {renderContent()}
        </div>
      </div>
    </>
  );
}

export default Training;