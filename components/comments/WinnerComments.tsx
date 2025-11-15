import React, { useState, useEffect } from 'react';
import { generateWinnerComments } from '../../services/commentService';
import type { WinnerComment } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';

const WinnerComments: React.FC = () => {
    const [comments, setComments] = useState<WinnerComment[]>([]);
    const { t } = useLocalization();

    useEffect(() => {
        setComments(generateWinnerComments());
    }, []);

    return (
        <div className="p-4 bg-black/50 backdrop-blur-md border border-gray-700/50 rounded-lg h-[600px] overflow-hidden relative animate-fade-in-up">
            <h3 className="font-cinzel text-2xl text-center text-amber-400 mb-4">{t('topWinners')}</h3>
            <div className="space-y-3 overflow-y-auto h-[540px] pr-2">
                {comments.map((comment, index) => (
                    <div key={comment.id} className="p-3 bg-gray-900/50 rounded-md border-l-4 border-yellow-500/50" style={{ animation: `fadeIn 0.5s ease-out ${index * 0.05}s forwards`, opacity: 0}}>
                        <p className="font-bold text-sm text-white">{comment.name} <span className="text-xs text-gray-500">({comment.userId})</span></p>
                        <p className="italic text-gray-300 text-sm">"{comment.comment}"</p>
                    </div>
                ))}
            </div>
             <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <style>{`
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default WinnerComments;