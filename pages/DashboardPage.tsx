import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import RoyalButton from '../components/ui/RoyalButton';
import { useNavigate } from 'react-router-dom';
import { Gem, ShieldCheck, Landmark, History, User as UserIcon, ListOrdered, X, Megaphone, Star } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import type { Bet, BroadcastMessage, PromotionalMessage } from '../types';
import { getBroadcastMessage, getActivePromotionalMessages } from '../services/adminService';
import { MULTI_LANGUAGE_CONTENT } from '../constants';
import useRotatingContent from '../hooks/useRotatingContent';
import MembershipBadge from '../components/common/MembershipBadge';


const PromotionalBanner: React.FC = () => {
    const [promo, setPromo] = useState<PromotionalMessage | null>(null);

    useEffect(() => {
        const activePromos = getActivePromotionalMessages();
        if (activePromos.length > 0) {
            // Pick a random one to display
            const randomPromo = activePromos[Math.floor(Math.random() * activePromos.length)];
            setPromo(randomPromo);
        }
    }, []);

    if (!promo) return null;

    return (
        <div className="p-3 mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg flex items-center justify-center gap-3">
             <Star className="w-5 h-5 text-white animate-pulse"/>
             <p className="text-white font-semibold text-sm text-center">{promo.message}</p>
        </div>
    );
};


