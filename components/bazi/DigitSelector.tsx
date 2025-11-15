import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RoyalButton from '../ui/RoyalButton';
import RoyalInput from '../ui/RoyalInput';
import { useLocalization } from '../../hooks/useLocalization';
import { CheckCircle, Lock } from 'lucide-react';

type BetType = 'Single' | 'Patti';

interface BettingPanelProps {
    baziId: number;
    baziNumber: number;
    isBettingOpen: boolean;
    isBettingEnabledAdmin: boolean;
    nextResultIn: string;
}

const BettingPanel: React.FC<BettingPanelProps> = ({ baziId, baziNumber, isBettingOpen, isBettingEnabledAdmin, nextResultIn }) => {
    const { user, addBet, updatePoints, isAuthenticated } = useAuth();
    const { t } = useLocalization();
    const navigate = useNavigate();
    
    const [betType, setBetType] = useState<BetType>('Single');
    const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
    const [pattiNumbers, setPattiNumbers] = useState<[string, string, string]>(['', '', '']);
    const pattiInputs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    
    const [points, setPoints] = useState('');
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState<{ message: string } | null>(null);
    
    const isBettingAllowed = isBettingOpen && isBettingEnabledAdmin;

    // Reset component state when bazi changes or betting window closes
    useEffect(() => {
        setSelectedDigit(null);
        setPattiNumbers(['', '', '']);
        setPoints('');
        setError('');
        setShowSuccess(null);
    }, [baziId, isBettingAllowed]);

    const calculatedPattiDigit = useMemo(() => {
        if (pattiNumbers.some(p => p === '' || !/^\d$/.test(p))) return null;
        const sum = pattiNumbers.reduce((acc, num) => acc + parseInt(num), 0);
        return sum % 10;
    }, [pattiNumbers]);

    const handlePattiChange = (index: number, value: string) => {
        if (/^\d?$/.test(value)) {
            const newPatti = [...pattiNumbers] as [string, string, string];
            newPatti[index] = value;
            setPattiNumbers(newPatti);

            if (value && index < 2) {
                pattiInputs[index + 1].current?.focus();
            }
        }
    };

    const handleBet = () => {
        setError('');
        const pointsToBet = parseInt(points);

        if (isNaN(pointsToBet) || pointsToBet <= 0) {
            setError(t('validationValidBetAmount'));
            return;
        }
        if (user && user.points < pointsToBet) {
            setError(t('notEnoughPoints'));
            return;
        }
        
        if (betType === 'Single') {
            if (selectedDigit === null) {
                setError(t('validationSelectDigit'));
                return;
            }
        } else { // Patti
            if (calculatedPattiDigit === null) {
                setError(t('validationPattiComplete'));
                return;
            }
        }
        setShowConfirmModal(true);
    };
    
    const confirmBet = () => {
        const pointsToBet = parseInt(points);
        let betDetails;
        let successMessage = '';
        
        if (betType === 'Single') {
            if (selectedDigit === null) return;
            betDetails = {
                betType: 'Single' as const,
                digit: selectedDigit,
            };
            successMessage = t('betPlacedSuccess', { digit: selectedDigit, points: pointsToBet });
        } else {
            if (calculatedPattiDigit === null) return;
            const finalPattiNumbers = pattiNumbers.map(Number) as [number, number, number];
            betDetails = {
                betType: 'Patti' as const,
                pattiNumbers: finalPattiNumbers,
                digit: calculatedPattiDigit,
            };
            successMessage = t('pattiBetPlacedSuccess', { patti: pattiNumbers.join(''), digit: calculatedPattiDigit, points: pointsToBet });
        }

        updatePoints(-pointsToBet, 'Bet', `Bet for Bazi #${baziNumber}`);
        addBet({ baziId, baziNumber, points: pointsToBet, ...betDetails });
        
        setShowConfirmModal(false);
        setShowSuccess({ message: successMessage });
        
        // Reset form
        setSelectedDigit(null);
        setPattiNumbers(['', '', '']);
        setPoints('');
        
        setTimeout(() => setShowSuccess(null), 4000);
    }

    const handleQuickAddPoints = (amountToAdd: number) => {
        const currentPoints = parseInt(points) || 0;
        setPoints(String(currentPoints + amountToAdd));
    };

    if (showSuccess) {
         return (
            <div className="p-4 text-center bg-green-900/30 border border-green-500/50 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle className="text-green-400"/>
                <p className="font-bold text-green-300">{showSuccess.message}</p>
            </div>
        )
    }

    if (isAuthenticated && user?.isBetLocked) {
        return (
            <div className="p-4 text-center bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-center gap-2">
                <Lock className="text-red-400"/>
                <p className="font-bold text-red-300">{t('bettingIsLocked')}</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-black/40 border border-gray-700 rounded-lg">
            <div className="text-center mb-4">
                <h3 className={`font-cinzel text-xl ${isBettingAllowed ? 'text-green-400' : 'text-red-400'}`}>
                    {isBettingAllowed ? t('bettingOpen') : t('bettingClosed')}
                </h3>
                <p className="text-sm text-gray-400">
                    {isBettingAllowed 
                        ? `${t('bettingClosesIn', {time: nextResultIn.split(':').slice(1).join(':')})}` 
                        : !isBettingEnabledAdmin 
                            ? t('bettingClosedAdmin') 
                            : t('bettingWillOpen')}
                </p>
                 <p className="text-xs text-gray-500">{t('bettingClosesInfo')}</p>
            </div>
            
            {!isBettingAllowed ? null : !isAuthenticated ? (
                <div className="text-center p-4">
                    <p className="text-amber-400 font-bold mb-4">{t('loginToBet')}</p>
                    <RoyalButton onClick={() => navigate('/login')}>{t('login')}</RoyalButton>
                </div>
            ) : (
              <>
                <div className="flex justify-center bg-gray-800/50 p-1 rounded-full mb-4 max-w-sm mx-auto">
                    <button onClick={() => setBetType('Single')} className={`w-1/2 py-2 rounded-full font-bold transition-colors ${betType === 'Single' ? 'bg-yellow-500 text-black' : 'text-gray-300'}`}>{t('single')}</button>
                    <button onClick={() => setBetType('Patti')} className={`w-1/2 py-2 rounded-full font-bold transition-colors ${betType === 'Patti' ? 'bg-yellow-500 text-black' : 'text-gray-300'}`}>{t('patti')}</button>
                </div>

                {betType === 'Single' ? (
                    <>
                        <h4 className="text-center font-cinzel text-lg text-amber-400 mb-2">{t('selectYourDigit')}</h4>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4 justify-center">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setSelectedDigit(i)}
                                    className={`w-12 h-12 flex items-center justify-center font-bold text-2xl font-teko border-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${selectedDigit === i ? 'bg-yellow-500 text-black border-yellow-300 scale-110 animate-bounce' : 'bg-gray-800 border-gray-600 hover:border-yellow-500'}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h4 className="text-center font-cinzel text-lg text-amber-400 mb-2">{t('enterPattiDigits')}</h4>
                        <div className="flex justify-center items-center gap-2 mb-2">
                           {pattiNumbers.map((num, i) => (
                                <input
                                    key={i}
                                    ref={pattiInputs[i]}
                                    type="tel"
                                    maxLength={1}
                                    value={num}
                                    onChange={(e) => handlePattiChange(i, e.target.value)}
                                    className="w-14 h-14 text-center font-bold text-3xl font-teko bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none"
                                />
                           ))}
                        </div>
                        <p className="text-center text-sm text-gray-400 h-5">
                            {calculatedPattiDigit !== null ? t('yourCalculatedDigit', {digit: calculatedPattiDigit}) : ' '}
                        </p>
                    </>
                )}

                <div className="max-w-xs mx-auto mb-4">
                    <RoyalInput
                        label={t('betAmount')}
                        type="number"
                        name="points"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        placeholder={`e.g., 100 (Balance: ${user?.points.toLocaleString()})`}
                    />
                </div>

                <div>
                    <label className="block text-sm text-center font-medium text-amber-400 mb-2 font-cinzel">{t('quickBet')}</label>
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                        {[20, 100, 1000].map(val => (
                            <button type="button" key={val} onClick={() => handleQuickAddPoints(val)} className="p-2 border-2 rounded-lg transition-colors border-gray-600 hover:border-yellow-400 hover:bg-yellow-900/50 font-teko text-lg">+{val}</button>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}

                <RoyalButton 
                    onClick={handleBet}
                    disabled={betType === 'Single' ? (selectedDigit === null || !points || parseInt(points) <= 0) : (calculatedPattiDigit === null || !points || parseInt(points) <= 0)}
                    className="w-full mt-4"
                >
                    {t('placeBet')}
                </RoyalButton>
              </>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="p-8 bg-gray-900 border-2 border-yellow-500 rounded-lg text-center max-w-sm mx-4">
                        <h2 className="font-cinzel text-2xl text-yellow-400 mb-4">{t('confirmBet')}</h2>
                        <p className="text-gray-300 mb-6">
                            {betType === 'Single' 
                                ? t('areYouSureBetSingle', { points: points, digit: selectedDigit! })
                                : t('areYouSureBetPatti', { points: points, patti: pattiNumbers.join(''), digit: calculatedPattiDigit! })
                            }
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors font-bold">{t('cancel')}</button>
                            <RoyalButton onClick={confirmBet}>{t('confirm')}</RoyalButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BettingPanel;