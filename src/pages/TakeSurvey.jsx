import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Shield, Send } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function TakeSurvey() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { companyId, currentUser } = useAppContext();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!surveyId || !companyId || !currentUser) return;
    const fetchSurvey = async () => {
      const docRef = doc(db, 'companies', companyId, 'surveys', surveyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const surveyData = { id: docSnap.id, ...docSnap.data() };
        if (surveyData.responses?.some(r => r.userEmail === currentUser.email)) {
            navigate('/surveys'); // Already responded
        }
        setSurvey(surveyData);
      } else {
        navigate('/surveys');
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [surveyId, navigate, currentUser, companyId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!companyId || !currentUser) return;
    setLoading(true);
    setError('');
    try {
        const response = {
            userEmail: currentUser.email,
            submittedAt: new Date(),
            answers,
        };
        const surveyRef = doc(db, 'companies', companyId, 'surveys', surveyId);
        await updateDoc(surveyRef, {
            responses: arrayUnion(response)
        });
        navigate('/surveys');
    } catch(err) {
        setError('Failed to submit response. Please try again.');
        console.error(err);
        setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading survey...</div>;
  if (!survey) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <header className="mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">{survey.title}</h1>
        <p className="text-gray-500 mt-2">{survey.description}</p>
        {survey.isAnonymous && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <Shield size={20} className="text-blue-600"/>
                <p className="text-sm text-blue-800">This is an anonymous survey. Your name will not be linked to your responses.</p>
            </div>
        )}
      </header>
      
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md border space-y-8">
        {survey.questions.map((q, index) => (
            <div key={q.id}>
                <label className="block font-semibold text-gray-800">{index + 1}. {q.text}</label>
                {q.type === 'Open Text' && <textarea rows="4" onChange={e => handleAnswerChange(q.id, e.target.value)} className="mt-2 block w-full border-gray-300 rounded-md shadow-sm p-2" />}
                {q.type === 'Scale (1-5)' && (
                    <div className="mt-2 flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-md">
                        {[1,2,3,4,5].map(i => (
                            <button key={i} onClick={() => handleAnswerChange(q.id, i)} className={`w-10 h-10 rounded-full font-semibold transition-colors ${answers[q.id] === i ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-100'}`}>{i}</button>
                        ))}
                    </div>
                )}
                {q.type === 'Multiple Choice' && (
                    <div className="mt-2 space-y-2">
                        {q.options.map(opt => (
                            <label key={opt.id} className="flex items-center p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                                <input type="radio" name={q.id} value={opt.text} onChange={e => handleAnswerChange(q.id, e.target.value)} className="h-4 w-4 text-blue-600 border-gray-300"/>
                                <span className="ml-3 text-sm text-gray-700">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        ))}
        
        <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <Link to="/surveys" className="text-sm font-semibold text-gray-600 hover:underline">Cancel</Link>
            <button onClick={handleSubmit} disabled={loading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center">
                <Send size={16} className="mr-2"/>
                {loading ? 'Submitting...' : 'Submit Response'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default TakeSurvey;