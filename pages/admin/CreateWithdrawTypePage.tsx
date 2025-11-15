import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalization } from '../../hooks/useLocalization';
import { saveWithdrawalMethod, getWithdrawalMethods } from '../../services/adminService';
import type { WithdrawalMethod, WithdrawalField } from '../../types';
import RoyalButton from '../../components/ui/RoyalButton';
import RoyalInput from '../../components/ui/RoyalInput';
import { X } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const CreateWithdrawTypePage: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    const query = useQuery();
    const methodId = query.get('id');

    const [method, setMethod] = useState<Partial<WithdrawalMethod>>({
        name: '',
        minAmount: 0,
        maxAmount: 10000,
        remark: '',
        fields: [],
    });
    
    useEffect(() => {
        if (methodId) {
            const methods = getWithdrawalMethods();
            const existingMethod = methods.find(m => m.id === methodId);
            if (existingMethod) {
                setMethod(existingMethod);
            }
        }
    }, [methodId]);

    const handleMainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMethod(prev => ({ ...prev, [name]: name.includes('Amount') ? Number(value) : value }));
    };

    const handleFieldChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const fields = [...(method.fields || [])];
        fields[index] = { ...fields[index], [name]: value };
        setMethod(prev => ({ ...prev, fields }));
    };
    
    const addField = () => {
        const newField: WithdrawalField = { id: `field-${Date.now()}`, label: '', type: 'Text' };
        setMethod(prev => ({ ...prev, fields: [...(prev.fields || []), newField] }));
    };

    const removeField = (index: number) => {
        const fields = (method.fields || []).filter((_, i) => i !== index);
        setMethod(prev => ({ ...prev, fields }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveWithdrawalMethod(method);
        navigate('/admin/withdraw-types');
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg max-w-2xl mx-auto">
            <h1 className="text-3xl font-cinzel text-yellow-400">
                {methodId ? 'Edit Withdraw Type' : 'Create Withdraw Type'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <RoyalInput label="Withdraw Name" name="name" value={method.name || ''} onChange={handleMainChange} required />
                <div className="grid grid-cols-2 gap-4">
                    <RoyalInput label="Min Amount" type="number" name="minAmount" value={method.minAmount || ''} onChange={handleMainChange} required />
                    <RoyalInput label="Max Amount" type="number" name="maxAmount" value={method.maxAmount || ''} onChange={handleMainChange} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">Remark</label>
                    <textarea 
                        name="remark" 
                        value={method.remark || ''} 
                        onChange={handleMainChange}
                        rows={3}
                        className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    />
                </div>

                <div className="pt-4">
                    <h2 className="text-xl font-cinzel text-yellow-300 mb-2">Custom Fields</h2>
                    <div className="space-y-3">
                        {(method.fields || []).map((field, index) => (
                            <div key={index} className="p-3 bg-gray-800/50 rounded-lg flex items-center gap-2">
                                <input
                                    type="text"
                                    name="label"
                                    placeholder="Field Label (e.g., UPI ID)"
                                    value={field.label}
                                    onChange={(e) => handleFieldChange(index, e)}
                                    className="flex-1 bg-black/40 border border-amber-500/50 rounded-md py-1 px-2 text-white"
                                />
                                <select 
                                    name="type" 
                                    value={field.type} 
                                    onChange={(e) => handleFieldChange(index, e)}
                                    className="bg-black/40 border border-amber-500/50 rounded-md py-1 px-2 text-white"
                                >
                                    <option value="Text">Text</option>
                                    <option value="Number">Number</option>
                                </select>
                                <button type="button" onClick={() => removeField(index)} className="p-1 text-red-500 hover:text-red-400">
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={addField} className="mt-3 text-sm font-bold text-green-400 hover:text-green-300">
                        + Add More
                    </button>
                </div>

                <div className="flex justify-end pt-6">
                    <RoyalButton type="submit">Save Withdraw Type</RoyalButton>
                </div>
            </form>
        </div>
    );
};

export default CreateWithdrawTypePage;