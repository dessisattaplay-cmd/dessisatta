import React, { useState, useEffect, useMemo } from 'react';
import { getPendingTransactions, processTransaction } from '../services/paymentService';
import type { Transaction } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { Check, X, Download } from 'lucide-react';
import RoyalButton from '../components/ui/RoyalButton';
import RoyalInput from '../components/ui/RoyalInput';

type Tab = 'deposits' | 'withdrawals';

const ReceiptViewerModal: React.FC<{
    imageUrl: string;
    transactionId: string;
    onClose: () => void;
}> = ({ imageUrl, transactionId, onClose }) => {
    const { t } = useLocalization();
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-gray-900 p-4 border-2 border-amber-500 rounded-lg max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-4 -right-4 bg-red-600 rounded-full p-2 text-white hover:bg-red-700 transition-colors z-10">
                    <X size={20}/>
                </button>
                <img src={imageUrl} alt="Transaction Receipt" className="max-w-full max-h-[75vh] object-contain rounded"/>
                <div className="mt-4 text-center">
                    <a href={imageUrl} download={`receipt-${transactionId}.jpg`} className="inline-block">
                        <RoyalButton className="flex items-center gap-2">
                            <Download size={16}/> {t('downloadReceipt')}
                        </RoyalButton>
                    </a>
                </div>
            </div>
        </div>
    );
};

const ApprovalModal: React.FC<{
    transaction: Transaction;
    onClose: () => void;
    onConfirm: (transactionId: string, bonus: number) => void;
}> = ({ transaction, onClose, onConfirm }) => {
    const { t } = useLocalization();
    const [bonus, setBonus] = useState('');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg max-w-sm w-full mx-4">
                <h2 className="font-cinzel text-xl text-yellow-400 mb-4">{t('approveDeposit')}</h2>
                <p>{t('user')}: {transaction.userFullName}</p>
                <p>{t('amount')}: {transaction.amount}</p>
                {transaction.utrNumber && <p>UTR: {transaction.utrNumber}</p>}
                
                {transaction.receiptImageUrl && (
                    <div className="my-2">
                        <p className="text-sm font-semibold mb-1">{t('receipt')}:</p>
                        <img src={transaction.receiptImageUrl} alt="Receipt preview" className="max-w-[100px] rounded-md border border-gray-600" />
                    </div>
                )}

                <div className="my-4">
                    <RoyalInput 
                        label={t('bonusAmount')}
                        type="number"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        placeholder="e.g., 10"
                    />
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-bold">{t('cancel')}</button>
                    <RoyalButton onClick={() => onConfirm(transaction.id, Number(bonus) || 0)}>{t('confirmApproval')}</RoyalButton>
                </div>
            </div>
        </div>
    );
};

const RejectionModal: React.FC<{
    transaction: Transaction;
    onClose: () => void;
    onConfirm: (transactionId: string, reason: string) => void;
}> = ({ transaction, onClose, onConfirm }) => {
    const { t } = useLocalization();
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="p-6 bg-gray-900 border-2 border-red-500 rounded-lg max-w-sm w-full mx-4">
                <h2 className="font-cinzel text-xl text-red-400 mb-4">{t('confirmRejection')}</h2>
                <p>{t('user')}: {transaction.userFullName}</p>
                <p>{t('amount')}: {transaction.amount}</p>
                
                <div className="my-4">
                    <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">{t('rejectionReason')}</label>
                     <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('rejectionReasonPlaceholder')}
                        rows={3}
                        className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-bold">{t('cancel')}</button>
                    <RoyalButton onClick={() => onConfirm(transaction.id, reason)} disabled={!reason.trim()} className="bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-red-500/50">{t('reject')}</RoyalButton>
                </div>
            </div>
        </div>
    );
};

// Mobile Card Component
const RequestCard: React.FC<{
    tx: Transaction;
    onApprove: (tx: Transaction) => void;
    onReject: (tx: Transaction) => void;
    onViewReceipt: (tx: Transaction) => void;
    t: (key: string) => string;
}> = ({ tx, onApprove, onReject, onViewReceipt, t }) => (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold">{tx.userFullName}</p>
                <p className="text-xs text-gray-400">{tx.userId}</p>
            </div>
            <p className="font-teko text-2xl text-yellow-300">{tx.amount.toLocaleString()}</p>
        </div>
        <div className="text-sm text-gray-300 space-y-1 border-t border-gray-700 pt-2">
            <p><strong>{t('date')}:</strong> {new Date(tx.timestamp).toLocaleString()}</p>
            {tx.type === 'Deposit' && tx.utrNumber && <p><strong>UTR:</strong> {tx.utrNumber}</p>}
            {tx.type === 'Withdrawal' && tx.withdrawalDetails && (
                <>
                    <p><strong>{t('accountHolderName')}:</strong> {tx.withdrawalDetails.accountHolderName}</p>
                    <p><strong>{t('contactNumber')}:</strong> {tx.withdrawalDetails.contactNumber}</p>
                    {tx.withdrawalDetails.paymentMethod === 'upi' ? (
                        <p><strong>UPI:</strong> {tx.withdrawalDetails.upiId}</p>
                    ) : (
                        <>
                            <p><strong>A/C:</strong> {tx.withdrawalDetails.bankAccountNumber}</p>
                            <p><strong>IFSC:</strong> {tx.withdrawalDetails.ifscCode}</p>
                        </>
                    )}
                </>
            )}
            {tx.receiptImageUrl && (
                <button onClick={() => onViewReceipt(tx)} className="text-blue-400 hover:underline font-semibold">{t('viewReceipt')}</button>
            )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onReject(tx)} className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-1 flex justify-center" aria-label={t('reject')}>
                <X size={20} />
            </button>
            <button onClick={() => onApprove(tx)} className="p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex-1 flex justify-center" aria-label={t('approve')}>
                <Check size={20} />
            </button>
        </div>
    </div>
);


const PaymentAdminPage: React.FC = () => {
    const [pending, setPending] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('deposits');
    const [loading, setLoading] = useState(true);
    const [approvingTx, setApprovingTx] = useState<Transaction | null>(null);
    const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
    const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
    const { t } = useLocalization();

    const fetchRequests = () => {
        setLoading(true);
        setPending(getPendingTransactions());
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprovalConfirm = (transactionId: string, bonus: number) => {
        if (processTransaction(transactionId, 'approve', { bonusAmount: bonus })) {
            fetchRequests();
        } else {
            alert('Failed to process transaction. See console for details.');
        }
        setApprovingTx(null);
    };
    
    const handleRejectionConfirm = (transactionId: string, reason: string) => {
        if (processTransaction(transactionId, 'reject', { rejectionReason: reason })) {
            fetchRequests();
        } else {
            alert('Failed to process transaction. See console for details.');
        }
        setRejectingTx(null);
    };

    const filteredTransactions = useMemo(() => {
        const type = activeTab === 'deposits' ? 'Deposit' : 'Withdrawal';
        return pending.filter(tx => tx.type === type);
    }, [pending, activeTab]);
    
    return (
        <div className="space-y-8 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            {approvingTx && <ApprovalModal transaction={approvingTx} onClose={() => setApprovingTx(null)} onConfirm={handleApprovalConfirm} />}
            {rejectingTx && <RejectionModal transaction={rejectingTx} onClose={() => setRejectingTx(null)} onConfirm={handleRejectionConfirm} />}
            {viewingReceiptTx && viewingReceiptTx.receiptImageUrl && (
                <ReceiptViewerModal 
                    imageUrl={viewingReceiptTx.receiptImageUrl}
                    transactionId={viewingReceiptTx.id}
                    onClose={() => setViewingReceiptTx(null)}
                />
            )}

            <h1 className="text-4xl font-cinzel text-center text-yellow-400">{t('paymentAdminPanel')}</h1>
            
            <div className="border-b border-amber-500/50 flex justify-center">
                <button 
                    onClick={() => setActiveTab('deposits')} 
                    className={`px-6 py-2 font-cinzel text-lg transition-colors ${activeTab === 'deposits' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
                >
                    {t('depositRequests')}
                </button>
                <button 
                    onClick={() => setActiveTab('withdrawals')} 
                    className={`px-6 py-2 font-cinzel text-lg transition-colors ${activeTab === 'withdrawals' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
                >
                    {t('withdrawalRequests')}
                </button>
            </div>

            <div>
                {loading ? <p className="text-center">{t('loading')}...</p> : 
                 filteredTransactions.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full min-w-[700px] text-left">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="p-3">{t('user')}</th>
                                        <th className="p-3">{t('amount')}</th>
                                        <th className="p-3">Details</th>
                                        <th className="p-3 hidden md:table-cell">{t('date')}</th>
                                        <th className="p-3 text-center">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                                            <td className="p-3">
                                                <p className="font-bold">{tx.userFullName}</p>
                                                <p className="text-xs text-gray-400">{tx.userId}</p>
                                            </td>
                                            <td className="p-3 font-teko text-2xl text-yellow-300">{tx.amount.toLocaleString()}</td>
                                            <td className="p-3 text-xs text-gray-300">
                                                {tx.type === 'Deposit' && tx.utrNumber && <div><strong>UTR:</strong> {tx.utrNumber}</div>}
                                                {tx.receiptImageUrl && (
                                                    <button 
                                                        onClick={() => setViewingReceiptTx(tx)} 
                                                        className="mt-1 text-sm text-blue-400 hover:text-blue-500 font-semibold hover:underline"
                                                    >
                                                        {t('viewReceipt')}
                                                    </button>
                                                )}
                                                {tx.type === 'Withdrawal' && tx.withdrawalDetails && (
                                                    <div>
                                                        <div><strong>{t('accountHolderName')}:</strong> {tx.withdrawalDetails.accountHolderName}</div>
                                                        <div><strong>{t('contactNumber')}:</strong> {tx.withdrawalDetails.contactNumber}</div>
                                                        {tx.withdrawalDetails.paymentMethod === 'upi' ? (
                                                            <div><strong>UPI:</strong> {tx.withdrawalDetails.upiId}</div>
                                                        ) : (
                                                            <>
                                                            <div><strong>A/C:</strong> {tx.withdrawalDetails.bankAccountNumber}</div>
                                                            <div><strong>IFSC:</strong> {tx.withdrawalDetails.ifscCode}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-gray-400 hidden md:table-cell">{new Date(tx.timestamp).toLocaleString()}</td>
                                            <td className="p-3">
                                                <div className="flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => tx.type === 'Deposit' ? setApprovingTx(tx) : handleApprovalConfirm(tx.id, 0)}
                                                        className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                                                        aria-label={t('approve')}
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setRejectingTx(tx)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                                                        aria-label={t('reject')}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Card View */}
                        <div className="space-y-4 md:hidden">
                            {filteredTransactions.map(tx => (
                                <RequestCard 
                                    key={tx.id}
                                    tx={tx}
                                    onApprove={tx.type === 'Deposit' ? setApprovingTx : (t) => handleApprovalConfirm(t.id, 0)}
                                    onReject={setRejectingTx}
                                    onViewReceipt={setViewingReceiptTx}
                                    t={t}
                                />
                            ))}
                        </div>
                    </>
                 ) : (
                    <p className="text-center text-gray-500 py-10">{t('noPendingRequests')}</p>
                 )}
            </div>
        </div>
    );
};

export default PaymentAdminPage;
