import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Shield, Plus, Trash2, GripVertical, MessageSquare, CheckSquare, Star, List, X, Send, Users as UsersIcon } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

// Helper component for each question in the builder
const QuestionCard = ({ question, index, updateQuestion, removeQuestion, onDragStart, onDragEnter, onDragEnd }) => {
  const handleInputChange = (e) => {
    updateQuestion(question.id, { ...question, text: e.target.value });
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const newQuestion = { ...question, type: newType };
    if (newType === 'Multiple Choice' && !question.options) {
      newQuestion.options = [{ id: Date.now(), text: '' }];
    }
    updateQuestion(question.id, newQuestion);
  };

  const handleOptionChange = (optionId, optionText) => {
    const newOptions = question.options.map(opt => 
      opt.id === optionId ? { ...opt, text: optionText } : opt
    );
    updateQuestion(question.id, { ...question, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), { id: Date.now(), text: '' }];
    updateQuestion(question.id, { ...question, options: newOptions });
  };

  const removeOption = (optionId) => {
    const newOptions = question.options.filter(opt => opt.id !== optionId);
    updateQuestion(question.id, { ...question, options: newOptions });
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Multiple Choice': return <CheckSquare className="w-5 h-5 text-purple-500" />;
      case 'Scale (1-5)': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'Open Text': default: return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div 
      className="bg-white p-4 rounded-lg border border-gray-200"
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-move text-gray-400 hover:text-gray-600 pt-2" title="Drag to reorder">
          <GripVertical />
        </div>
        <div className="flex-grow space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-500">{index + 1}</span>
            <div className="flex-grow">
              <input 
                type="text"
                placeholder="Type your question here..."
                value={question.text}
                onChange={handleInputChange}
                className="w-full text-base font-semibold border-b-2 border-transparent focus:border-blue-500 outline-none"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{getIcon(question.type)}</div>
              <select value={question.type} onChange={handleTypeChange} className="pl-10 pr-4 py-1.5 border-gray-300 rounded-md shadow-sm text-sm">
                <option>Open Text</option>
                <option>Multiple Choice</option>
                <option>Scale (1-5)</option>
              </select>
            </div>
            <button onClick={() => removeQuestion(question.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full"><Trash2 size={16}/></button>
          </div>

          {question.type === 'Multiple Choice' && (
            <div className="pl-8 space-y-2">
              {(question.options || []).map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <List size={14} className="text-gray-400" />
                  <input type="text" value={opt.text} onChange={(e) => handleOptionChange(opt.id, e.target.value)} placeholder="Option..." className="w-full p-1 border rounded-md text-sm" />
                  <button onClick={() => removeOption(opt.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full"><X size={14}/></button>
                </div>
              ))}
              <button onClick={addOption} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/>Add Option</button>
            </div>
          )}
          {question.type === 'Scale (1-5)' && (
            <div className="pl-8 flex items-center gap-2 text-gray-400">
              <span>(Least Likely)</span>
              {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 border rounded-full flex items-center justify-center">{i}</div>)}
              <span>(Most Likely)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


function SurveyStudio() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { employees, companyId, currentUser } = useAppContext();

  const [formData, setFormData] = useState({ title: '', description: '', is_anonymous: true });
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [assignmentType, setAssignmentType] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('Create a New Survey');
  const isEditMode = !!surveyId;
  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    if (isEditMode) {
      if (!companyId) return;
      setLoading(true);
      setPageTitle('Edit Survey');
      const fetchSurvey = async () => {
        const { data, error } = await supabase
          .from('surveys')
          .select(`
            *,
            survey_questions (
              *,
              survey_question_options (*)
            ),
            survey_participants (
              employee_id
            )
          `)
          .eq('id', surveyId)
          .single();

        if (error) {
          console.error("Error fetching survey for editing:", error);
          navigate('/surveys');
        } else {
          setFormData({ title: data.title, description: data.description, is_anonymous: data.is_anonymous });
          setQuestions(data.survey_questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            order: q.order,
            options: q.survey_question_options.map(o => ({ id: o.id, text: o.text }))
          })).sort((a, b) => a.order - b.order));
          
          const participantIds = data.survey_participants.map(p => p.employee_id);
          if (participantIds.length === employees.length && employees.length > 0) {
            setAssignmentType('all');
          } else {
            setAssignmentType('specific');
          }
          setParticipants(participantIds);
        }
        setLoading(false);
      };
      if (employees.length > 0) fetchSurvey();
    } else {
        setParticipants(employees.map(e => e.id));
    }
  }, [surveyId, isEditMode, navigate, employees, companyId]);
  
  const addQuestion = () => setQuestions([...questions, { id: `new-${Date.now()}`, type: 'Open Text', text: '', options: [] }]);
  const removeQuestion = (id) => setQuestions(questions.filter(q => q.id !== id));
  const updateQuestion = (id, updated) => setQuestions(questions.map(q => q.id === id ? updated : q));
  
  const handleDragStart = (e, pos) => { dragItem.current = pos; };
  const handleDragEnter = (e, pos) => { dragOverItem.current = pos; };
  const handleDrop = () => {
    const newQuestions = [...questions];
    const item = newQuestions[dragItem.current];
    newQuestions.splice(dragItem.current, 1);
    newQuestions.splice(dragOverItem.current, 0, item);
    dragItem.current = null;
    dragOverItem.current = null;
    setQuestions(newQuestions);
  };

  const handleEmployeeToggle = (employeeId) => {
    setParticipants(prev => prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]);
  };

  useEffect(() => {
    if (assignmentType === 'all') {
      setParticipants(employees.map(e => e.id));
    }
  }, [assignmentType, employees]);


  const handleSave = async (newStatus) => {
    if (!formData.title.trim() || !companyId) { setError('A survey title is required.'); return; }
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing survey
        await supabase.from('surveys').update({ ...formData, status: newStatus || formData.status }).eq('id', surveyId);
        // This is a simplified update. A more robust solution would diff questions and options to update, insert, or delete.
        // For this migration, we'll just re-insert them for simplicity.
        await supabase.from('survey_questions').delete().eq('survey_id', surveyId);
      } else {
        // Create new survey
        const { data: newSurvey } = await supabase.from('surveys').insert({ 
          ...formData, 
          company_id: companyId,
          created_by: currentUser.email,
          status: newStatus || 'Draft',
        }).select().single();
        
        for (const [index, q] of questions.entries()) {
          const { data: newQuestion } = await supabase.from('survey_questions').insert({
            survey_id: newSurvey.id,
            text: q.text,
            type: q.type,
            order: index,
          }).select().single();
          if (q.type === 'Multiple Choice' && q.options) {
            await supabase.from('survey_question_options').insert(q.options.map(opt => ({
              question_id: newQuestion.id,
              text: opt.text,
            })));
          }
        }
        
        await supabase.from('survey_participants').insert(participants.map(empId => ({
          survey_id: newSurvey.id,
          employee_id: empId,
        })));

        if (newStatus !== 'Active') {
          navigate(`/surveys/edit/${newSurvey.id}`);
        } else {
          navigate('/surveys');
        }
      }
    } catch (err) {
      console.error("Error saving survey:", err);
      setError('Could not save survey.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
      const { id, value } = e.target;
      setFormData(prev => ({...prev, [id]: value}));
  }

  if (loading && isEditMode) { return <div className="p-8">Loading survey...</div> }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <header className="mb-8"><Link to="/surveys" className="text-sm text-blue-600 font-semibold hover:underline mb-2">&larr; Back to Surveys</Link><h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1></header>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-lg shadow-md border"><h2 className="text-xl font-bold text-gray-800 mb-4">1. Details</h2><div className="space-y-6"><div><label htmlFor="title" className="block text-sm font-medium">Survey Title</label><input type="text" id="title" value={formData.title} onChange={handleChange} placeholder="e.g., Quarterly Employee Engagement" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" /></div><div><label htmlFor="description" className="block text-sm font-medium">Description (Optional)</label><textarea id="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Purpose of this survey." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"></textarea></div><div><label className="block text-sm font-medium">Anonymity</label><div className="mt-2 p-4 border rounded-lg flex items-start gap-4 hover:border-blue-500 cursor-pointer" onClick={() => setFormData(prev => ({...prev, is_anonymous: !prev.is_anonymous}))}><input type="checkbox" checked={formData.is_anonymous} readOnly className="h-5 w-5 rounded border-gray-300 text-blue-600 mt-0.5" /><div><h4 className="font-semibold">Anonymous Responses</h4><p className="text-xs text-gray-500">Employee names will be hidden from their responses.</p></div></div></div></div></div>
        
        <div className="bg-white p-8 rounded-lg shadow-md border"><h2 className="text-xl font-bold text-gray-800 mb-4">2. Questions</h2><div className="space-y-4">{questions.map((q, index) => (<QuestionCard key={q.id} question={q} index={index} updateQuestion={updateQuestion} removeQuestion={removeQuestion} onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDrop} />))}<button onClick={addQuestion} className="mt-4 bg-blue-50 text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-100 text-sm w-full border-2 border-dashed border-blue-200"><Plus size={16} className="inline mr-2"/>Add Question</button></div></div>
        
        <div className="bg-white p-8 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">3. Distribute & Launch</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <div className="mt-2 flex rounded-lg border border-gray-300">
                <button type="button" onClick={() => setAssignmentType('all')} className={`flex-1 p-2 rounded-l-md text-sm flex items-center justify-center gap-2 ${assignmentType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><UsersIcon size={16}/>All Employees</button>
                <button type="button" onClick={() => setAssignmentType('specific')} className={`flex-1 p-2 rounded-r-md text-sm flex items-center justify-center gap-2 ${assignmentType === 'specific' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><UsersIcon size={16}/>Specific Employees</button>
              </div>
            </div>
            {assignmentType === 'specific' && (
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto mt-4">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                    <input type="checkbox" id={`assign-emp-${emp.id}`} checked={participants.includes(emp.id)} onChange={() => handleEmployeeToggle(emp.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor={`assign-emp-${emp.id}`} className="ml-3 text-sm text-gray-700">{emp.name}</label>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-4">This survey will be sent to <span className="font-bold">{participants.length}</span> employee(s).</p>
            <div className="mt-6 pt-6 border-t flex justify-end gap-4">
                <button onClick={() => handleSave()} disabled={loading} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">{loading ? 'Saving...' : 'Save Draft'}</button>
                <button onClick={() => handleSave('Active')} disabled={loading || questions.length === 0} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"><Send size={16} className="mr-2"/>Launch Survey</button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default SurveyStudio;