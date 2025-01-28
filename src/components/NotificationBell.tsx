import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const bellRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 
  return (
    <div ref={bellRef} className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 hover:bg-green-700/30 rounded-lg transition-colors"
      >
        <span className="text-xl relative inline-flex">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </span>
      </button>
 
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl origin-top-right" style={{ zIndex: 9999 }}>
          <div className="sticky top-0 p-4 border-b bg-green-50 flex justify-between items-center">
            <h3 className="font-semibold text-green-800">Notificaciones</h3>
            {notifications.length > 0 && (
              <button 
                onClick={() => notifications.forEach(n => markAsRead(n.id))} 
                className="text-xs text-green-600 hover:text-green-700"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
 
          <div className="max-h-[500px] overflow-y-auto bg-white">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b hover:bg-gray-50 relative ${
                    !notif.read ? 'border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 mb-1">{notif.title}</h4>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            Marcar como leído
                          </button>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="text-gray-400 hover:text-red-500 text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
 }