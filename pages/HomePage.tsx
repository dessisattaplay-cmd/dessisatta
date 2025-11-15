import React, { useState } from 'react';
import LiveBaziDisplay from '../components/bazi/LiveBaziDisplay';
import WinnerComments from '../components/comments/WinnerComments';
import { useNavigate } from 'react-router-dom';
import RoyalButton from '../components/ui/RoyalButton';
import { useLocalization } from '../hooks/useLocalization';
import { useAuth } from '../hooks/useAuth';
import useRotatingContent from '../hooks/useRotatingContent';
import { MULTI_LANGUAGE_CONTENT } from '../constants';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useLocalization();
    const { isAuthenticated } = useAuth();
    const [baziKey, setBaziKey] = useState(0);

    const taglines = MULTI_LANGUAGE_CONTENT.TAGLINES[language];
    const currentTagline = useRotatingContent(taglines, 5000);

    return (
        <div className="space-y-16">
            <div className="text-center py-10 px-4 bg-gradient-to-b from-black/20 to-transparent">
                 <h1 className="text-5xl md:text-7xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 animate-glow">
                    {t('mainBannerTitle')}
                </h1>
                <p className="mt-4 text-xl md:text-2xl text-gray-300 font-teko tracking-wider h-8 transition-opacity duration-500" key={currentTagline}>
                   {currentTagline}
                </p>
                 {!isAuthenticated && <RoyalButton onClick={() => navigate('/register')} className="mt-8 text-lg">
                    {t('enterRoyalArena')}
                </RoyalButton>}
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <LiveBaziDisplay onNewBazi={() => setBaziKey(prev => prev + 1)} />
              </div>
              <div className="lg:col-span-1">
                <WinnerComments key={baziKey} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-6 bg-black/30 border border-amber-500/30 rounded-lg">
                    <h3 className="font-cinzel text-xl text-yellow-400">{t('joinTheElite')}</h3>
                    <p className="text-gray-400 mt-2">{t('joinTheEliteDesc')}</p>
                </div>
                <div className="p-6 bg-black/30 border border-blue-500/30 rounded-lg">
                    <h3 className="font-cinzel text-xl text-blue-300">{t('royalWinners')}</h3>
                    <p className="text-gray-400 mt-2">{t('royalWinnersDesc')}</p>
                </div>
                <div className="p-6 bg-black/30 border border-green-500/30 rounded-lg">
                    <h3 className="font-cinzel text-xl text-green-400">{t('securePlatform')}</h3>
                    <p className="text-gray-400 mt-2">{t('securePlatformDesc')}</p>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default HomePage;