const BroadcastBanner: React.FC = () => {
    const [message, setMessage] = useState<BroadcastMessage | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const msg = getBroadcastMessage();
        if (msg) {
            const lastSeenId = localStorage.getItem('royal-fortune-last-seen-broadcast');
            if (String(msg.id) !== lastSeenId) {
                setMessage(msg);
                setIsVisible(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        if (message) {
            localStorage.setItem('royal-fortune-last-seen-broadcast', String(message.id));
        }
        setIsVisible(false);
    };

    if (!isVisible || !message) return null;

    return (
        <div className="p-4 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <Megaphone className="w-6 h-6 text-white"/>
             <p className="text-white font-semibold">{message.message}</p>
           </div>
            <button onClick={handleDismiss} className="text-white hover:bg-white/20 rounded-full p-1">
                <X size={18} />
            </button>
        </div>
    );
};

const REFERRAL_BROADCAST_KEY = 'dessi-satta-referral-broadcast-info';
const COOLDOWN_PERIOD = 20 * 60 * 60 * 1000; // 20 hours
const SHOW_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const SHOW_CHANCE = 0.25; // 25% chance to show after cooldown

const ReferralBonusBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { t, language } = useLocalization();
    const messages = MULTI_LANGUAGE_CONTENT.REFERRAL_MESSAGES[language];
    const currentMessage = useRotatingContent(messages, 8000);

    useEffect(() => {
        try {
            const infoStr = localStorage.getItem(REFERRAL_BROADCAST_KEY);
            const info = infoStr ? JSON.parse(infoStr) : { lastShown: 0, showUntil: 0 };
            const now = Date.now();

            if (now < info.showUntil) {
                // Still within the show window
                setIsVisible(true);
            } else if (now > info.lastShown + COOLDOWN_PERIOD) {
                // Cooldown is over, try to show
                if (Math.random() < SHOW_CHANCE) {
                    const newInfo = {
                        lastShown: now,
                        showUntil: now + SHOW_DURATION,
                    };
                    localStorage.setItem(REFERRAL_BROADCAST_KEY, JSON.stringify(newInfo));
                    setIsVisible(true);
                }
            }
        } catch (e) {
            console.error("Failed to process referral broadcast logic", e);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="p-3 mb-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-lg flex items-center justify-center gap-3">
             <Star className="w-5 h-5 text-white animate-pulse"/>
             <div className="text-white font-semibold text-sm text-center">
                 <p className="font-bold">{t('referralBroadcastTitle')}</p>
                 <p className="text-xs transition-opacity duration-500" key={currentMessage}>{currentMessage}</p>
             </div>
        </div>
    );
};


const DashboardPage: React.FC = () => {
  const { user, getTransactions, getBets } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();

  const transactions = getTransactions().slice(0, 5); // Show latest 5
  const bets: Bet[] = getBets().slice(0, 5);

  if (!user) {
    return <div>{t('loading')}...</div>;
  }
  
  return (
    <div className="space-y-8">
      <BroadcastBanner />
      <PromotionalBanner />
      <ReferralBonusBanner />

      <div className="p-6 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-2 border-amber-500/50 rounded-xl flex flex-col sm:flex-row items-center gap-6 shadow-lg shadow-amber-500/10">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center border-4 border-black/50 flex-shrink-0">
          <UserIcon className="w-12 h-12 text-black"/>
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-cinzel flex items-center justify-center sm:justify-start flex-wrap gap-x-3 gap-y-2">
            {user.fullName}
            {user.membership.currentTier !== 'none' && <MembershipBadge tier={user.membership.currentTier} />}
          </h1>
          <p className="text-gray-400">@{user.username}</p>
          {user.role === 'admin' && <span className="mt-2 inline-block px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-full flex items-center gap-1"><ShieldCheck size={14}/> {t('admin')}</span>}
          {user.role === 'agent' && <span className="mt-2 inline-block px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded-full flex items-center gap-1"><ShieldCheck size={14}/> {t('agent')}</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Wallet */}
        <div className="p-6 bg-black/30 border border-green-500/30 rounded-xl text-center flex flex-col justify-between">
            <div>
              <Gem className="w-10 h-10 mx-auto text-green-400 mb-2" />
              <h3 className="font-cinzel text-lg text-gray-400">{t('pointsBalance')}</h3>
              <p className="text-5xl font-bold text-green-400 my-2 font-teko animate-pulse">
                  {user.points.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 justify-center mt-4">
                <RoyalButton onClick={() => navigate('/points?action=deposit')} className="text-sm px-4 py-2 flex-1">{t('deposit')}</RoyalButton>
                <RoyalButton onClick={() => navigate('/points?action=withdraw')} className="text-sm px-4 py-2 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 hover:from-gray-400 hover:to-gray-600 flex-1">{t('withdraw')}</RoyalButton>
            </div>
        </div>
        {/* Referral */}
        <div className="p-6 bg-black/30 border border-blue-500/30 rounded-xl text-center flex flex-col justify-between">
            <div>
              <Landmark className="w-10 h-10 mx-auto text-blue-400 mb-2" />
              <h3 className="font-cinzel text-lg text-gray-400">{t('referralCode')}</h3>
              <p className="text-3xl font-bold text-blue-300 bg-black/40 py-2 rounded-lg my-2 tracking-widest font-teko">{user.referralCode}</p>
            </div>
            <RoyalButton className="text-sm px-4 py-2 mt-4" onClick={() => navigator.clipboard.writeText(user.referralCode)}>{t('copyCode')}</RoyalButton>
        </div>
        {/* Quick Actions */}
         <div className="p-6 bg-black/30 border border-amber-500/30 rounded-xl text-center flex flex-col justify-around gap-4">
            <RoyalButton onClick={() => navigate('/')} className="w-full">{t('liveBazi')}</RoyalButton>
            <RoyalButton onClick={() => navigate('/history')} className="w-full">{t('resultHistory')}</RoyalButton>
            <RoyalButton onClick={() => navigate('/profile')} className="w-full">{t('myProfile')}</RoyalButton>
             {user.role === 'admin' && <RoyalButton onClick={() => navigate('/admin')} className="w-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">{t('adminPanel')}</RoyalButton>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-cinzel mb-4 flex items-center gap-2"><ListOrdered/> {t('bettingHistory')}</h2>
          <div className="bg-black/30 border border-gray-700/50 rounded-xl p-4 min-h-[280px]">
              {bets.length > 0 ? (
                  <ul role="list" className="divide-y divide-gray-700/50">
                      {bets.map(bet => (
                          <li key={bet.id} className="flex items-center justify-between py-3">
                              <div>
                                  <p className="font-bold text-white">Bazi #{bet.baziNumber}</p>
                                  {bet.betType === 'Patti' && bet.pattiNumbers ? (
                                    <p className="text-sm text-gray-300">Patti: <span className="text-yellow-400 font-semibold">{bet.pattiNumbers.join('')}</span> → Digit: <span className="text-yellow-400 font-semibold">{bet.digit}</span></p>
                                  ) : (
                                    <p className="text-sm text-gray-300">Digit: <span className="text-yellow-400 font-semibold">{bet.digit}</span></p>
                                  )}
                                  <p className="text-xs text-gray-400">{new Date(bet.timestamp).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold font-teko text-xl ${bet.status === 'Won' ? 'text-green-400' : 'text-red-400'}`}>
                                    {bet.status === 'Won' ? `+${(bet.winnings || 0).toLocaleString()}`: `-${bet.points.toLocaleString()}`} {t('points')}
                                </p>
                                <p className={`text-xs ${bet.status === 'Won' ? 'text-green-400' : bet.status === 'Lost' ? 'text-red-400' : 'text-orange-400'}`}>{bet.status}</p>
                              </div>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-center text-gray-500 py-4">{t('noBetsPlaced')}</p>
              )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-cinzel mb-4 flex items-center gap-2"><History/>{t('transactionHistory')}</h2>
          <div className="bg-black/30 border border-gray-700/50 rounded-xl p-4 min-h-[280px]">
              {transactions.length > 0 ? (
                  <ul role="list" className="divide-y divide-gray-700/50">
                      {transactions.map(tx => {
                          const isCredit = ['Deposit', 'Win', 'Admin Credit', 'Bonus', 'Commission'].includes(tx.type);
                          return (
                            <li key={tx.id} className="flex items-center py-3">
                                <div className="flex-1">
                                    <p className="font-bold text-white">{t(tx.type.toLowerCase())}</p>
                                    <p className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
                                </div>
                                <p className={`font-bold font-teko text-xl ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                                    {isCredit ? '+' : '-'} {tx.amount.toLocaleString()} {t('points')}
                                </p>
                            </li>
                          );
                      })}
                  </ul>
              ) : (
                  <p className="text-center text-gray-500 py-4">{t('noTransactions')}</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;