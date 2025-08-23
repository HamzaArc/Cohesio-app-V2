import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Folder, Edit, Trash, Eye, CheckSquare, AlertCircle, FileCheck, Users, Clock, MoreVertical, MessageSquareWarning } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import AddDocumentModal from '../components/AddDocumentModal';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import DocumentDetailsModal from '../components/DocumentDetailsModal';
import RequestRevisionModal from '../components/RequestRevisionModal'; // New Component
import StatCard from '../components/StatCard';

// Main Component
function Documents() {
  const { employees, companyId, currentUser } = useAppContext();
  const [allDocuments, setAllDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser || !companyId) {
      setLoading(false);
      return;
    }
    const documentsCollection = collection(db, 'companies', companyId, 'documents');
    const q = query(documentsCollection, orderBy('created', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const isExpired = data.expirationDate && new Date(data.expirationDate) < new Date();
        
        const acknowledgments = Array.isArray(data.acknowledgments) ? data.acknowledgments : [];

        const assignedToCurrentUser = data.assignedTo?.type === 'all' || 
                                      (data.assignedTo?.type === 'specific' && data.assignedTo?.emails?.includes(currentUser.email));
        return {
          id: doc.id,
          ...data,
          acknowledgments,
          isExpired,
          assignedToCurrentUser,
        };
      });
      setAllDocuments(documentsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, companyId]);

  const { myPendingDocuments, companyDocuments, stats } = useMemo(() => {
    const myPending = [];
    const companyDocs = [];
    let revisionRequests = 0;
    
    allDocuments.forEach(doc => {
      const myAcknowledgement = doc.acknowledgments.find(ack => ack.userEmail === currentUser.email);
      
      if (doc.assignedToCurrentUser && myAcknowledgement?.status === 'Pending' && !doc.isExpired) {
        myPending.push(doc);
      }
      companyDocs.push(doc);

      if (doc.acknowledgments.some(ack => ack.status === 'Revision Requested')) {
        revisionRequests++;
      }
    });

    const expiringSoonCount = allDocuments.filter(d => {
        if (!d.expirationDate) return false;
        const diff = new Date(d.expirationDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 && days <= 30;
    }).length;

    const calculatedStats = {
        pending: myPending.length,
        expiring: expiringSoonCount,
        total: allDocuments.length,
        revisionRequests: revisionRequests,
    };
    
    return { myPendingDocuments: myPending, companyDocuments: companyDocs, stats: calculatedStats };
  }, [allDocuments, currentUser]);

  const updateAcknowledgementStatus = async (docId, status, notes = '') => {
    if (!currentUser || !companyId) return;
    const docRef = doc(db, 'companies', companyId, 'documents', docId);
    const docToUpdate = allDocuments.find(d => d.id === docId);
    if (!docToUpdate) return;

    const newAcknowledgments = docToUpdate.acknowledgments.map(ack => {
        if (ack.userEmail === currentUser.email) {
            return { ...ack, status, notes, timestamp: new Date() };
        }
        return ack;
    });

    await updateDoc(docRef, { acknowledgments: newAcknowledgments });
  };

  const handleEditClick = (doc) => { setSelectedDocument(doc); setIsEditModalOpen(true); };
  const handleDeleteClick = (doc) => { setSelectedDocument(doc); setIsDeleteModalOpen(true); };
  const handleDetailsClick = (doc) => { setSelectedDocument(doc); setIsDetailsModalOpen(true); };
  const handleRevisionClick = (doc) => { setSelectedDocument(doc); setIsRevisionModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument || !companyId) return;
    setIsDeleting(true);
    await deleteDoc(doc(db, 'companies', companyId, 'documents', selectedDocument.id));
    setIsDeleteModalOpen(false);
    setSelectedDocument(null);
    setIsDeleting(false);
  };

  const DocumentRow = ({ doc }) => {
    const myAcknowledgement = doc.acknowledgments.find(ack => ack.userEmail === currentUser.email);
    const status = myAcknowledgement?.status || 'N/A';
    
    const getStatusBadge = () => {
        if (!doc.assignedToCurrentUser) return null;
        switch(status) {
            case 'Acknowledged': return <span className="text-xs font-bold py-1 px-2 rounded-full bg-green-100 text-green-700">Acknowledged</span>;
            case 'Pending': return <span className="text-xs font-bold py-1 px-2 rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
            case 'Revision Requested': return <span className="text-xs font-bold py-1 px-2 rounded-full bg-orange-100 text-orange-700">Revision Requested</span>;
            default: return null;
        }
    };

    return (
        <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
            <td className="p-4 font-semibold text-gray-800">
                <div className="flex items-center"><Folder className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" /><div><button onClick={() => handleDetailsClick(doc)} className="text-left hover:text-blue-600">{doc.name}</button><p className="text-xs text-gray-500 font-normal">{doc.category || 'Uncategorized'}</p></div></div>
            </td>
            <td className="p-4 text-gray-700">{doc.created?.toDate().toLocaleDateString() || 'N/A'}</td>
            <td className="p-4">{getStatusBadge()}</td>
            <td className="p-4"><span className={`text-xs font-bold py-1 px-2 rounded-full ${doc.isExpired ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{doc.isExpired ? 'Expired' : 'Active'}</span></td>
            <td className="p-4">
                <div className="flex gap-2">
                    <a href={doc.fileURL} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-full" title="View Document"><Eye size={16} className="text-gray-600" /></a>
                    {status === 'Pending' && !doc.isExpired && (
                        <>
                            <button onClick={() => updateAcknowledgementStatus(doc.id, 'Acknowledged')} className="p-2 hover:bg-gray-200 rounded-full" title="Acknowledge"><CheckSquare size={16} className="text-blue-600" /></button>
                            <button onClick={() => handleRevisionClick(doc)} className="p-2 hover:bg-gray-200 rounded-full" title="Request Revision"><MessageSquareWarning size={16} className="text-orange-600" /></button>
                        </>
                    )}
                    <button onClick={() => handleEditClick(doc)} className="p-2 hover:bg-gray-200 rounded-full" title="Edit"><Edit size={16} className="text-gray-600" /></button>
                    <button onClick={() => handleDeleteClick(doc)} className="p-2 hover:bg-gray-200 rounded-full" title="Delete"><Trash size={16} className="text-red-600" /></button>
                </div>
            </td>
        </tr>
    );
  };

  return (
    <>
      <AddDocumentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onDocumentAdded={() => setIsAddModalOpen(false)} />
      <EditDocumentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} document={selectedDocument} onDocumentUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedDocument?.name} loading={isDeleting} />
      <DocumentDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} document={selectedDocument} employees={employees} />
      <RequestRevisionModal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)} document={selectedDocument} onSubmitRevision={updateAcknowledgementStatus} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Document Hub</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"><Plus size={20} className="mr-2" />Upload Document</button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<AlertCircle size={24}/>} title="Action Required" value={stats.pending} />
            <StatCard icon={<Users size={24}/>} title="Company Documents" value={stats.total} />
            <StatCard icon={<Clock size={24}/>} title="Expiring Soon" value={stats.expiring} />
            <StatCard icon={<MessageSquareWarning size={24}/>} title="Revisions Requested" value={stats.revisionRequests} />
        </div>

        {myPendingDocuments.length > 0 && (
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">My Pending Documents</h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead><tr className="border-b bg-gray-50"><th className="p-4 font-semibold text-gray-500 text-sm">Name</th><th className="p-4 font-semibold text-gray-500 text-sm">Date Added</th><th className="p-4 font-semibold text-gray-500 text-sm">My Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Doc Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                        <tbody>{myPendingDocuments.map(doc => <DocumentRow key={doc.id} doc={doc} />)}</tbody>
                    </table>
                </div>
            </div>
        )}

        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Company Documents</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                {loading ? <div className="p-8 text-center">Loading documents...</div> : (
                    <table className="w-full text-left min-w-[600px]">
                        <thead><tr className="border-b bg-gray-50"><th className="p-4 font-semibold text-gray-500 text-sm">Name</th><th className="p-4 font-semibold text-gray-500 text-sm">Date Added</th><th className="p-4 font-semibold text-gray-500 text-sm">My Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Doc Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                        <tbody>{companyDocuments.map(doc => <DocumentRow key={doc.id} doc={doc} />)}</tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </>
  );
}

export default Documents;