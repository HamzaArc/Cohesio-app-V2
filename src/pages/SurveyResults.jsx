import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Percent, CheckCircle, Clock, Shield } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAppContext } from '../contexts/AppContext';

function SurveyResults() {
  const { surveyId } = useParams();
  const { employees, companyId } = useAppContext();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Results');

  useEffect(() => {
    if (!surveyId || !companyId) return;
    const fetchSurvey = async () => {
      const docRef = doc(db, 'companies', companyId, 'surveys', surveyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSurvey({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [surveyId, companyId]);

  const { resultsData, participationData, stats } = useMemo(() => {
    if (!survey || employees.length === 0) return { resultsData: {}, participationData: [], stats: {} };
    
    const employeeMap = new Map(employees.map(e => [e.email, e.name]));
    const responseMap = new Map((survey.responses || []).map(r => [r.userEmail, r]));

    const pData = (survey.participants || []).map(email => {
        const response = responseMap.get(email);
        return {
            name: employeeMap.get(email) || email,
            status: response ? 'Responded' : 'Not Yet Responded',
            submittedAt: response ? response.submittedAt.toDate().toLocaleString() : null
        };
    });

    const questionResults = {};
    (survey.questions || []).forEach(q => {
      const responsesForQuestion = (survey.responses || []).map(r => ({
          answer: r.answers[q.id],
          userEmail: r.userEmail,
          submittedAt: r.submittedAt
      })).filter(ans => ans.answer !== undefined);

      if (q.type === 'Multiple Choice') {
        const answerCounts = responsesForQuestion.map(r => r.answer);
        questionResults[q.id] = { type: q.type, text: q.text, data: q.options.map(opt => ({ name: opt.text, count: answerCounts.filter(ans => ans === opt.text).length })) };
      } else if (q.type === 'Scale (1-5)') {
        const answers = responsesForQuestion.map(r => r.answer).filter(Boolean);
        const avg = answers.length > 0 ? answers.reduce((a,b) => a+b, 0) / answers.length : 0;
        questionResults[q.id] = { type: q.type, text: q.text, average: avg.toFixed(2), data: [1,2,3,4,5].map(i => ({ name: `${i} Star`, count: answers.filter(ans => ans === i).length })) };
      } else { // Open Text
        questionResults[q.id] = { type: q.type, text: q.text, data: responsesForQuestion };
      }
    });

    const pRate = survey.participants?.length > 0 ? ((survey.responses?.length || 0) / survey.participants.length) * 100 : 0;

    return { 
        resultsData: questionResults,
        participationData: pData,
        stats: {
            responses: survey.responses?.length || 0,
            participationRate: pRate.toFixed(0)
        }
    };
  }, [survey, employees]);

  if (loading) return <div className="p-8">Loading results...</div>;
  if (!survey) return <div className="p-8">Survey not found.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <header className="mb-8">
        <Link to="/surveys" className="text-sm text-blue-600 font-semibold hover:underline mb-2">&larr; Back to Surveys</Link>
        <h1 className="text-3xl font-bold text-gray-800">Survey Results</h1>
        <p className="text-gray-500">{survey.title}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<Users />} title="Total Responses" value={stats.responses} />
        <StatCard icon={<Percent />} title="Participation Rate" value={`${stats.participationRate}%`} />
        {survey.isAnonymous && <StatCard icon={<Shield />} title="Anonymity" value="Enabled" />}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-2 flex">
            <button onClick={() => setActiveTab('Results')} className={`py-3 px-4 text-sm font-semibold transition-colors ${ activeTab === 'Results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>Results</button>
            <button onClick={() => setActiveTab('Participants')} className={`py-3 px-4 text-sm font-semibold transition-colors ${ activeTab === 'Participants' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>Participants</button>
        </div>
        {activeTab === 'Results' && (
            <div className="p-6 space-y-8">
                {(survey.questions || []).map(q => {
                const result = resultsData[q.id];
                if(!result) return null;
                return (
                    <div key={q.id}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{q.text}</h3>
                        {result.type === 'Multiple Choice' && (<ResponsiveContainer width="100%" height={result.data.length * 40}><BarChart data={result.data} layout="vertical" margin={{left: 120}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: '#f3f4f6'}} /><Bar dataKey="count" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>)}
                        {result.type === 'Scale (1-5)' && (<div className="p-4 bg-gray-50 rounded-lg"><p className="text-center font-bold text-4xl text-blue-600 mb-2">{result.average}</p><p className="text-sm text-gray-500 text-center">Average Rating</p></div>)}
                        {result.type === 'Open Text' && (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {result.data.map((res, i) => (
                                <div key={i} className="p-3 bg-gray-50 border rounded-md">
                                  <p className="text-sm text-gray-700 italic">"{res.answer}"</p>
                                  {!survey.isAnonymous && (
                                    <div className="text-right text-xs text-gray-400 mt-2 pt-2 border-t border-dashed">
                                      - {employees.find(e => e.email === res.userEmail)?.name} on {res.submittedAt.toDate().toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                    </div>
                )
                })}
            </div>
        )}
        {activeTab === 'Participants' && (
            <div className="p-6">
                <table className="w-full text-left">
                    <thead><tr className="border-b"><th className="p-2 font-semibold text-gray-500 text-sm">Participant</th><th className="p-2 font-semibold text-gray-500 text-sm">Status</th><th className="p-2 font-semibold text-gray-500 text-sm">Submitted On</th></tr></thead>
                    <tbody>
                        {participationData.map((p, i) => (
                            <tr key={i} className="border-b last:border-0">
                                <td className="p-2 font-medium">{p.name}</td>
                                <td className="p-2">
                                    <span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full w-fit ${p.status === 'Responded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {p.status === 'Responded' ? <CheckCircle size={14} className="mr-1.5"/> : <Clock size={14} className="mr-1.5"/>}
                                        {p.status}
                                    </span>
                                </td>
                                <td className="p-2 text-sm text-gray-600">{p.submittedAt || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}

export default SurveyResults;