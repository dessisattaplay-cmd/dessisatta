import React, { useState, useEffect } from 'react';

const CountdownTimer: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        let timeLeft: { hours?: number; minutes?: number; seconds?: number } = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
      if (value === undefined) return null;
      return (
        <span key={interval} className="font-teko text-lg tracking-wider">
          {String(value).padStart(2, '0')}{interval !== 'seconds' ? ':' : ''}
        </span>
      );
    });

    return (
        <div className="text-white">
            {timerComponents.length ? timerComponents : <span>00:00:00</span>}
        </div>
    );
};

export default CountdownTimer;
