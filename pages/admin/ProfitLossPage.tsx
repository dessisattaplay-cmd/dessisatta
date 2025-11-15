import React, { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { getAllUsers, getAllBets } from '../../services/adminService';
import { calculateUserPnl } from '../../services/reportingService';
import type { User, Bet } from '../../types';

type PnlData = {
    totalBet: number;
    totalWinnings: number;
    netPnl: number;
};

const ProfitLossPage: React.FC = () => {
    const { t } = useLocalization();
    const [users, setUsers] = useState<User[]>([]);
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'user' | 'agent'>('user');

    useEffect(() => {
        setLoading(true);
        setUsers(getAllUsers());
        setBets(getAllBets());
        setLoading(false);
    }, []);

    const pnlDataMap = useMemo(() => {
        const map = new Map<string, PnlData>();
        users.forEach(user => {
            const pnl = calculateUserPnl(user.id, bets);
            map.set(user.id, pnl);
        });
        return map;
    }, [users, bets]);

    const agents = useMemo(() => users.filter(u => u.role === 'agent'), [users]);

    const PnlRow: React.FC<{ value: number }> = ({ value }) => (
        <span className={value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'}>
            {value.toLocaleString(undefined, { signDisplay: 'exceptZero' })}
        </span>
    );

    if (loading) {
        return <div className="text-center p-8 text-yellow-400 font-cinzel">{t('loading')}...</div>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            <h1 className="text-3xl font-cinzel text-yellow-400 text-center">{t('profitLoss')}</h1>

            <div className="border-b border-amber-500/50 flex justify-center">
                <button onClick={() => setActiveTab('user')} className={`px-6 py-2 font-cinzel text-lg transition-colors ${activeTab === 'user' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>{t('userPl')}</button>
                <button onClick={() => setActiveTab('agent')} className={`px-6 py-2 font-cinzel text-lg transition-colors ${activeTab === 'agent' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>{t('agentPl')}</button>
            </div>

            <div className="overflow-x-auto max-h-[70vh]">
                {activeTab === 'user' ? (
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="sticky top-0 bg-gray-800">
                            <tr>
                                <th className="p-2">{t('user')}</th>
                                <th className="p-2">{t('role')}</th>
                                <th className="p-2">{t('totalBet')}</th>
                                <th className="p-2">{t('totalWinnings')}</th>
                                <th className="p-2">{t('userNetPl')}</th>
                                <th className="p-2">{t('platformProfit')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const pnl = pnlDataMap.get(user.id);
                                if (!pnl || pnl.totalBet === 0) return null;
                                const platformProfit = -pnl.netPnl;

                                return (
                                    <tr key={user.id} className="border-b border-gray-700/50">
                                        <td className="p-2 font-bold">{user.username}</td>
                                        <td className="p-2 text-sm capitalize">{t(user.role)}</td>
                                        <td className="p-2">{pnl.totalBet.toLocaleString()}</td>
                                        <td className="p-2">{pnl.totalWinnings.toLocaleString()}</td>
                                        <td className="p-2 font-semibold"><PnlRow value={pnl.netPnl} /></td>
                                        <td className="p-2 font-semibold"><PnlRow value={platformProfit} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left min-w-[900px]">
                         <thead className="sticky top-0 bg-gray-800">
                            <tr>
                                <th className="p-2">{t('agent')}</th>
                                <th className="p-2">{t('commissionRate')}</th>
                                <th className="p-2">{t('assignedUsers')}</th>
                                <th className="p-2">{t('totalBet')}</th>
                                <th className="p-2">{t('totalWinnings')}</th>
                                <th className="p-2">{t('platformProfit')}</th>
                                <th className="p-2">{t('commissionPaid')}</th>
                                <th className="p-2">{t('adminNetProfit')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map(agent => {
                                const assignedUsers = users.filter(u => u.agentId === agent.id);
                                if (assignedUsers.length === 0) return null;
                                
                                const agentPnl = assignedUsers.reduce((acc, currUser) => {
                                    const pnl = pnlDataMap.get(currUser.id);
                                    if(pnl) {
                                        acc.totalBet += pnl.totalBet;
                                        acc.totalWinnings += pnl.totalWinnings;
                                    }
                                    return acc;
                                }, { totalBet: 0, totalWinnings: 0 });

                                const platformProfit = agentPnl.totalBet - agentPnl.totalWinnings;
                                const commissionPaid = platformProfit > 0 ? platformProfit * ((agent.commissionRate || 0) / 100) : 0;
                                const adminNetProfit = platformProfit - commissionPaid;

                                return (
                                    <tr key={agent.id} className="border-b border-gray-700/50">
                                        <td className="p-2 font-bold">{agent.username}</td>
                                        <td className="p-2">{agent.commissionRate || 0}%</td>
                                        <td className="p-2">{assignedUsers.length}</td>
                                        <td className="p-2">{agentPnl.totalBet.toLocaleString()}</td>
                                        <td className="p-2">{agentPnl.totalWinnings.toLocaleString()}</td>
                                        <td className="p-2 font-semibold"><PnlRow value={platformProfit} /></td>
                                        <td className="p-2 font-semibold text-red-400">-{commissionPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                        <td className="p-2 font-semibold"><PnlRow value={adminNetProfit} /></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProfitLossPage;