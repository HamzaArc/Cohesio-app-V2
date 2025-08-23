import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

function Notifications() {
  const { notifications, companyId } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && companyId) {
      const notifRef = doc(db, 'companies', companyId, 'notifications', notification.id);
      await updateDoc(notifRef, { isRead: true });
    }
    setIsOpen(false);
    navigate(notification.link);
  };

  const handleMarkAllAsRead = async () => {
    if (!companyId) return;
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const notif of unreadNotifications) {
      const notifRef = doc(db, 'companies', companyId, 'notifications', notif.id);
      await updateDoc(notifRef, { isRead: true });
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100">
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div 
          onMouseLeave={() => setIsOpen(false)} 
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20"
        >
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-blue-600 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)} 
                  className={`p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${!notif.isRead ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm text-gray-700">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notif.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;