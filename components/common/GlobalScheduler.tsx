import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { getCurrentAndNextBazi } from '../../services/baziService';

const NOTIFICATION_SESSION_KEY = 'dessi-satta-session-notifications';

const GlobalScheduler: React.FC = () => {
    const { addNotification } = useNotifications();

    useEffect(() => {
        const checkAndNotify = () => {
            const now = new Date();
            const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
            const currentUTCHour = nowUTC.getUTCHours();
            
            // Announcements
            const shownNotifications = JSON.parse(sessionStorage.getItem(NOTIFICATION_SESSION_KEY) || '{}');
            const today = now.toDateString();

            // Opening announcement
            const openKey = `open-${today}`;
            if (currentUTCHour === 8 && !shownNotifications[openKey]) {
                addNotification({ message: 'bettingOpenToday', type: 'info' });
                shownNotifications[openKey] = true;
            }
            
            // Closing announcement
            const closeKey = `close-${today}`;
            if (currentUTCHour === 23 && !shownNotifications[closeKey]) {
                addNotification({ message: 'bettingClosedTonight', type: 'info' });
                shownNotifications[closeKey] = true;
            }

            // Pre/Post Bazi Notifications
            const { nextBazi, currentBazi } = getCurrentAndNextBazi();
            if (nextBazi) {
                const diff = nextBazi.time.getTime() - nowUTC.getTime();
                // Pre-bet notification (10-11 mins before)
                const preBetKey = `pre-${nextBazi.number}-${nextBazi.time.getUTCDate()}`;
                if (diff > 10 * 60 * 1000 && diff < 11 * 60 * 1000 && !shownNotifications[preBetKey]) {
                    addNotification({ message: 'bettingClosingSoon', type: 'info', options: { bazi: nextBazi.number }});
                    shownNotifications[preBetKey] = true;
                }
            }
            if(currentBazi) {
                // Post-result notification (within 1 min after)
                const diff = nowUTC.getTime() - currentBazi.time.getTime();
                const postBetKey = `post-${currentBazi.number}-${currentBazi.time.getUTCDate()}`;
                if (diff > 0 && diff < 1 * 60 * 1000 && !shownNotifications[postBetKey]) {
                    addNotification({ message: 'newResultOut', type: 'success', options: { bazi: currentBazi.number }});
                    shownNotifications[postBetKey] = true;
                }
            }

            sessionStorage.setItem(NOTIFICATION_SESSION_KEY, JSON.stringify(shownNotifications));
        };

        const interval = setInterval(checkAndNotify, 30 * 1000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [addNotification]);

    return null; // This component doesn't render anything
};

export default GlobalScheduler;