import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, CheckCircle, Clock, BarChart2, Users } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import StatCard from '../components/StatCard';
import { useAppContext } from '../contexts/AppContext';

const SurveyTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function Surveys() {
  const { employees, companyId, currentUser } = useAppContext();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('Admin View');
  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId) {
        setLoading(false);
        return;
    }
    const q = query(collection(db, 'companies', companyId, 'surveys'), orderBy('created', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSurveys(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  const { mySurveys, stats } = useMemo(() => {
    if (!currentUser) return { mySurveys: [], stats: {} };
    
    const active = surveys.filter(s => s.status === 'Active').length;
    const closed = surveys.filter(s => s.status === 'Closed').length;
    const totalParticipants = surveys.reduce((acc, s) => acc + (s.participants?.length || 0), 0);
    const totalResponses = surveys.reduce((acc, s) => acc + (s.responses?.length || 0), 0);
    const completionRate = totalParticipants > 0 ? (totalResponses / totalParticipants) * 100 : 0;
    
    const my = surveys.filter(s => {
        const hasResponded = s.responses?.some(r => r.userEmail === currentUser.email);
        return s.status === 'Active' && s.participants?.includes(currentUser.email) && !hasResponded;
    });

    return { 
      mySurveys: my,
      stats: { active, closed, completionRate: completionRate.toFixed(0) }
    };
  }, [surveys, currentUser]);

  const handleDeleteClick = (e, survey) => {
    e.stopPropagation();
    setSelectedSurvey(survey);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSurvey || !companyId) return;
    setIsDeleting(true);
    await deleteDoc(doc(db, 'companies', companyId, 'surveys', selectedSurvey.id));
    setIsDeleteModalOpen(false);
    setSelectedSurvey(null);
    setIsDeleting(false);
  };

  const handleAdminCardClick = (survey) => {
    if (survey.status === 'Draft') {
      navigate(`/surveys/edit/${survey.id}`);
    } else {
      navigate(`/surveys/results/${survey.id}`);
    }
  };
  
  const handleUserCardClick = (survey) => {
      navigate(`/surveys/take/${survey.id}`);
  };
  
  const SurveyCard = ({ survey, isAdmin }) => {
    const participantCount = survey.participants?.length || 0;
    const responseCount = survey.responses?.length || 0;
    const completion = participantCount > 0 ? (responseCount / participantCount) * 100 : 0;

    return (
      <div onClick={() => isAdmin ? handleAdminCardClick(survey) : handleUserCardClick(survey)} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col hover:shadow-md hover:border-blue-500 cursor-pointer transition-all">
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold py-1 px-2 rounded-full ${survey.status === 'Active' ? 'bg-green-100 text-green-700' : survey.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{survey.status}</span>
            <div className="flex items-center gap-1">
                {isAdmin && survey.status === 'Draft' && <div className="p-2 text-gray-400" title="Edit Survey"><Edit size={16} /></div>}
                {isAdmin && survey.status !== 'Draft' && <div className="p-2 text-gray-400" title="View Results"><BarChart2 size={16} /></div>}
                {isAdmin && <button onClick={(e) => handleDeleteClick(e, survey)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-600"><Trash size={16} /></button>}
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mt-2">{survey.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{survey.description}</p>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{responseCount} / {participantCount} Responses</span>
            <span>{Math.round(completion)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completion}%`}}></div></div>
        </div>
      </div>
    )
  };

  if (loading) { return <div className="p-8 text-center">Loading surveys...</div>; }

  return (
    <>
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedSurvey?.title} loading={isDeleting} />
      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Employee Surveys</h1>
          <button onClick={() => navigate('/surveys/create')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" /> Create Survey
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Clock size={24}/>} title="Active Surveys" value={stats.active} />
            <StatCard icon={<CheckCircle size={24}/>} title="Closed Surveys" value={stats.closed} />
            <StatCard icon={<BarChart2 size={24}/>} title="Avg. Completion" value={`${stats.completionRate}%`} />
            <StatCard icon={<Users size={24}/>} title="Total Employees" value={employees.length} />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <SurveyTab label="My Surveys" active={activeTab === 'My Surveys'} onClick={() => setActiveTab('My Surveys')} />
                <SurveyTab label="Admin View" active={activeTab === 'Admin View'} onClick={() => setActiveTab('Admin View')} />
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'Admin View' && surveys.map(s => <SurveyCard key={s.id} survey={s} isAdmin={true} />)}
                    {activeTab === 'My Surveys' && mySurveys.map(s => <SurveyCard key={s.id} survey={s} isAdmin={false} />)}
                </div>
                 {activeTab === 'My Surveys' && mySurveys.length === 0 && <p className="text-center text-gray-500 py-12">You have no active surveys assigned to you.</p>}
                 {activeTab === 'Admin View' && surveys.length === 0 && <p className="text-center text-gray-500 py-12">No surveys have been created yet.</p>}
            </div>
        </div>

      </div>
    </>
  );
}

export default Surveys;