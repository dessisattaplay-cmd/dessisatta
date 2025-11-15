import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RoyalButton from '../components/ui/RoyalButton';
import RoyalInput from '../components/ui/RoyalInput';
import { ShieldCheck, Hourglass, Download } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import useForm from '../hooks/useForm';
import { getActivePaymentMethods, getPaymentStatus } from '../services/adminService';
import { submitDepositRequest } from '../services/paymentService';
import type { PaymentMethod, Transaction, Bet, PaymentStatus } from '../types';
import { useNotifications } from '../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type DepositFormValues = { amount: string; utrNumber: string };
type WithdrawFormValues = { 
    amount: string; 
    accountHolderName: string;
    contactNumber: string;
    paymentMethod: 'upi' | 'bank';
    upiId: string;
    bankAccountNumber: string;
    ifscCode: string;
};

// Mobile Card Components for History
const TransactionHistoryCard: React.FC<{ tx: Transaction, t: Function }> = ({ tx, t }) => {
    const isCredit = ['Deposit', 'Win', 'Admin Credit', 'Bonus'].includes(tx.type);
    return (
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{t(tx.type.toLowerCase())}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
                <p className={`font-teko text-xl ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                    {isCredit ? '+' : '-'} {tx.amount.toLocaleString()}
                </p>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between items-center">
                <p className="text-xs text-gray-300 truncate max-w-[200px]">{tx.description}</p>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${{'Pending': 'bg-yellow-600', 'Approved': 'bg-green-600', 'Rejected': 'bg-red-600', 'Completed': 'bg-blue-600'}[tx.status]}`}>{tx.status}</span>
            </div>
        </div>
    );
};

const BetHistoryCard: React.FC<{ bet: Bet }> = ({ bet }) => (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold">Bazi #{bet.baziNumber}</p>
                <p className="text-xs text-gray-400">{new Date(bet.timestamp).toLocaleString()}</p>
            </div>
            <p className="text-yellow-300 font-bold text-lg">{bet.betType === 'Patti' ? `${bet.pattiNumbers?.join('')} → ${bet.digit}` : bet.digit}</p>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between items-center">
            <p className="font-teko text-lg text-red-400">-{bet.points.toLocaleString()}</p>
            {bet.status === 'Won' && <p className="font-teko text-lg text-green-400">+{bet.winnings?.toLocaleString()}</p>}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bet.status === 'Pending' ? 'bg-yellow-600 text-black' : bet.status === 'Won' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{bet.status}</span>
        </div>
    </div>
);


