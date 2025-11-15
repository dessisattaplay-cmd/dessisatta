import React, { useState, useEffect } from 'react';
import { getUnreadAdminNotifications, markAdminNotificationAsRead } from '../../services/notificationService';
import { Bell, X } from 'lucide-react';
import type { AdminNotification } from '../../types';

const AdminNotificationHandler: React.FC = () => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);

    useEffect(() => {
        const checkNotifications = () => {
            const unread = getUnreadAdminNotifications();
            if (unread.length > 0) {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const newNotifications = unread.filter(n => !existingIds.has(n.id));
                    return [...prev, ...newNotifications];
                });
            }
        };

        checkNotifications(); // Check on mount
        const interval = setInterval(checkNotifications, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const handleDismiss = (id: number) => {
        markAdminNotificationAsRead(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[200] space-y-3">
            {notifications.map(notification => (
                <NotificationToast 
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => handleDismiss(notification.id)}
                />
            ))}
        </div>
    );
};


const NotificationToast: React.FC<{ notification: AdminNotification, onDismiss: () => void }> = ({ notification, onDismiss }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 8000); // Auto-dismiss after 8 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`w-96 p-4 bg-yellow-600 border-l-4 border-yellow-400 rounded-lg shadow-2xl flex items-start gap-4 animate-slide-in`}>
            <div className="flex-shrink-0 mt-1"><Bell className="text-black" /></div>
            <div className="flex-grow">
                <p className="text-black font-bold">New Admin Alert</p>
                <p className="text-black">{notification.message}</p>
            </div>
            <button onClick={onDismiss} className="text-black/70 hover:text-black">
                <X size={18} />
            </button>
             <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

export default AdminNotificationHandler;