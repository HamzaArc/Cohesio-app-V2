import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { X, CheckCircle, XCircle, Send, Calendar, RotateCcw, Trash2 } from 'lucide-react';

const DetailField = ({ label, value }) => ( <div><p className="text-sm text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value}</p></div> );
const HistoryItem = ({ icon, title, date, isLast }) => ( <div className="relative pl-8">{!isLast && <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gray-200"></div>}<div className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-white">{icon}</div><p className="font-semibold text-gray-700">{title}</p><p className="text-xs text-gray-500">{date}</p></div> );

function RequestDetailsModal({ isOpen, onClose, request, onWithdraw, onReschedule }) {
  const [history, setHistory] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (isOpen && request) {
      const historyQuery = query(collection(db, 'timeOffRequests', request.id, 'history'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
        setHistory(snapshot.docs.map(doc => ({ ...doc.data(), timestamp: doc.data().timestamp?.toDate().toLocaleString() })));
      });
      return () => unsubscribe();
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const getStatusStyle = (status) => {
    switch(status) {
        case 'Approved': return 'bg-green-100 text-green-700';
        case 'Pending': return 'bg-yellow-100 text-yellow-700';
        case 'Denied': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
  }
  
  const getHistoryIcon = (action) => {
      switch(action) {
          case 'Created': return <Send size={16} className="text-blue-500" />;
          case 'Approved': return <CheckCircle size={16} className="text-green-500" />;
          case 'Denied': return <XCircle size={16} className="text-red-500" />;
          case 'Rescheduled': return <RotateCcw size={16} className="text-orange-500" />;
          default: return <Calendar size={16} className="text-gray-500" />;
      }
  }
  
  const isOwner = currentUser?.email === request.userEmail;
  const canWithdraw = request.status === 'Pending';
  const canReschedule = request.status === 'Approved' && new Date(request.startDate) > new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        
        <div className="space-y-6">
            <div className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                    <DetailField label="Employee" value={request.employeeName} />
                    <DetailField label="Leave Type" value={request.leaveType} />
                    <DetailField label="Start Date" value={request.startDate} />
                    <DetailField label="End Date" value={request.endDate} />
                    <DetailField label="Total Days" value={`${request.totalDays} day(s)`} />
                    <div><p className="text-sm text-gray-500">Status</p><span className={`text-sm font-bold py-1 px-3 rounded-full ${getStatusStyle(request.status)}`}>{request.status}</span></div>
                </div>
                {request.description && ( <div className="mt-4 border-t pt-4"><DetailField label="Description" value={request.description} /></div> )}
            </div>

            <div>
                <h3 className="font-bold text-gray-800 mb-4">History</h3>
                <div className="space-y-4">
                    {history.map((item, index) => (
                        <HistoryItem key={index} icon={getHistoryIcon(item.action)} title={item.action} date={item.timestamp} isLast={index === history.length - 1} />
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <div>
              {isOwner && canWithdraw && <button onClick={() => onWithdraw(request)} className="flex items-center text-sm text-red-600 bg-red-100 hover:bg-red-200 font-semibold py-2 px-3 rounded-lg"><Trash2 size={16} className="mr-2"/>Withdraw Request</button>}
              {isOwner && canReschedule && <button onClick={() => onReschedule(request)} className="flex items-center text-sm text-orange-600 bg-orange-100 hover:bg-orange-200 font-semibold py-2 px-3 rounded-lg"><RotateCcw size={16} className="mr-2"/>Reschedule</button>}
          </div>
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

export default RequestDetailsModal;