const PointsPage: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { user, addTransaction, getTransactions, getBets } = useAuth();
  const { t } = useLocalization();
  const { addNotification } = useNotifications();
  const [action, setAction] = useState<'deposit' | 'withdraw'>(query.get('action') === 'withdraw' ? 'withdraw' : 'deposit');
  const [step, setStep] = useState(1);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ depositsEnabled: true, withdrawalsEnabled: true });
  
  // State for history section
  const [historyTab, setHistoryTab] = useState<'transactions' | 'bets'>('transactions');
  const [txFilterType, setTxFilterType] = useState('');
  const [betFilterStatus, setBetFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user) {
        setUserTransactions(getTransactions());
        setUserBets(getBets());
    }
    if (action === 'deposit') {
        setPaymentMethods(getActivePaymentMethods());
    }
    const statusInterval = setInterval(() => setPaymentStatus(getPaymentStatus()), 5000); // Check status periodically
    setPaymentStatus(getPaymentStatus()); // Initial check

    return () => clearInterval(statusInterval);
  }, [action, user, getTransactions, getBets]);
  
  const validateDeposit = (values: DepositFormValues, tFunc: (key: string, options?: Record<string, string | number>) => string) => {
      const errors: Partial<DepositFormValues> = {};
      const numericAmount = parseFloat(values.amount);
      if (!values.amount) errors.amount = tFunc('validationRequired');
      else if (isNaN(numericAmount) || numericAmount <= 0) errors.amount = tFunc('validationPositiveNumber');
      if (!values.utrNumber) errors.utrNumber = tFunc('validationRequired');
      else if (values.utrNumber.length < 6) errors.utrNumber = tFunc('validationMinLength', { length: 6 });
      return errors;
  };
  
  const validateWithdrawal = (values: WithdrawFormValues, tFunc: (key: string, options?: Record<string, string | number>) => string) => {
    const errors: Partial<WithdrawFormValues> = {};
    const numericAmount = parseFloat(values.amount);
    const MIN_WITHDRAWAL = 500;
    
    // Wagering requirement check
    const totalApprovedDeposits = userTransactions
        .filter(tx => tx.type === 'Deposit' && tx.status === 'Approved')
        .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalWagered = userBets.reduce((sum, bet) => sum + bet.points, 0);
    const wageringRequirement = totalApprovedDeposits * 0.7;

    if (totalWagered < wageringRequirement) {
        errors.amount = tFunc('validationWagering', {
            requiredAmount: wageringRequirement.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            wageredAmount: totalWagered.toLocaleString(),
        });
    }
    
    // First-time withdrawal check
    const hasApprovedWithdrawal = userTransactions.some(tx => tx.type === 'Withdrawal' && tx.status === 'Approved');

    if (!hasApprovedWithdrawal && totalApprovedDeposits < 100) {
        errors.amount = tFunc('validationFirstWithdrawal');
    }

    if (!values.amount) errors.amount = tFunc('validationRequired');
    else if (isNaN(numericAmount) || numericAmount <= 0) errors.amount = tFunc('validationPositiveNumber');
    else if (user && numericAmount > user.points) errors.amount = tFunc('validationWithdrawAmount', { balance: user.points.toLocaleString() });
    else if (numericAmount < MIN_WITHDRAWAL) errors.amount = tFunc('validationMinWithdrawal', { amount: MIN_WITHDRAWAL });

    if(!values.accountHolderName) errors.accountHolderName = tFunc('validationRequired');
    if(!values.contactNumber || !/^\d{10}$/.test(values.contactNumber)) errors.contactNumber = tFunc('validationExactLength', { length: 10 });

    if(values.paymentMethod === 'upi' && !values.upiId) errors.upiId = tFunc('validationRequired');
    if(values.paymentMethod === 'bank' && !values.bankAccountNumber) errors.bankAccountNumber = tFunc('validationRequired');
    if(values.paymentMethod === 'bank' && !values.ifscCode) errors.ifscCode = tFunc('validationRequired');
    
    return errors;
  };

  const depositForm = useForm({ amount: '', utrNumber: '' }, validateDeposit);
  const withdrawalForm = useForm({ amount: '', accountHolderName: '', contactNumber: '', paymentMethod: 'upi', upiId: '', bankAccountNumber: '', ifscCode: '' }, validateWithdrawal);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    setReceiptFile(null);
    setReceiptDataUrl(null);

    if (file) {
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setFileError(t('validationFileType'));
            return;
        }
        if (file.size > 1024 * 1024) {
            setFileError(t('validationFileSize', { size: '1MB' }));
            return;
        }

        setReceiptFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptDataUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async (formValues: DepositFormValues) => {
    if (!user) return;
    const numericAmount = parseFloat(formValues.amount);
    setSubmittedAmount(numericAmount);
    
    setStep(0); // Loading state

    await submitDepositRequest(
        user.id,
        user.fullName,
        numericAmount,
        formValues.utrNumber,
        receiptDataUrl
    );

    addNotification({ message: 'requestSubmitted', type: 'info' });
    setStep(2);
  };

  const handleWithdrawalSubmit = (formValues: WithdrawFormValues) => {
      if(!user) return;
      const numericAmount = parseFloat(formValues.amount);
      setSubmittedAmount(numericAmount);

      setStep(0);
      setTimeout(() => {
          const { amount, ...withdrawalDetails } = formValues;
          addTransaction({
              userId: user.id,
              userFullName: user.fullName,
              type: 'Withdrawal',
              amount: numericAmount,
              status: 'Pending',
              description: `Withdrawal request for ${numericAmount} points`,
              withdrawalDetails: withdrawalDetails,
          });
          addNotification({ message: 'requestSubmitted', type: 'info' });
          setStep(2);
      }, 1500);
  }

  const handleQuickAdd = (addAmount: number) => {
    const currentAmount = Number(depositForm.values.amount || 0);
    depositForm.setValues({ ...depositForm.values, amount: String(currentAmount + addAmount) });
  }

  // History Section Logic
    const filteredTransactions = useMemo(() => {
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
        return userTransactions.filter(tx => {
            const typeMatch = txFilterType ? tx.type === txFilterType : true;
            const dateMatch = tx.timestamp >= start && tx.timestamp <= end;
            return typeMatch && dateMatch;
        });
    }, [userTransactions, txFilterType, startDate, endDate]);

    const filteredBets = useMemo(() => {
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
        return userBets.filter(bet => {
            const statusMatch = betFilterStatus ? bet.status === betFilterStatus : true;
            const dateMatch = bet.timestamp >= start && bet.timestamp <= end;
            return statusMatch && dateMatch;
        });
    }, [userBets, betFilterStatus, startDate, endDate]);

    const generateTransactionsPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['Date', 'Type', 'Amount', 'Status', 'Description']],
            body: filteredTransactions.map(tx => [
                new Date(tx.timestamp).toLocaleString(),
                t(tx.type.toLowerCase()),
                tx.amount.toLocaleString(),
                tx.status,
                tx.description
            ]),
            didDrawPage: (data) => {
                 doc.text('Transaction History', data.settings.margin.left, 15);
            }
        });
        doc.save('transaction_history.pdf');
    };
    
    const generateBetsPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['Date', 'Bazi #', 'Type', 'Details', 'Points', 'Status', 'Winnings']],
            body: filteredBets.map(bet => [
                new Date(bet.timestamp).toLocaleString(),
                bet.baziNumber,
                bet.betType,
                bet.betType === 'Patti' ? `${bet.pattiNumbers?.join('')} -> ${bet.digit}` : bet.digit,
                bet.points.toLocaleString(),
                bet.status,
                bet.winnings ? `+${bet.winnings.toLocaleString()}`: '-'
            ]),
             didDrawPage: (data) => {
                 doc.text('Betting History', data.settings.margin.left, 15);
            }
        });
        doc.save('betting_history.pdf');
    };

    const transactionTypes = useMemo(() => [...new Set(userTransactions.map(tx => tx.type))], [userTransactions]);
    const betStatuses = useMemo(() => [...new Set(userBets.map(bet => bet.status))], [userBets]);

  if (step === 0) {
      return <div className="text-center p-8 font-cinzel text-2xl text-yellow-400">{t('processing')}...</div>
  }
  
  if (step === 2) {
      return (
        <div className="max-w-md mx-auto text-center p-8 bg-black/70 backdrop-blur-md border-2 border-yellow-400 rounded-xl shadow-lg shadow-yellow-400/20">
            <Hourglass className="w-20 h-20 mx-auto text-yellow-400 mb-4 animate-pulse" />
            <h1 className="font-cinzel text-3xl text-yellow-400">{t('requestSubmitted')}</h1>
            <p className="text-gray-300 mt-4">
              {t('requestSubmittedMessage', { action: t(action), amount: submittedAmount.toLocaleString() })}
            </p>
            <RoyalButton onClick={() => navigate('/dashboard')} className="w-full mt-8">
                {t('backToDashboard')}
            </RoyalButton>
        </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
        <div className="mt-10 p-4 sm:p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10">
        <div className="text-center mb-8">
            <ShieldCheck className="w-16 h-16 mx-auto text-yellow-400" />
            <h1 className="font-cinzel text-3xl mt-4 text-yellow-400">{t('securePlatformTag')}</h1>
            <p className="text-gray-400 mt-2">{t('trustedTag')}</p>
            <div className="flex justify-center bg-gray-800/50 p-1 rounded-full mt-4">
                <button onClick={() => setAction('deposit')} className={`w-1/2 py-2 rounded-full font-bold transition-colors ${action === 'deposit' ? 'bg-yellow-500 text-black' : 'text-gray-300'}`}>{t('deposit')}</button>
                <button onClick={() => setAction('withdraw')} className={`w-1/2 py-2 rounded-full font-bold transition-colors ${action === 'withdraw' ? 'bg-yellow-500 text-black' : 'text-gray-300'}`}>{t('withdraw')}</button>
            </div>
        </div>
        
        {action === 'deposit' && (
            !paymentStatus.depositsEnabled ? (
                 <div className="text-center p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="font-bold text-red-300">{t('depositsDisabledAdmin')}</p>
                </div>
            ) : (
                <>
                    <div className="mb-6 space-y-4">
                        <p className="font-cinzel text-center text-amber-400">{t('selectMethod')}</p>
                        {paymentMethods.length > 0 ? paymentMethods.map(method => (
                            <div key={method.id} className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                                <h3 className="font-bold text-lg text-yellow-300">{method.details.name}</h3>
                                {method.type === 'qr' && method.details.qrCodeUrl && (
                                    <img src={method.details.qrCodeUrl} alt="QR Code" className="mx-auto my-2 rounded-lg max-w-[200px]" />
                                )}
                                {method.type === 'upi' && (
                                    <p><strong>UPI ID:</strong> <span className="text-green-400">{method.details.upiId}</span></p>
                                )}
                                {method.type === 'bank' && (
                                    <div className="text-sm">
                                        <p><strong>Bank:</strong> {method.details.bankName}</p>
                                        <p><strong>A/C:</strong> {method.details.accountNumber}</p>
                                        <p><strong>IFSC:</strong> {method.details.ifscCode}</p>
                                    </div>
                                )}
                            </div>
                        )) : <p className="text-center text-gray-500">{t('noDepositMethodsAvailable')}</p>}
                    </div>
                {paymentMethods.length > 0 && (
                    <form onSubmit={depositForm.handleSubmit(handleDepositSubmit)} className="space-y-4 max-w-md mx-auto" noValidate>
                        <RoyalInput label={`${t('amount')} (${t('points')})`} type="number" name="amount" value={depositForm.values.amount} onChange={depositForm.handleChange} onBlur={depositForm.handleBlur} error={depositForm.errors.amount} touched={depositForm.touched.amount} placeholder={t('enterAmount')} required />
                        <div>
                            <label className="block text-sm font-medium text-yellow-400 mb-2 font-cinzel">{t('quickAdd')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[100, 200, 500, 1000].map(val => (
                                    <button type="button" key={val} onClick={() => handleQuickAdd(val)} className="p-2 border-2 rounded-lg transition-colors border-gray-600 hover:border-yellow-400 hover:bg-yellow-900/50 font-teko text-lg">+{val}</button>
                                ))}
                            </div>
                        </div>
                        <RoyalInput label={t('utrNumber')} type="text" name="utrNumber" value={depositForm.values.utrNumber} onChange={depositForm.handleChange} onBlur={depositForm.handleBlur} error={depositForm.errors.utrNumber} touched={depositForm.touched.utrNumber} placeholder="Enter Transaction ID" required />
                        
                        <div>
                            <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">
                                {t('transactionReceipt')} ({t('optional')})
                            </label>
                            <input 
                                type="file" 
                                accept="image/jpeg, image/png"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
                            />
                            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                            {receiptDataUrl && <img src={receiptDataUrl} alt="Receipt preview" className="mt-2 rounded max-w-[100px]" />}
                        </div>

                        <div className="pt-4">
                            <RoyalButton type="submit" className="w-full text-lg" disabled={!depositForm.isFormValid || !!fileError}>{t('proceedTo')} {t('deposit')}</RoyalButton>
                        </div>
                    </form>
                    )}
                </>
            )
        )}

        {action === 'withdraw' && (
             !paymentStatus.withdrawalsEnabled ? (
                 <div className="text-center p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="font-bold text-red-300">{t('withdrawalsDisabledAdmin')}</p>
                </div>
            ) : (
                <form onSubmit={withdrawalForm.handleSubmit(handleWithdrawalSubmit)} className="space-y-2 max-w-md mx-auto" noValidate>
                    <RoyalInput label={`${t('amount')} (${t('points')})`} type="number" name="amount" value={withdrawalForm.values.amount} onChange={withdrawalForm.handleChange} onBlur={withdrawalForm.handleBlur} error={withdrawalForm.errors.amount} touched={withdrawalForm.touched.amount} placeholder={t('enterAmount')} required />
                    <RoyalInput label={t('accountHolderName')} type="text" name="accountHolderName" value={withdrawalForm.values.accountHolderName} onChange={withdrawalForm.handleChange} onBlur={withdrawalForm.handleBlur} error={withdrawalForm.errors.accountHolderName} touched={withdrawalForm.touched.accountHolderName} required />
                    <RoyalInput label={t('contactNumber')} type="tel" name="contactNumber" value={withdrawalForm.values.contactNumber} onChange={withdrawalForm.handleChange} onBlur={withdrawalForm.handleBlur} error={withdrawalForm.errors.contactNumber} touched={withdrawalForm.touched.contactNumber} required />
                    <div>
                        <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">{t('paymentMethod')}</label>
                        <select name="paymentMethod" value={withdrawalForm.values.paymentMethod} onChange={withdrawalForm.handleChange} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2.5 px-4 text-white">
                            <option value="upi">UPI</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>
                    {withdrawalForm.values.paymentMethod === 'upi' ? (
                        <RoyalInput label={t('upiId')} type="text" name="upiId" value={withdrawalForm.values.upiId} onChange={withdrawalForm.handleChange} onBlur={withdrawalForm.handleBlur} error={withdrawalForm.errors.upiId} touched={withdrawalForm.touched.upiId} required />
                    ) : (
                        <>
                        <RoyalInput label={t('accountNumber')} type="text" name="bankAccountNumber" value={withdrawalForm.values.bankAccountNumber} onChange={withdrawalForm.handleChange} onBlur={withdrawalForm.handleBlur} error={withdrawalForm.errors.bankAccountNumber} touched={withdrawalForm.touched.bankAccountNumber} required />
                        <RoyalInput label={t('ifscCode')} type="text" name="ifscCode" value={withdrawalForm.values.ifscCode} onChange={withdrawalForm.handleChange} onBlur={withdrawalForm.handleBlur} error={withdrawalForm.errors.ifscCode} touched={withdrawalForm.touched.ifscCode} required />
                        </>
                    )}
                    <div className="pt-4">
                        <RoyalButton type="submit" className="w-full text-lg" disabled={!withdrawalForm.isFormValid}>{t('proceedTo')} {t('withdraw')}</RoyalButton>
                    </div>
                </form>
            )
        )}
        <p className="text-center text-xs text-gray-500 mt-4">{t('instantSettlement')}</p>
        </div>

        {/* Full History Section */}
        <div className="p-4 sm:p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10">
            <h2 className="font-cinzel text-3xl text-yellow-400 text-center mb-6">{t('fullHistory')}</h2>
            <div className="border-b border-amber-500/50 flex justify-center mb-4">
                <button onClick={() => setHistoryTab('transactions')} className={`px-6 py-2 font-cinzel text-lg transition-colors ${historyTab === 'transactions' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>{t('transactionHistory')}</button>
                <button onClick={() => setHistoryTab('bets')} className={`px-6 py-2 font-cinzel text-lg transition-colors ${historyTab === 'bets' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>{t('bettingHistory')}</button>
            </div>
            
            {/* Filters */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white" />
                {historyTab === 'transactions' ? (
                    <select value={txFilterType} onChange={e => setTxFilterType(e.target.value)} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white">
                        <option value="">{t('filterByType')}</option>
                        {transactionTypes.map(type => <option key={type} value={type}>{t(type.toLowerCase())}</option>)}
                    </select>
                ) : (
                    <select value={betFilterStatus} onChange={e => setBetFilterStatus(e.target.value)} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white">
                        <option value="">{t('filterByStatus')}</option>
                        {betStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                )}
                 <RoyalButton onClick={historyTab === 'transactions' ? generateTransactionsPDF : generateBetsPDF} className="flex items-center justify-center gap-2 text-sm">
                    <Download size={16}/> {t('downloadPdf')}
                </RoyalButton>
            </div>

            <div className="max-h-[60vh] rounded-lg">
                {historyTab === 'transactions' ? (
                    <>
                        <div className="overflow-x-auto hidden md:block rounded-lg border border-gray-700/50">
                            <table className="w-full min-w-[700px] text-left">
                                <thead className="bg-gray-800/50 sticky top-0"><tr>
                                    <th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Description</th>
                                </tr></thead>
                                <tbody>{filteredTransactions.map(tx => <tr key={tx.id} className="border-b border-gray-700/50">
                                    <td className="p-2 text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</td>
                                    <td className="p-2 font-semibold">{t(tx.type.toLowerCase())}</td>
                                    <td className={`p-2 font-teko text-xl ${['Deposit', 'Win', 'Admin Credit', 'Bonus'].includes(tx.type) ? 'text-green-400' : 'text-red-400'}`}>{['Deposit', 'Win', 'Admin Credit', 'Bonus'].includes(tx.type) ? '+' : '-'} {tx.amount.toLocaleString()}</td>
                                    <td className="p-2"><span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${{'Pending': 'bg-yellow-600', 'Approved': 'bg-green-600', 'Rejected': 'bg-red-600', 'Completed': 'bg-blue-600'}[tx.status]}`}>{tx.status}</span></td>
                                    <td className="p-2 text-xs text-gray-300 max-w-xs truncate">{tx.description}</td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                        <div className="space-y-3 md:hidden">
                            {filteredTransactions.map(tx => <TransactionHistoryCard key={tx.id} tx={tx} t={t} />)}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden md:block rounded-lg border border-gray-700/50">
                            <table className="w-full min-w-[700px] text-left">
                                <thead className="bg-gray-800/50 sticky top-0"><tr>
                                    <th className="p-3">Date</th><th className="p-3">Bazi #</th><th className="p-3">Type</th><th className="p-3">Details</th><th className="p-3">Points</th><th className="p-3">Status</th><th className="p-3">Winnings</th>
                                </tr></thead>
                                <tbody>{filteredBets.map(bet => <tr key={bet.id} className="border-b border-gray-700/50">
                                    <td className="p-2 text-sm text-gray-400">{new Date(bet.timestamp).toLocaleString()}</td>
                                    <td className="p-2">{bet.baziNumber}</td>
                                    <td className="p-2">{bet.betType}</td>
                                    <td className="p-2 text-yellow-300 font-bold">{bet.betType === 'Patti' ? `${bet.pattiNumbers?.join('')} → ${bet.digit}` : bet.digit}</td>
                                    <td className="p-2 font-teko text-xl text-red-400">-{bet.points.toLocaleString()}</td>
                                    <td className="p-2"><span className={`text-xs font-bold px-2 py-1 rounded-full ${bet.status === 'Pending' ? 'bg-yellow-600 text-black' : bet.status === 'Won' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{bet.status}</span></td>
                                    <td className="p-2 font-teko text-xl text-green-400">{bet.winnings ? `+${bet.winnings.toLocaleString()}`: '-'}</td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                         <div className="space-y-3 md:hidden">
                            {filteredBets.map(bet => <BetHistoryCard key={bet.id} bet={bet} />)}
                        </div>
                    </>
                )}
                 { (historyTab === 'transactions' && filteredTransactions.length === 0) && <p className="text-center p-8 text-gray-500">{t('noTransactions')}</p> }
                 { (historyTab === 'bets' && filteredBets.length === 0) && <p className="text-center p-8 text-gray-500">{t('noBetsPlaced')}</p> }
            </div>
        </div>
    </div>
  );
};

export default PointsPage;