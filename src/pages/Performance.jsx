import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext'; // Import our new hook
import AddTemplateModal from '../components/AddTemplateModal';
import EditTemplateModal from '../components/EditTemplateModal';
import CreateReviewModal from '../components/CreateReviewModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const PerformanceTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function Performance() {
  const { employees, loading: employeesLoading } = useAppContext(); // Use the App Brain
  const [activeTab, setActiveTab] = useState('Reviews');
  const [templates, setTemplates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingData(true);
    const templatesQuery = query(collection(db, 'reviewTemplates'), orderBy('created', 'desc'));
    const unsubTemplates = onSnapshot(templatesQuery, snap => setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const reviewsQuery = query(collection(db, 'reviews'), orderBy('created', 'desc'));
    const unsubReviews = onSnapshot(reviewsQuery, snap => {
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingData(false);
    });

    return () => { unsubTemplates(); unsubReviews(); };
  }, []);

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  const addHistoryLog = async (reviewId, action) => {
    const historyColRef = collection(db, 'reviews', reviewId, 'history');
    await addDoc(historyColRef, { action, timestamp: serverTimestamp() });
  };

  const handleReviewCreated = (newReviewId) => {
    setIsReviewModalOpen(false);
    addHistoryLog(newReviewId, 'Created');
  };

  const handleEditTemplateClick = (e, template) => { e.stopPropagation(); setSelectedItem(template); setIsEditTemplateModalOpen(true); };
  const handleDeleteClick = (e, item, type) => { e.stopPropagation(); setSelectedItem(item); setDeleteType(type); setIsDeleteModalOpen(true); };
  
  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    const collectionName = deleteType === 'template' ? 'reviewTemplates' : 'reviews';
    await deleteDoc(doc(db, collectionName, selectedItem.id));
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setIsDeleting(false);
  };

  const handleUpdateReviewStatus = async (e, reviewId, newStatus) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'reviews', reviewId), { status: newStatus });
    addHistoryLog(reviewId, newStatus);
  };

  const handleReviewRowClick = (review) => {
    if (review.status === 'Completed') {
        navigate(`/performance/reviews/${review.id}/summary`);
    } else {
        navigate(`/performance/reviews/${review.id}`);
    }
  };

  const loading = employeesLoading || loadingData;

  const renderContent = () => {
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    switch(activeTab) {
        case 'Templates':
            return (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Name</th><th className="p-4 font-semibold text-gray-500 text-sm">Description</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                    <tbody>
                        {templates.map(t => (
                            <tr key={t.id} onClick={() => navigate(`/performance/templates/${t.id}`)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <td className="p-4 font-semibold text-gray-800">{t.name}</td>
                                <td className="p-4 text-gray-700">{t.description}</td>
                                <td className="p-4"><div className="flex gap-2"><button onClick={(e) => handleEditTemplateClick(e, t)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16}/></button><button onClick={(e) => handleDeleteClick(e, t, 'template')} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600"/></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        case 'Reviews':
        default:
            return (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Title</th><th className="p-4 font-semibold text-gray-500 text-sm">Reviewee</th><th className="p-4 font-semibold text-gray-500 text-sm">Due Date</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r.id} onClick={() => handleReviewRowClick(r)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <td className="p-4 font-semibold text-gray-800">{r.title}</td>
                                <td className="p-4 text-gray-700">{employeeMap.get(r.employeeId) || 'Unknown'}</td>
                                <td className="p-4 text-gray-700">{r.dueDate}</td>
                                <td className="p-4"><span className={`text-xs font-bold py-1 px-2 rounded-full ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
                                <td className="p-4"><div className="flex gap-2">{r.status !== 'Completed' && <button onClick={(e) => handleUpdateReviewStatus(e, r.id, 'Completed')} className="p-2 hover:bg-gray-200 rounded-full"><Check size={16} className="text-green-600"/></button>}<button onClick={(e) => handleDeleteClick(e, r, 'review')} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600"/></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
    }
  };

  return (
    <>
      <AddTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onTemplateAdded={() => setIsTemplateModalOpen(false)} />
      <EditTemplateModal isOpen={isEditTemplateModalOpen} onClose={() => setIsEditTemplateModalOpen(false)} template={selectedItem} onTemplateUpdated={() => setIsEditTemplateModalOpen(false)} />
      <CreateReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onReviewCreated={handleReviewCreated} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedItem?.name || selectedItem?.title} loading={isDeleting} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Performance</h1>
          <button onClick={() => activeTab === 'Templates' ? setIsTemplateModalOpen(true) : setIsReviewModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            {activeTab === 'Templates' ? 'Create Template' : 'New Review'}
          </button>
        </header>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <PerformanceTab label="Reviews" active={activeTab === 'Reviews'} onClick={() => setActiveTab('Reviews')} />
                <PerformanceTab label="Templates" active={activeTab === 'Templates'} onClick={() => setActiveTab('Templates')} />
            </div>
            <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    </>
  );
}

export default Performance;
