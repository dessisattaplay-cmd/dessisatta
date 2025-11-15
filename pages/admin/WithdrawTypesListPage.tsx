import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../hooks/useLocalization';
import { getWithdrawalMethods, deleteWithdrawalMethod } from '../../services/adminService';
import type { WithdrawalMethod } from '../../types';
import RoyalButton from '../../components/ui/RoyalButton';
import { Edit, Trash, PlusCircle } from 'lucide-react';

const WithdrawTypesListPage: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    const [methods, setMethods] = useState<WithdrawalMethod[]>([]);

    const fetchMethods = () => {
        setMethods(getWithdrawalMethods());
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this withdrawal type?')) {
            deleteWithdrawalMethod(id);
            fetchMethods();
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-cinzel text-yellow-400">Withdrawal Types</h1>
                <RoyalButton onClick={() => navigate('/admin/withdraw-types/create')} className="flex items-center gap-2">
                    <PlusCircle size={18}/> Create New
                </RoyalButton>
            </div>

            <div className="space-y-4">
                {methods.length > 0 ? methods.map(method => (
                    <div key={method.id} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">{method.name}</p>
                            <p className="text-sm text-gray-400">Min: {method.minAmount} / Max: {method.maxAmount}</p>
                            <p className="text-xs text-gray-500">Fields: {method.fields.length}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(`/admin/withdraw-types/create?id=${method.id}`)} className="p-2 text-blue-400 hover:text-blue-300"><Edit size={20}/></button>
                            <button onClick={() => handleDelete(method.id)} className="p-2 text-red-500 hover:text-red-400"><Trash size={20}/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-10">No withdrawal types configured.</p>
                )}
            </div>
        </div>
    );
};

export default WithdrawTypesListPage;
