import React, { useMemo } from 'react';
import { X, CheckCircle, Clock, MessageSquareWarning } from 'lucide-react';

function DocumentDetailsModal({ isOpen, onClose, document: doc, employees }) {
  const acknowledgmentStatus = useMemo(() => {
    if (!doc || !employees) return [];
    
    let assignedEmails = new Set();
    if (doc.assignedTo?.type === 'all') {
      employees.forEach(e => assignedEmails.add(e.email));
    } else if (doc.assignedTo?.type === 'specific') {
      (doc.assignedTo.emails || []).forEach(e => assignedEmails.add(e));
    }

    const statusMap = new Map();
    (doc.acknowledgments || []).forEach(ack => {
        statusMap.set(ack.userEmail, {
            status: ack.status,
            timestamp: ack.timestamp?.toDate().toLocaleString() || null,
            notes: ack.notes
        });
    });

    return employees
      .filter(emp => assignedEmails.has(emp.email))
      .map(emp => {
        const ack = statusMap.get(emp.email);
        return {
          name: emp.name,
          status: ack?.status || 'Pending',
          timestamp: ack?.timestamp,
          notes: ack?.notes
        };
      });
  }, [doc, employees]);

  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Document Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <div className="overflow-y-auto p-6">
            <div className="mb-6">
                <p className="text-sm text-gray-500">Document Name</p>
                <h3 className="text-lg font-bold text-gray-800">{doc.name}</h3>
                {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
            </div>
            
            <h4 className="font-bold text-gray-800 mb-2">Acknowledgment Status</h4>
            <div className="space-y-2 border rounded-lg p-2 max-h-80 overflow-y-auto">
                {acknowledgmentStatus.map((item, index) => (
                    <div key={index} className="p-2 rounded-md hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">{item.name}</p>
                            <span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full ${item.status === 'Acknowledged' ? 'bg-green-100 text-green-700' : item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                                {item.status === 'Acknowledged' && <CheckCircle size={14} className="mr-1.5"/>}
                                {item.status === 'Pending' && <Clock size={14} className="mr-1.5"/>}
                                {item.status === 'Revision Requested' && <MessageSquareWarning size={14} className="mr-1.5"/>}
                                {item.status}
                            </span>
                        </div>
                        {item.timestamp && <p className="text-xs text-gray-500 mt-1">On: {item.timestamp}</p>}
                        {item.notes && <div className="mt-2 p-2 bg-orange-50 border-l-2 border-orange-300 text-xs text-orange-800"><p className="font-semibold">Revision Note:</p><p>{item.notes}</p></div>}
                    </div>
                ))}
            </div>
        </div>
        <div className="mt-auto p-6 border-t flex justify-end">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailsModal;
