import type { AdminNotification, UserNotification } from '../types';

const ADMIN_NOTIFICATIONS_KEY = 'dessi-satta-admin-notifications';
const USER_NOTIFICATIONS_KEY = 'dessi-satta-user-notifications';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Could not parse ${key} from localStorage`, e);
      return defaultValue;
    }
};

const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- Admin Notifications ---

export const createAdminNotification = (message: string) => {
    const notifications = getFromStorage<AdminNotification[]>(ADMIN_NOTIFICATIONS_KEY, []);
    const newNotification: AdminNotification = {
        id: Date.now(),
        message,
        timestamp: Date.now(),
        isRead: false,
    };
    notifications.push(newNotification);
    saveToStorage(ADMIN_NOTIFICATIONS_KEY, notifications);
};

export const getUnreadAdminNotifications = (): AdminNotification[] => {
    const notifications = getFromStorage<AdminNotification[]>(ADMIN_NOTIFICATIONS_KEY, []);
    return notifications.filter(n => !n.isRead);
};

export const markAdminNotificationAsRead = (id: number) => {
    const notifications = getFromStorage<AdminNotification[]>(ADMIN_NOTIFICATIONS_KEY, []);
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
        notifications[index].isRead = true;
        saveToStorage(ADMIN_NOTIFICATIONS_KEY, notifications);
    }
};


// --- User Notifications ---

export const createUserNotification = (
    userId: string, 
    messageKey: string, 
    type: UserNotification['type'],
    options?: Record<string, string | number>
) => {
    const notifications = getFromStorage<UserNotification[]>(USER_NOTIFICATIONS_KEY, []);
    
    // This is a proxy. The actual message formatting will happen in the context
    // We just store the key and options.
    const message = JSON.stringify({ key: messageKey, options });

    const newNotification: UserNotification = {
        id: Date.now(),
        userId,
        message, // Store the stringified object
        type,
        timestamp: Date.now(),
        isRead: false,
    };
    notifications.push(newNotification);
    saveToStorage(USER_NOTIFICATIONS_KEY, notifications);
};