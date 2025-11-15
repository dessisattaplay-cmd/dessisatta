import React, { useState, useEffect, useMemo } from 'react';
import type { BaziResult } from '../../types';
import { getLatestResult, getCurrentAndNextBazi, getNextNBazis } from '../../services/baziService';
import { getBettingStatus } from '../../services/adminService';
import Sparkles from '../ui/Sparkles';
import { useLocalization } from '../../hooks/useLocalization';
import BettingPanel from './DigitSelector';
import { useAuth } from '../../hooks/useAuth';
import useRotatingContent from '../../hooks/useRotatingContent';
import { MULTI_LANGUAGE_CONTENT } from '../../constants';
import { ThumbsUp, ThumbsDown, X, Clock } from 'lucide-react';

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const WinLossModal: React.FC<{
    status: 'win' | 'loss';
    amount: number;
    onClose: () => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}> = ({ status, amount, onClose, t }) => {
    const { language } = useLocalization();
    const isWin = status === 'win';

    const motivationalMessage = useMemo(() => {
        const messages = isWin ? MULTI_LANGUAGE_CONTENT.WIN_MESSAGES[language] : MULTI_LANGUAGE_CONTENT.LOSS_MESSAGES[language];
        return getRandomElement(messages);
    }, [status, language, isWin]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className={`relative bg-gray-900 p-6 border-4 ${isWin ? 'border-green-500' : 'border-red-500'} rounded-2xl max-w-sm w-full text-center shadow-lg ${isWin ? 'shadow-green-500/30' : 'shadow-red-500/30'} animate-fade-in-up`} 
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute -top-4 -right-4 bg-gray-700 rounded-full p-1 text-white hover:bg-gray-600 transition-colors z-10">
                    <X size={18}/>
                </button>
                {isWin ? <ThumbsUp size={48} className="mx-auto text-green-400 mb-3" /> : <ThumbsDown size={48} className="mx-auto text-red-400 mb-3" />}
                
                <h2 className={`font-cinzel text-3xl ${isWin ? 'text-green-400' : 'text-red-400'}`}>{isWin ? t('congratulations') : t('betterLuckNextTime')}</h2>
                <p className="text-white text-lg mt-1">{isWin ? t('youWon', { amount: amount.toLocaleString() }) : t('youLost')}</p>
                
                <p className="text-gray-400 italic mt-4 text-sm">"{motivationalMessage}"</p>
                
                <button onClick={onClose} className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors font-bold">{t('close')}</button>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
             `}</style>
        </div>
    );
};

const OvernightClosureDisplay: React.FC = () => {
    const { t } = useLocalization();
    return (
        <div className="p-6 text-center bg-blue-900/30 border border-blue-500/50 rounded-lg">
            <Clock className="mx-auto w-12 h-12 text-blue-300 mb-4"/>
            <h3 className="font-cinzel text-xl text-blue-300">{t('bettingClosedOvernightTitle')}</h3>
            <p className="text-gray-400 mt-2">{t('bettingClosedOvernightMessage')}</p>
        </div>
    );
};

const UpcomingSchedule: React.FC = () => {
    const { t } = useLocalization();
    const [schedule, setSchedule] = useState<{ number: number; time: Date }[]>([]);

    useEffect(() => {
        const updateSchedule = () => setSchedule(getNextNBazis(4));
        updateSchedule();
        const interval = setInterval(updateSchedule, 60 * 1000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
            <h3 className="font-cinzel text-lg text-amber-400 text-center mb-3">{t('upcomingSchedule')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                {schedule.map((item, index) => (
                    <div key={index} className="p-2 bg-black/40 rounded">
                        <p className="font-bold text-gray-300 font-teko text-xl">Bazi #{item.number}</p>
                        <p className="text-sm text-yellow-300">{formatTime(item.time)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface LiveBaziDisplayProps {
    onNewBazi: () => void;
}

const LiveBaziDisplay: React.FC<LiveBaziDisplayProps> = ({ onNewBazi }) => {
  const [result, setResult] = useState<BaziResult | null>(null);
  const [nextBaziTime, setNextBaziTime] = useState<Date | null>(null);
  const [key, setKey] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showWinLossModal, setShowWinLossModal] = useState<{ status: 'win' | 'loss', amount: number } | null>(null);
  const [bettingStatus, setBettingStatus] = useState({ bettingEnabled: true });

  const { t, language } = useLocalization();
  const { user, getBets } = useAuth();

  const tips = MULTI_LANGUAGE_CONTENT.TIPS[language];
  const currentTip = useRotatingContent(tips, 30 * 1000); // 30 seconds

  const updateDisplay = () => {
    const { nextBazi } = getCurrentAndNextBazi();
    const newResult = getLatestResult();
    
    setNextBaziTime(nextBazi?.time || null);
    
    setShowResult(false);
    setTimeout(() => {
        if (result?.id !== newResult?.id) {
             // Check for win/loss for the current user
            if (user && newResult) {
                const userBets = getBets();
                const betsForThisBazi = userBets.filter(b => b.baziNumber === newResult.baziNumber && (b.status === 'Won' || b.status === 'Lost'));
                
                if (betsForThisBazi.length > 0) {
                    const totalWinnings = betsForThisBazi.reduce((sum, bet) => {
                        if (bet.status === 'Won') return sum + (bet.winnings || 0);
                        return sum;
                    }, 0);

                    const totalLosses = betsForThisBazi.reduce((sum, bet) => {
                        if (bet.status === 'Lost') return sum + bet.points;
                        return sum;
                    }, 0);

                    const netResult = totalWinnings - totalLosses;

                    // Show modal after a short delay for the result animation
                    setTimeout(() => {
                        if (netResult > 0) {
                            setShowWinLossModal({ status: 'win', amount: netResult });
                        } else {
                            setShowWinLossModal({ status: 'loss', amount: 0 });
                        }
                    }, 1000);
                }
            }
            setResult(newResult);
            setShowResult(true);
            setKey(prev => prev + 1);
            onNewBazi();
        }
    }, 500);
  };
  
  useEffect(() => {
    updateDisplay(); // Initial
    const interval = setInterval(updateDisplay, 10000); // Check for new bazi every 10s
    
    const statusInterval = setInterval(() => setBettingStatus(getBettingStatus()), 5000);
    setBettingStatus(getBettingStatus()); // Initial fetch

    return () => {
        clearInterval(interval);
        clearInterval(statusInterval);
    }
  }, []);
  
  const { timeLeft, isBettingOpen, isOvernight } = useMemo(() => {
    const now = new Date();
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
    const currentUTCHour = nowUTC.getUTCHours();
    const overnight = currentUTCHour >= 23 || currentUTCHour < 8;

    if (!nextBaziTime) return { timeLeft: '00:00:00', isBettingOpen: false, isOvernight: true };
    
    const diff = nextBaziTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { timeLeft: '00:00:00', isBettingOpen: false, isOvernight: overnight };
    }
    
    const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    
    const bettingOpen = diff > 10 * 60 * 1000;

    return { timeLeft: `${hours}:${minutes}:${seconds}`, isBettingOpen: bettingOpen, isOvernight: overnight };
  }, [nextBaziTime, key]);

  useEffect(() => {
      const timer = setTimeout(() => {
          setKey(prev => prev + 1); // This forces timeLeft to re-render every second
      }, 1000);
      return () => clearTimeout(timer);
  });


  if (!result) {
    return <div className="text-center p-8 text-yellow-400 font-cinzel">{t('luckIsLoading')}...</div>;
  }

  const animationClass = showResult ? 'animate-fade-in-up' : 'opacity-0';

  return (
    <div className="space-y-6">
      {showWinLossModal && (
        <WinLossModal 
            status={showWinLossModal.status}
            amount={showWinLossModal.amount}
            onClose={() => setShowWinLossModal(null)}
            t={t}
        />
      )}
      <div key={key} className="relative p-6 md:p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl shadow-lg shadow-amber-500/10 overflow-hidden">
        <Sparkles trigger={showResult} />
        <div className={`transition-opacity duration-500 ${animationClass}`}>
          <div className="text-center">
             <h2 className="font-cinzel text-3xl md:text-4xl text-yellow-400" style={{ textShadow: '0 0 10px #FFD700' }}>
              {t('baziResult')} #{result.baziNumber}
            </h2>
            <p className="font-teko text-2xl text-gray-400">{t('nextResultIn')} <span className="text-white tracking-widest">{timeLeft}</span></p>
          </div>

          <div className="flex justify-center items-center gap-2 md:gap-4 my-6">
            {result.numbers.map((num, i) => (
              <React.Fragment key={i}>
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-5xl font-teko font-bold bg-gray-800 border-2 border-gray-600 rounded-full text-white">
                  {num}
                </div>
                {i < 2 && <span className="text-3xl text-yellow-400 font-bold">+</span>}
              </React.Fragment>
            ))}
          </div>
          
          <p className="text-center text-xl md:text-2xl text-gray-300 mb-6 font-teko">
            {t('equation')}: {result.equation}
          </p>

          <div className="text-center mb-4">
            <p className="font-cinzel text-lg text-gray-400">{t('finalDigit')}</p>
            <div className="inline-block mt-2 relative">
              <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center text-8xl md:text-9xl font-bold text-black bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-full shadow-lg shadow-yellow-400/50 animate-glow">
                <span className="font-teko">{result.finalDigit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isOvernight && bettingStatus.bettingEnabled ? (
          <OvernightClosureDisplay />
      ) : (
          <BettingPanel baziId={result.id} baziNumber={result.baziNumber} isBettingOpen={isBettingOpen} isBettingEnabledAdmin={bettingStatus.bettingEnabled} nextResultIn={timeLeft}/>
      )}

      <UpcomingSchedule />
      
      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30 text-center">
          <p className="font-cinzel text-lg text-blue-300">{t('tip')}: <span className="font-sans text-white font-normal transition-opacity duration-500" key={currentTip}>{currentTip}</span></p>
      </div>
    </div>
  );
};

export default LiveBaziDisplay;