import React, { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { getAllBets } from '../../services/adminService';
import type { Bet } from '../../types';

type Tab = 'live' | 'history';

const BetTable: React.FC<{ bets: Bet[], betType: 'Single' | 'Patti', t: Function }> = ({ bets, betType, t }) => {
    const filteredBets = bets.filter(b => b.betType === betType);

    if (filteredBets.length === 0) {
        return <p className="text-gray-500 py-4 text-center">{t('noBetsPlaced')}</p>;
    }

    return (
        <table className="w-full text-left">
            <thead className="bg-gray-800/50">
                <tr>
                    <th className="p-2">{t('user')}</th>
                    <th className="p-2">Bet Details</th>
                    <th className="p-2">{t('betAmount')}</th>
                    <th className="p-2 hidden md:table-cell">{t('date')}</th>
                    <th className="p-2">{t('status')}</th>
                </tr>
            </thead>
            <tbody>
                {filteredBets.map(bet => (
                    <tr key={bet.id} className="border-b border-gray-700/50">
                        <td className="p-2 text-sm">{bet.userId}</td>
                        <td className="p-2">
                            {betType === 'Patti' && bet.pattiNumbers ? (
                                <p className="text-sm">Patti: <span className="font-bold text-yellow-400">{bet.pattiNumbers.join('')}</span> → <span className="font-bold">{bet.digit}</span></p>
                            ) : (
                                <p className="font-bold">{bet.digit}</p>
                            )}
                        </td>
                        <td className="p-2 font-teko text-lg">{bet.points}</td>
                        <td className="p-2 text-xs text-gray-400 hidden md:table-cell">{new Date(bet.timestamp).toLocaleString()}</td>
                        <td className="p-2">
                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                 bet.status === 'Pending' ? 'bg-yellow-600 text-black' : 
                                 bet.status === 'Won' ? 'bg-green-600 text-white' : 
                                 'bg-red-600 text-white'
                             }`}>
                                {bet.status}
                             </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


const BetManagementPage: React.FC = () => {
    const [allBets, setAllBets] = useState<Bet[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('live');
    const { t } = useLocalization();

    useEffect(() => {
        setAllBets(getAllBets().sort((a, b) => b.timestamp - a.timestamp));
    }, []);

    const { liveBets, historyBets } = useMemo(() => {
        const live = allBets.filter(b => b.status === 'Pending');
        const history = allBets.filter(b => b.status === 'Won' || b.status === 'Lost');
        return { liveBets: live, historyBets: history };
    }, [allBets]);

    const betsToShow = activeTab === 'live' ? liveBets : historyBets;

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            <h1 className="text-3xl font-cinzel text-yellow-400 text-center">{t('betManagement')}</h1>

             <div className="border-b border-amber-500/50 flex justify-center">
                <button 
                    onClick={() => setActiveTab('live')} 
                    className={`px-6 py-2 font-cinzel text-lg transition-colors ${activeTab === 'live' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
                >
                    {t('liveBets')} ({liveBets.length})
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`px-6 py-2 font-cinzel text-lg transition-colors ${activeTab === 'history' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
                >
                    {t('betHistory')} ({historyBets.length})
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-cinzel text-amber-300 mb-2">{t('singleBets')}</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-700/50 max-h-[40vh]">
                        <BetTable bets={betsToShow} betType="Single" t={t} />
                    </div>
                </div>
                 <div>
                    <h2 className="text-xl font-cinzel text-amber-300 mb-2">{t('pattiBets')}</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-700/50 max-h-[40vh]">
                        <BetTable bets={betsToShow} betType="Patti" t={t} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BetManagementPage;
