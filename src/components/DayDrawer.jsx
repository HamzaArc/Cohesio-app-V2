import React from 'react';
import { X } from 'lucide-react';

function DayDrawer({ isOpen, onClose, date, events, onViewRequest }) {
  if (!isOpen) return null;

  const getEventTypeStyle = (type) => {
    switch(type) {
        case 'Vacation': return 'bg-blue-500';
        case 'Sick Day': return 'bg-green-500';
        case 'Personal (Unpaid)': return 'bg-purple-500';
        default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 bg-white w-full max-w-md shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold text-lg">Who's Off</h2>
            <p className="text-sm text-gray-500">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
            {events.length > 0 ? events.map(event => (
                <button
                    key={event.id}
                    onClick={() => onViewRequest(event)}
                    className="w-full text-left flex items-center p-3 rounded-lg hover:bg-gray-50 border transition-colors"
                >
                    <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mr-3 ${getEventTypeStyle(event.leaveType)}`}></div>
                    <div>
                        <p className="font-semibold text-gray-800">{event.employeeName}</p>
                        <p className="text-xs text-gray-500">{event.leaveType}</p>
                    </div>
                </button>
            )) : (
                <p className="text-center text-gray-500 pt-8">No one is scheduled to be off on this day.</p>
            )}
        </div>
      </div>
    </div>
  );
}

export default DayDrawer;