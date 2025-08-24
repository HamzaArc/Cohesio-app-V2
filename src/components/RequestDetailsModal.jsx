// src/components/RequestDetailsModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, CheckCircle, XCircle, Send, Calendar, RotateCcw, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const DetailField = ({ label, value }) => ( <div><p className="text-sm text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value}</p></div> );
// MIGRATION: HistoryItem component is restored
const HistoryItem = ({ icon, title, date, isLast }) => ( <div className="relative pl-8">{!isLast && <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gray-200"></div>}<div className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-white">{icon}</div><p className="font-semibold text-gray-700">{title}</p><p className="text-xs text-gray-500">{date}</p></div> );

function RequestDetailsModal({ isOpen, onClose, request, onWithdraw, onReschedule }) {
  const { currentUser, companyId } = useAppContext();
  // MIGRATION: State and effect for fetching history are restored
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen && request && companyId) {
      const fetchHistory = async () => {
        const { data, error } = await supabase
          .from('time_off_request_history')
          .select('*')
          .eq('request_id', request.id)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error("Error fetching request history:", error);
        } else {
          setHistory(data.map(item => ({...item, timestamp: new Date(item.timestamp).toLocaleString() })));
        }
      };
      fetchHistory();
    }
  }, [isOpen, request, companyId]);


  if (!isOpen || !request) return null;

  const getStatusStyle = (status) => {
    switch(status) {
        case 'Approved': return 'bg-green-100 text-green-700';
        case 'Pending': return 'bg-yellow-100 text-yellow-700';
        case 'Denied': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
  }

  // MIGRATION: History icon logic is restored
  const getHistoryIcon = (action) => {
      switch(action) {
          case 'Created': return <Send size={16} className="text-blue-500" />;
          case 'Approved': return <CheckCircle size={16} className="text-green-500" />;
          case 'Denied': return <XCircle size={16} className="text-red-500" />;
          case 'Rescheduled': return <RotateCcw size={16} className="text-orange-500" />;
          default: return <Calendar size={16} className="text-gray-500" />;
      }
  }

  const isOwner = currentUser?.email === request.user_email;
  const canWithdraw = request.status === 'Pending';
  const canReschedule = request.status === 'Approved' && new Date(request.start_date) > new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
            <div className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                    <DetailField label="Employee" value={request.employeeName} />
                    <DetailField label="Leave Type" value={request.leave_type} />
                    <DetailField label="Start Date" value={request.start_date} />
                    <DetailField label="End Date" value={request.end_date} />
                    <DetailField label="Total Days" value={`${request.total_days} day(s)`} />
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`text-sm font-bold py-1 px-3 rounded-full ${getStatusStyle(request.status)}`}>
                            {request.status}
                        </span>
                    </div>
                </div>
                {request.description && ( <div className="mt-4 border-t pt-4"><DetailField label="Description" value={request.description} /></div> )}
            </div>

            {/* MIGRATION: History section is restored and rendered */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4">History</h3>
                <div className="space-y-4">
                    {history.map((item, index) => (
                        <HistoryItem key={item.id} icon={getHistoryIcon(item.action)} title={item.action} date={item.timestamp} isLast={index === history.length - 1} />
                    ))}
                </div>
            </div>
        </div>

        <div className="p-6 border-t flex justify-between items-center">
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
