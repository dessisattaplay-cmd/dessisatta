import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { getPromotionalMessages, savePromotionalMessage, deletePromotionalMessage } from '../../services/adminService';
import type { PromotionalMessage } from '../../types';
import RoyalButton from '../../components/ui/RoyalButton';
import RoyalInput from '../../components/ui/RoyalInput';
import { Edit, Trash, PlusCircle } from 'lucide-react';

const PromotionsPage: React.FC = () => {
    const { t } = useLocalization();
    const [promos, setPromos] = useState<PromotionalMessage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Partial<PromotionalMessage> | null>(null);

    const fetchPromos = () => setPromos(getPromotionalMessages());

    useEffect(() => {
        fetchPromos();
    }, []);

    const openModal = (promo: Partial<PromotionalMessage> | null = null) => {
        setEditingPromo(promo || { message: '', isActive: true });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPromo(null);
    };

    const handleSave = () => {
        if (editingPromo && editingPromo.message) {
            savePromotionalMessage(editingPromo as any);
            fetchPromos();
            closeModal();
        }
    };
    
    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this promotion?')) {
            deletePromotionalMessage(id);
            fetchPromos();
        }
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setEditingPromo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-cinzel text-yellow-400">{t('managePromotions')}</h1>
                <RoyalButton onClick={() => openModal()} className="flex items-center gap-2">
                    <PlusCircle size={18}/> {t('addPromotion')}
                </RoyalButton>
            </div>

            <div className="space-y-4">
                {promos.map(promo => (
                    <div key={promo.id} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="text-lg">"{promo.message}"</p>
                            <p className={`text-sm ${promo.isActive ? 'text-green-400' : 'text-red-400'}`}>{promo.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => openModal(promo)} className="p-2 text-blue-400 hover:text-blue-300"><Edit size={20}/></button>
                            <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-500 hover:text-red-400"><Trash size={20}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && editingPromo && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg max-w-lg w-full mx-4 space-y-4">
                        <h2 className="font-cinzel text-2xl text-yellow-400">{editingPromo.id ? 'Edit Promotion' : t('addPromotion')}</h2>
                        <RoyalInput label={t('promotionMessage')} name="message" value={editingPromo.message || ''} onChange={handleFormChange} />
                        
                        <div className="flex items-center gap-2">
                           <input type="checkbox" id="isActive" name="isActive" checked={editingPromo.isActive} onChange={handleFormChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-600"/>
                           <label htmlFor="isActive" className="text-white">{t('active')}</label>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-bold">{t('cancel')}</button>
                            <RoyalButton onClick={handleSave}>{t('saveMethod')}</RoyalButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionsPage;