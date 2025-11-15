import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const NotificationPopup: React.FC = () => {
    const { notifications, dismissNotification } = useNotifications();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-24 right-4 z-[100] space-y-3">
            {notifications.map(notification => (
                <NotificationToast 
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => dismissNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationToast: React.FC<{ notification: any, onDismiss: () => void }> = ({ notification, onDismiss }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle className="text-green-400" />;
            case 'error':
                return <XCircle className="text-red-400" />;
            case 'info':
            default:
                return <Info className="text-blue-400" />;
        }
    };
    
    const getBorderColor = () => {
         switch (notification.type) {
            case 'success': return 'border-green-500/50';
            case 'error': return 'border-red-500/50';
            case 'info':
            default: return 'border-blue-500/50';
        }
    }

    return (
        <div className={`w-80 p-4 bg-gray-900 border-l-4 ${getBorderColor()} rounded-lg shadow-2xl flex items-start gap-3 animate-slide-in`}>
            <div className="flex-shrink-0 mt-1">{getIcon()}</div>
            <div className="flex-grow">
                <p className="text-white font-semibold">{notification.message}</p>
            </div>
            <button onClick={onDismiss} className="text-gray-500 hover:text-white">
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

export default NotificationPopup;