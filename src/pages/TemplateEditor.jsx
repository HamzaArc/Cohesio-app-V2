import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, MessageSquare, Star, GitBranch } from 'lucide-react';

function TemplateEditor() {
  const { templateId } = useParams();
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionType, setQuestionType] = useState('Text');

  useEffect(() => {
    if (!templateId) {
      setLoading(false);
      return;
    }
    const templateRef = doc(db, 'reviewTemplates', templateId);
    const unsubTemplate = onSnapshot(templateRef, (docSnap) => {
      if (docSnap.exists()) {
        setTemplate({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Template not found!");
      }
    });

    const questionsQuery = query(collection(db, 'reviewTemplates', templateId, 'questions'), orderBy('createdAt', 'asc'));
    const unsubQuestions = onSnapshot(questionsQuery, (snap) => {
        setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });

    return () => { unsubTemplate(); unsubQuestions(); };
  }, [templateId]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    await addDoc(collection(db, 'reviewTemplates', templateId, 'questions'), {
        text: newQuestion,
        type: questionType,
        createdAt: new Date(),
    });
    setNewQuestion('');
  };

  const handleDeleteQuestion = async (questionId) => {
    await deleteDoc(doc(db, 'reviewTemplates', templateId, 'questions', questionId));
  };

  const getQuestionIcon = (type) => {
      switch(type) {
          case 'Rating': return <Star size={20} className="text-yellow-500" />;
          case 'Yes/No': return <GitBranch size={20} className="text-purple-500" />;
          case 'Text':
          default: return <MessageSquare size={20} className="text-blue-500" />;
      }
  }

  if (loading) {
    return <div className="p-8">Loading Template...</div>;
  }

  if (!template) {
    return <div className="p-8">Template not found.</div>;
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/performance" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Performance</Link>
        <h1 className="text-3xl font-bold text-gray-800">Edit Template: {template.name}</h1>
        <p className="text-gray-500">{template.description}</p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Questions</h2>
        <div className="space-y-3 mb-6">
            {questions.map((q, index) => (
                <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="mr-3">{getQuestionIcon(q.type)}</div>
                        <p className="font-semibold text-gray-700">{index + 1}. {q.text}</p>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 hover:bg-gray-200 rounded-full"><Trash2 size={16} className="text-red-600" /></button>
                </div>
            ))}
             {questions.length === 0 && <p className="text-center text-gray-500 py-4">No questions added yet.</p>}
        </div>

        <form onSubmit={handleAddQuestion} className="border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-2">Add a new question</h3>
            <div className="flex gap-2 mb-2">
                <select value={questionType} onChange={e => setQuestionType(e.target.value)} className="border border-gray-300 rounded-md shadow-sm p-2 text-sm">
                    <option>Text</option>
                    <option>Rating</option>
                    <option>Yes/No</option>
                </select>
                <input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Type your question here..." className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 text-sm" />
            </div>
            <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                    <Plus size={16} className="mr-2" />
                    Add Question
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default TemplateEditor;
