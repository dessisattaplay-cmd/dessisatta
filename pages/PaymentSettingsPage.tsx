import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { getPaymentMethods, savePaymentMethod, deletePaymentMethod, getPaymentStatus, savePaymentStatus, getAutoPaymentSettings, saveAutoPaymentSettings, getBettingStatus, saveBettingStatus } from '../../services/adminService';
import type { PaymentMethod, PaymentStatus, AutoPaymentSettings, BettingStatus } from '../../types';
import RoyalButton from '../../components/ui/RoyalButton';
import RoyalInput from '../../components/ui/RoyalInput';
import { Edit, Trash, PlusCircle } from 'lucide-react';

const PaymentSettingsPage: React.FC = () => {
    const { t } = useLocalization();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ depositsEnabled: true, withdrawalsEnabled: true });
    const [bettingStatus, setBettingStatus] = useState<BettingStatus>({ bettingEnabled: true });
    const [autoPaymentSettings, setAutoPaymentSettings] = useState<AutoPaymentSettings>({ autoAcceptEnabled: false });

    const fetchMethods = () => setMethods(getPaymentMethods());

    useEffect(() => {
        fetchMethods();
        setPaymentStatus(getPaymentStatus());
        setBettingStatus(getBettingStatus());
        setAutoPaymentSettings(getAutoPaymentSettings());
    }, []);

    const handleStatusToggle = (type: 'deposits' | 'withdrawals') => {
        const newStatus = {
            ...paymentStatus,
            [type === 'deposits' ? 'depositsEnabled' : 'withdrawalsEnabled']: !paymentStatus[type === 'deposits' ? 'depositsEnabled' : 'withdrawalsEnabled']
        };
        savePaymentStatus(newStatus);
        setPaymentStatus(newStatus);
    };
    
    const handleBettingToggle = () => {
        const newStatus = { ...bettingStatus, bettingEnabled: !bettingStatus.bettingEnabled };
        saveBettingStatus(newStatus);
        setBettingStatus(newStatus);
    };
    
    const handleAutoPaymentToggle = () => {
        const newSettings = { ...autoPaymentSettings, autoAcceptEnabled: !autoPaymentSettings.autoAcceptEnabled };
        saveAutoPaymentSettings(newSettings);
        setAutoPaymentSettings(newSettings);
    };

    const openModal = (method: Partial<PaymentMethod> | null = null) => {
        setEditingMethod(method || { type: 'upi', details: { name: '' }, isActive: true });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
    };

    const handleSave = () => {
        if (editingMethod) {
            savePaymentMethod(editingMethod as any);
            fetchMethods();
            closeModal();
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this method?')) {
            deletePaymentMethod(id);
            fetchMethods();
        }
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'type' || name === 'isActive') {
            setEditingMethod(prev => ({...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
        } else {
             setEditingMethod(prev => ({
                ...prev,
                details: { ...prev?.details, [name]: value }
            }));
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingMethod(prev => ({...prev, details: { ...prev?.details, qrCodeUrl: reader.result as string }}));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            <h1 className="text-3xl font-cinzel text-yellow-400 text-center">{t('paymentSettings')}</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h2 className="text-xl font-cinzel mb-4">{t('systemStatus')}</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-md">
                            <label htmlFor="enableDeposits" className="font-semibold text-white">{t('enableDeposits')}</label>
                            <button onClick={() => handleStatusToggle('deposits')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${paymentStatus.depositsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${paymentStatus.depositsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                         <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-md">
                            <label htmlFor="enableWithdrawals" className="font-semibold text-white">{t('enableWithdrawals')}</label>
                            <button onClick={() => handleStatusToggle('withdrawals')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${paymentStatus.withdrawalsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${paymentStatus.withdrawalsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-md">
                            <label htmlFor="enableBetting" className="font-semibold text-white">{t('enableBetting')}</label>
                            <button onClick={handleBettingToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${bettingStatus.bettingEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${bettingStatus.bettingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h2 className="text-xl font-cinzel mb-4">{t('automationSettings')}</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-md">
                            <label htmlFor="enableAutoAccept" className="font-semibold text-white">{t('enableAutoAccept')}</label>
                            <button onClick={handleAutoPaymentToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoPaymentSettings.autoAcceptEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoPaymentSettings.autoAcceptEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-cinzel text-yellow-400">{t('managePaymentMethods')}</h2>
                <RoyalButton onClick={() => openModal()} className="flex items-center gap-2">
                    <PlusCircle size={18}/> {t('addMethod')}
                </RoyalButton>
            </div>

            <div className="space-y-4">
                {methods.map(method => (
                    <div key={method.id} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">{method.details.name} <span className="text-xs px-2 py-0.5 bg-blue-600 rounded-full">{method.type.toUpperCase()}</span></p>
                            <p className={`text-sm ${method.isActive ? 'text-green-400' : 'text-red-400'}`}>{method.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => openModal(method)} className="p-2 text-blue-400 hover:text-blue-300"><Edit size={20}/></button>
                            <button onClick={() => handleDelete(method.id)} className="p-2 text-red-500 hover:text-red-400"><Trash size={20}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && editingMethod && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg max-w-lg w-full mx-4 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-cinzel text-2xl text-yellow-400">{editingMethod.id ? t('editMethod') : t('addMethod')}</h2>
                        <RoyalInput label={t('methodName')} name="name" value={editingMethod.details?.name || ''} onChange={handleFormChange} />
                        <div>
                            <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">{t('methodType')}</label>
                            <select name="type" value={editingMethod.type} onChange={handleFormChange} className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2.5 px-4 text-white">
                                <option value="upi">UPI</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="qr">QR Code</option>
                            </select>
                        </div>

                        {editingMethod.type === 'upi' && (
                            <RoyalInput label={t('upiId')} name="upiId" value={editingMethod.details?.upiId || ''} onChange={handleFormChange} />
                        )}

                        {editingMethod.type === 'bank' && (
                            <>
                                <RoyalInput label={t('bankName')} name="bankName" value={editingMethod.details?.bankName || ''} onChange={handleFormChange} />
                                <RoyalInput label={t('accountNumber')} name="accountNumber" value={editingMethod.details?.accountNumber || ''} onChange={handleFormChange} />
                                <RoyalInput label={t('ifscCode')} name="ifscCode" value={editingMethod.details?.ifscCode || ''} onChange={handleFormChange} />
                            </>
                        )}
                        
                        {editingMethod.type === 'qr' && (
                            <div>
                                <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">{t('qrCode')}</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"/>
                                {editingMethod.details?.qrCodeUrl && <img src={editingMethod.details.qrCodeUrl} alt="QR Preview" className="mt-2 rounded max-w-[150px]" />}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                           <input type="checkbox" id="isActive" name="isActive" checked={editingMethod.isActive} onChange={handleFormChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-600"/>
                           <label htmlFor="isActive" className="text-white">{t('active')}</label>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors font-bold">{t('cancel')}</button>
                            <RoyalButton onClick={handleSave}>{t('saveMethod')}</RoyalButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSettingsPage;