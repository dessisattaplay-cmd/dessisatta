import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import type { UserNotification } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';

const NOTIFICATIONS_KEY = 'dessi-satta-user-notifications';

interface NotificationContextType {
  addNotification: (notification: { message: string, type: UserNotification['type'], options?: Record<string, string | number> }) => void;
  notifications: UserNotification[];
  dismissNotification: (id: number) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getAllNotifications = (): UserNotification[] => {
    const str = localStorage.getItem(NOTIFICATIONS_KEY);
    return str ? JSON.parse(str) : [];
};

const saveAllNotifications = (notifications: UserNotification[]) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const { user } = useAuth();
    const { t } = useLocalization();

    useEffect(() => {
        if (user) {
            const all = getAllNotifications();
            const userUnread = all.filter(n => n.userId === user.id && !n.isRead);

            const translatedNotifications = userUnread.map(n => {
                try {
                    // Stored message is a JSON object with key and options
                    const messageData = JSON.parse(n.message);
                    return {
                        ...n,
                        message: t(messageData.key, messageData.options)
                    };
                } catch (e) {
                    // Fallback for notifications that might be plain text
                    return n;
                }
            });

            setNotifications(prev => [...prev, ...translatedNotifications]);

             // Mark them as read in storage so they don't pop up again on refresh
            const readIds = new Set(userUnread.map(n => n.id));
            if (readIds.size > 0) {
                const updatedAll = all.map(n => readIds.has(n.id) ? { ...n, isRead: true } : n);
                saveAllNotifications(updatedAll);
            }

        } else {
            setNotifications([]);
        }
    }, [user, t]);

    const addNotification = ({ message, type, options }: { message: string, type: UserNotification['type'], options?: Record<string, string | number> }) => {
        if (user) {
            const formattedMessage = t(message, options);
            const newNotif: UserNotification = {
                id: Date.now(),
                userId: user.id,
                message: formattedMessage,
                type,
                timestamp: Date.now(),
                isRead: false,
            };
            setNotifications(prev => [...prev, newNotif]);
        }
    };
    
    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // No need to update localStorage here as they are either processed from storage or live
        // The ones from storage are already marked as read
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, dismissNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};