import React, { useState, useEffect, useMemo } from 'react';
import { getAllTransactions } from '../services/paymentService';
import { exportTransactionsCSV } from '../services/reportingService';
import type { Transaction } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import RoyalButton from '../components/ui/RoyalButton';
import { Download } from 'lucide-react';

const SystemLogsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { t } = useLocalization();

    useEffect(() => {
        setLoading(true);
        setTransactions(getAllTransactions().sort((a, b) => b.timestamp - a.timestamp));
        setLoading(false);
    }, []);

    const filteredTransactions = useMemo(() => {
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        return transactions.filter(tx => {
            const typeMatch = filterType ? tx.type === filterType : true;
            const userMatch = filterUser 
                ? tx.userFullName.toLowerCase().includes(filterUser.toLowerCase()) || tx.userId.toLowerCase().includes(filterUser.toLowerCase()) 
                : true;
            const dateMatch = tx.timestamp >= start && tx.timestamp <= end;
            return typeMatch && userMatch && dateMatch;
        });
    }, [transactions, filterType, filterUser, startDate, endDate]);
    
    const transactionTypes = useMemo(() => [...new Set(transactions.map(tx => tx.type))], [transactions]);

    const StatusBadge: React.FC<{ status: Transaction['status'] }> = ({ status }) => {
        const style = {
            Pending: 'bg-yellow-600',
            Approved: 'bg-green-600',
            Rejected: 'bg-red-600',
            Completed: 'bg-blue-600'
        }[status];
        return <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${style}`}>{status}</span>
    }
    
    const AmountDisplay: React.FC<{ type: Transaction['type'], amount: number }> = ({ type, amount }) => {
        const isCredit = ['Deposit', 'Win', 'Admin Credit', 'Bonus'].includes(type);
        const isDebit = ['Withdrawal', 'Bet', 'Admin Debit'].includes(type);
        const color = isCredit ? 'text-green-400' : isDebit ? 'text-red-400' : 'text-white';
        const prefix = isCredit ? '+' : isDebit ? '-' : '';
        return <span className={`font-teko text-xl ${color}`}>{prefix}{amount.toLocaleString()}</span>
    }
    
    const handleDownload = () => {
        exportTransactionsCSV(filteredTransactions, `System_Logs_${new Date().toISOString()}.csv`);
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-cinzel text-yellow-400">{t('viewSystemLogs')}</h1>
                <RoyalButton onClick={handleDownload} className="flex items-center gap-2">
                    <Download size={16}/> {t('download')}
                </RoyalButton>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                    type="text"
                    placeholder={t('filterByUser')}
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white placeholder-gray-500"
                />
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white"
                >
                    <option value="">{t('filterByType')}</option>
                    {transactionTypes.map(type => <option key={type} value={type}>{t(type.toLowerCase())}</option>)}
                </select>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white" />
            </div>

            <div className="overflow-x-auto max-h-[70vh]">
                {loading ? <p className="text-center">{t('loading')}...</p> : 
                 filteredTransactions.length > 0 ? (
                    <table className="w-full min-w-[800px] text-left">
                        <thead className="bg-gray-800/50 sticky top-0">
                            <tr>
                                <th className="p-3">{t('date')}</th>
                                <th className="p-3">{t('user')}</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">{t('amount')}</th>
                                <th className="p-3 text-center">{t('status')}</th>
                                <th className="p-3">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                                    <td className="p-3 text-sm text-gray-400 whitespace-nowrap">{new Date(tx.timestamp).toLocaleString()}</td>
                                    <td className="p-3">
                                        <p className="font-bold">{tx.userFullName}</p>
                                        <p className="text-xs text-gray-500">{tx.userId}</p>
                                    </td>
                                    <td className="p-3 font-semibold">{t(tx.type.toLowerCase())}</td>
                                    <td className="p-3"><AmountDisplay type={tx.type} amount={tx.amount} /></td>
                                    <td className="p-3 text-center"><StatusBadge status={tx.status} /></td>
                                    <td className="p-3 text-sm text-gray-300 max-w-xs truncate">{tx.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 ) : (
                    <p className="text-center text-gray-500 py-10">{t('noResultsFound')}</p>
                 )}
            </div>
        </div>
    );
};

export default SystemLogsPage;