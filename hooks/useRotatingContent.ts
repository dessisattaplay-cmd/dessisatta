import { useState, useEffect } from 'react';

const useRotatingContent = (contentArray: string[], intervalInMs: number): string => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!contentArray || contentArray.length === 0) return;

        const intervalId = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % contentArray.length);
        }, intervalInMs);

        return () => clearInterval(intervalId);
    }, [contentArray, intervalInMs]);

    return contentArray[currentIndex];
};

export default useRotatingContent;