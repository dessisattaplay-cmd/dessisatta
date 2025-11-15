import React, { useState, useEffect, useMemo } from 'react';
import type { User, Transaction, MembershipTier, Bet } from '../../types';
import { getAllUsers, adjustUserPoints, updateUserDetails, toggleUserBettingLock, toggleUserProfileLock, resetUserPassword, deleteUser, adminCreateUser, updateUserRoleAndCommission, getActiveReferralsCount, getAllBets } from '../../services/adminService';
import { exportUsersCSV, calculateUserPnl } from '../../services/reportingService';
import { getAllTransactions } from '../../services/paymentService';
import RoyalButton from '../../components/ui/RoyalButton';
import { useLocalization } from '../../hooks/useLocalization';
import RoyalInput from '../../components/ui/RoyalInput';
import { Gem, Download, Users, Edit, Shield, ShieldOff, Trash2, UserPlus } from 'lucide-react';
import useForm from '../../hooks/useForm';
import jsPDF from 'jspdf';
import { translations } from '../../i18n';
import MembershipBadge from '../../components/common/MembershipBadge';


const CreateUserModal: React.FC<{ onClose: () => void, onUpdate: () => void }> = ({ onClose, onUpdate }) => {
    const { t } = useLocalization();
    const existingUsers = getAllUsers();

    const {
        values,
        errors,
        touched,
        isFormValid,
        handleChange,
        handleBlur,
        handleSubmit,
    } = useForm({
        fullName: '',
        username: '',
        mobileNumber: '',
        address: '',
        password: '',
        points: '0',
    }, (vals, tFunc) => {
        const errs: Partial<typeof vals> = {};
        if (!vals.fullName) errs.fullName = tFunc('validationRequired');
        if (!vals.username) errs.username = tFunc('validationRequired');
        else if (vals.username.length < 4) errs.username = tFunc('validationMinLength', { length: 4 });
        else if (existingUsers.some(u => u.username === vals.username)) errs.username = tFunc('validationUsernameExists');

        if (!vals.mobileNumber || !/^\d{10}$/.test(vals.mobileNumber)) errs.mobileNumber = tFunc('validationExactLength', { length: 10 });
        else if (existingUsers.some(u => u.mobileNumber === vals.mobileNumber)) errs.mobileNumber = tFunc('validationMobileExists');

        if (!vals.password || vals.password.length < 6) errs.password = tFunc('validationMinLength', { length: 6 });
        if (!vals.address) errs.address = tFunc('validationRequired');
        if (isNaN(Number(vals.points)) || Number(vals.points) < 0) errs.points = tFunc('validationPositiveNumber');

        return errs;
    });

    const handleCreateUser = (formValues: typeof values) => {
        const { points, ...details } = formValues;
        const result = adminCreateUser({ ...details, points: Number(points) });
        if (result.success) {
            alert(t('userCreatedSuccess'));
            onUpdate();
            onClose();
        } else {
            alert(t('userCreateFailed', { error: result.message }));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg text-left max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-cinzel text-xl text-yellow-400 mb-4">{t('createUser')}</h3>
                <form onSubmit={handleSubmit(handleCreateUser)} noValidate className="space-y-1">
                    <RoyalInput label={t('fullName')} name="fullName" value={values.fullName} onChange={handleChange} onBlur={handleBlur} error={errors.fullName} touched={touched.fullName} />
                    <RoyalInput label={t('username')} name="username" value={values.username} onChange={handleChange} onBlur={handleBlur} error={errors.username} touched={touched.username} />
                    <RoyalInput label={t('password')} name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} />
                    <RoyalInput label={t('mobileNumber')} name="mobileNumber" value={values.mobileNumber} onChange={handleChange} onBlur={handleBlur} error={errors.mobileNumber} touched={touched.mobileNumber} />
                    <RoyalInput label={t('address')} name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} touched={touched.address} />
                    <RoyalInput label={t('initialPoints')} name="points" type="number" value={values.points} onChange={handleChange} onBlur={handleBlur} error={errors.points} touched={touched.points} />

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors font-bold">{t('cancel')}</button>
                        <RoyalButton type="submit" disabled={!isFormValid}>{t('createUser')}</RoyalButton>
                    </div>
                </form>
            </div>
        </div>
    );
};


const UserManagementModal: React.FC<{ user: User, onClose: () => void, onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const { t } = useLocalization();
    const [newPassword, setNewPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<User['role']>(user.role);
    const [commission, setCommission] = useState(user.commissionRate || 0);
    const [commissionError, setCommissionError] = useState('');

    const {
        values,
        errors,
        touched,
        isFormValid,
        handleChange,
        handleBlur,
        handleSubmit,
    } = useForm({
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        address: user.address,
    }, (vals, tFunc) => {
        const errs: Partial<typeof vals> = {};
        if (!vals.fullName) errs.fullName = tFunc('validationRequired');
        if (!vals.mobileNumber || !/^\d{10}$/.test(vals.mobileNumber)) errs.mobileNumber = tFunc('validationExactLength', { length: 10 });
        if (!vals.address) errs.address = tFunc('validationRequired');
        return errs;
    });

    const handleUpdateDetails = (formValues: typeof values) => {
        const updatedUser = { ...user, ...formValues };
        if (updateUserDetails(updatedUser)) {
            alert(t('detailsUpdated'));
            onUpdate();
        } else {
            alert('Failed to update details.');
        }
    };
    
    const handleRoleUpdate = () => {
        setCommissionError('');
        if (selectedRole === 'agent') {
            const rate = Number(commission);
            if (isNaN(rate) || rate < 0 || rate > 100) {
                setCommissionError(t('validationCommission'));
                return;
            }
        }
        const result = updateUserRoleAndCommission(user.id, selectedRole, Number(commission));
        if (result.success) {
            alert(t(result.message));
            onUpdate();
        } else {
            alert(t(result.message));
        }
    }

    const handleToggleBetLock = () => { toggleUserBettingLock(user.id); onUpdate(); }
    const handleToggleProfileLock = () => { toggleUserProfileLock(user.id); onUpdate(); }
    
    const handleResetPassword = () => {
        if (resetUserPassword(user.id, newPassword)) {
            alert(t('passwordResetSuccess'));
            setNewPassword('');
        }
    }
    
    const handleDeleteUser = () => {
        if (window.confirm(t('confirmDeleteAccount'))) {
            if(deleteUser(user.id)){
                alert(t('userDeletedSuccess'));
                onUpdate();
                onClose();
            }
        }
    }
    
    const handleDownloadAgreement = () => {
        const doc = new jsPDF();
        const lang = 'en'; // Generate in English for consistency
        const agreementText = translations[lang]['userAgreementContent'];

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('User Agreement - Dessi Satta', 14, 22);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`User: ${user.fullName} (@${user.username})`, 14, 32);
        doc.text(`User ID: ${user.id}`, 14, 38);
        doc.text(`Agreement Accepted On: ${new Date(user.agreementAcceptedAt).toLocaleString()}`, 14, 44);

        doc.setLineWidth(0.5);
        doc.line(14, 50, 196, 50);

        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(agreementText, 180);
        doc.text(splitText, 14, 60);

        doc.save(`DessiSatta_Agreement_${user.username}.pdf`);
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg text-left max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-cinzel text-xl text-yellow-400 mb-4">{t('userDetails')}</h3>
                <div className="space-y-2 mb-4 text-sm">
                   <p><strong>ID:</strong> {user.id}</p>
                   <p><strong>{t('username')}:</strong> {user.username}</p>
                   <p><strong>{t('referralCode')}:</strong> {user.referralCode}</p>
                   <div className="flex items-center gap-2"><strong>{t('membershipStatus')}:</strong> <MembershipBadge tier={user.membership.currentTier} /></div>
                </div>
                
                <div className="mb-4">
                    <RoyalButton onClick={handleDownloadAgreement} className="w-full text-sm flex items-center justify-center gap-2">
                        <Download size={16} /> {t('downloadAgreement')}
                    </RoyalButton>
                </div>

                <form onSubmit={handleSubmit(handleUpdateDetails)} noValidate className="space-y-2">
                    <RoyalInput label={t('fullName')} name="fullName" value={values.fullName} onChange={handleChange} onBlur={handleBlur} error={errors.fullName} touched={touched.fullName} />
                    <RoyalInput label={t('mobileNumber')} name="mobileNumber" value={values.mobileNumber} onChange={handleChange} onBlur={handleBlur} error={errors.mobileNumber} touched={touched.mobileNumber} />
                    <RoyalInput label={t('address')} name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} touched={touched.address} />
                    <div className="flex justify-end gap-4 pt-2">
                        <RoyalButton type="submit" disabled={!isFormValid}>{t('updateDetails')}</RoyalButton>
                    </div>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="font-cinzel text-lg text-amber-400 mb-3">{t('roleManagement')}</h4>
                    <div className="p-2 bg-gray-800/50 rounded-md space-y-3">
                        <div className="flex items-center gap-4">
                             <label htmlFor="role" className="font-semibold text-white">{t('role')}:</label>
                             <select id="role" value={selectedRole} onChange={e => setSelectedRole(e.target.value as User['role'])} className="bg-black/40 border-2 border-amber-500/50 rounded-lg py-1 px-2 text-white" disabled={user.username === 'admin'}>
                                <option value="user">User</option>
                                <option value="agent">Agent</option>
                                <option value="admin">Admin</option>
                             </select>
                        </div>
                        {selectedRole === 'agent' && (
                             <RoyalInput label={t('commissionRate')} type="number" value={commission.toString()} onChange={e => setCommission(Number(e.target.value))} error={commissionError} touched={!!commissionError} />
                        )}
                        <RoyalButton onClick={handleRoleUpdate} className="w-full text-sm py-2" disabled={user.username === 'admin'}>{t('updateRole')}</RoyalButton>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="font-cinzel text-lg text-amber-400 mb-3">{t('adminActions')}</h4>
                    <div className="space-y-3">
                        {/* Lock Betting */}
                        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-md">
                            <span className={`font-semibold ${user.isBetLocked ? 'text-red-400' : 'text-green-400'}`}>
                                {user.isBetLocked ? t('bettingLocked') : t('bettingUnlocked')}
                            </span>
                            <RoyalButton onClick={handleToggleBetLock} className="text-sm px-3 py-1">
                                {user.isBetLocked ? t('unlockBetting') : t('lockBetting')}
                            </RoyalButton>
                        </div>
                        {/* Lock Profile */}
                        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-md">
                             <span className={`font-semibold ${user.isProfileLocked ? 'text-red-400' : 'text-green-400'}`}>
                                {user.isProfileLocked ? t('profileLocked') : t('profileUnlocked')}
                            </span>
                            <RoyalButton onClick={handleToggleProfileLock} className="text-sm px-3 py-1">
                                 {user.isProfileLocked ? t('unlockProfile') : t('lockProfile')}
                            </RoyalButton>
                        </div>
                         {/* Reset Password */}
                        <div className="p-2 bg-gray-800/50 rounded-md">
                            <label className="font-semibold block mb-2">{t('resetPassword')}</label>
                            <div className="flex gap-2">
                                <RoyalInput label="" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('newPassword')} />
                                <RoyalButton onClick={handleResetPassword} disabled={newPassword.length < 6}>
                                    Reset
                                </RoyalButton>
                            </div>
                        </div>
                        {/* Delete Account */}
                        <div className="pt-2">
                             <RoyalButton onClick={handleDeleteUser} className="w-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 shadow-red-500/50 flex items-center justify-center gap-2" disabled={user.username === 'admin'}>
                                <Trash2 size={16}/> {t('deleteAccount')}
                            </RoyalButton>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors font-bold">{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};


const UserPointsModal: React.FC<{ user: User, onClose: () => void, onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const { t } = useLocalization();

    const handleSubmit = () => {
        setError('');
        const numAmount = parseInt(amount, 10);
        if (isNaN(numAmount)) {
            setError(t('validationInteger'));
            return;
        }
        if (!reason) {
            setError(t('validationRequired'));
            return;
        }
        adjustUserPoints(user.id, numAmount, reason);
        onUpdate();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg text-left max-w-sm w-full mx-4">
                <h3 className="font-cinzel text-xl text-yellow-400 mb-4">{t('adjustPoints')} - {user.username}</h3>
                <div className="space-y-4">
                    <RoyalInput 
                        label={t('adjustmentAmount')}
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100, -50, etc."
                    />
                     <RoyalInput 
                        label={t('adjustmentReason')}
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('adjustmentReason')}
                    />
                </div>
                <p className="text-xs text-gray-400 mt-2">{t('positiveForCredit')}</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors font-bold">{t('cancel')}</button>
                    <RoyalButton onClick={handleSubmit}>{t('submitAdjustment')}</RoyalButton>
                </div>
            </div>
        </div>
    );
};

// Mobile Card Component
const UserCard: React.FC<{
    user: User;
    referralCount: number;
    pnl: number;
    onEdit: (user: User) => void;
    onAdjustPoints: (user: User) => void;
    t: (key: string) => string;
}> = ({ user, referralCount, pnl, onEdit, onAdjustPoints, t }) => (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
        <div className="flex justify-between items-start">
            <div>
                 <p className="font-bold text-lg flex items-center gap-2">
                    {user.username}
                    {user.membership.currentTier !== 'none' && <MembershipBadge tier={user.membership.currentTier} size="sm" />}
                </p>
                <p className="text-sm text-gray-400">{user.fullName}</p>
                <p className="text-xs capitalize text-blue-300">({t(user.role)})</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-green-400 flex items-center justify-end gap-1"><Gem size={14}/> {user.points}</p>
                 <p className={`text-sm font-semibold ${pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>P/L: {pnl.toLocaleString()}</p>
                <div className="flex gap-1.5 mt-1">
                    {user.isProfileLocked && <span title={t('profileLocked')}><ShieldOff size={16} className="text-red-400" /></span>}
                    {user.isBetLocked && <span title={t('bettingLocked')}><Shield size={16} className="text-yellow-400" /></span>}
                </div>
            </div>
        </div>
        <div className="text-sm text-gray-300 space-y-1 border-t border-gray-700 pt-2">
            <p><strong>{t('activeReferrals')}:</strong> {referralCount}</p>
            <p><strong>{t('dateJoined')}:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onAdjustPoints(user)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-1 flex justify-center" title={t('adjustPoints')}>
                <Gem size={18}/>
            </button>
            <button onClick={() => onEdit(user)} className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex-1 flex justify-center" title={t('editUser')}>
                <Edit size={18}/>
            </button>
        </div>
    </div>
);


const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bets, setBets] = useState<Bet[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [adjustingPointsUser, setAdjustingPointsUser] = useState<User | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { t } = useLocalization();

    const fetchData = () => {
        setUsers(getAllUsers());
        setTransactions(getAllTransactions());
        setBets(getAllBets());
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    // When editing user is updated, find the new version from the list to pass to modal
    useEffect(() => {
        if(editingUser) {
            const updatedUser = users.find(u => u.id === editingUser.id);
            if(updatedUser) {
                setEditingUser(updatedUser);
            } else {
                // User was likely deleted, close modal
                setEditingUser(null);
            }
        }
    }, [users]);

    const referralCounts = useMemo(() => {
        if (!users.length || !transactions.length) return new Map<string, number>();
        const counts = new Map<string, number>();
        for (const user of users) {
            counts.set(user.id, getActiveReferralsCount(user.id, users, transactions));
        }
        return counts;
    }, [users, transactions]);

    const pnlDataMap = useMemo(() => {
        const map = new Map<string, number>();
        users.forEach(user => {
            const pnl = calculateUserPnl(user.id, bets);
            map.set(user.id, pnl.netPnl);
        });
        return map;
    }, [users, bets]);

    const filteredUsers = useMemo(() => {
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        return users.filter(user => {
            const userDate = user.createdAt;
            const dateMatch = userDate ? (userDate >= start && userDate <= end) : (!startDate && !endDate);

            const searchMatch = searchTerm
                ? user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
                : true;

            return dateMatch && searchMatch;
        }).sort((a,b) => b.createdAt - a.createdAt);
    }, [users, startDate, endDate, searchTerm]);

    const PnlDisplay: React.FC<{ value: number }> = ({ value }) => (
        <span className={value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'}>
            {value.toLocaleString()}
        </span>
    );

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg">
            {adjustingPointsUser && <UserPointsModal user={adjustingPointsUser} onClose={() => setAdjustingPointsUser(null)} onUpdate={fetchData} />}
            {editingUser && <UserManagementModal user={editingUser} onClose={() => setEditingUser(null)} onUpdate={fetchData} />}
            {isCreateModalOpen && <CreateUserModal onClose={() => setIsCreateModalOpen(false)} onUpdate={fetchData} />}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-cinzel text-yellow-400 flex items-center gap-2">
                    <Users/> {t('userManagement')} ({users.length})
                </h1>
                <div className="flex items-center gap-2">
                    <RoyalButton onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-sm px-3 py-2">
                        <UserPlus size={16}/> {t('createUser')}
                    </RoyalButton>
                    <RoyalButton onClick={exportUsersCSV} className="flex items-center gap-2 text-sm px-3 py-2">
                        <Download size={16}/> {t('downloadUserData')}
                    </RoyalButton>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <RoyalInput label="" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('searchUsers')} />
                <RoyalInput label={t('startDate')} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <RoyalInput label={t('endDate')} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div>
                {/* Desktop Table View */}
                <div className="overflow-x-auto max-h-[70vh] hidden md:block">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="sticky top-0 bg-gray-800">
                            <tr>
                                <th className="p-2">{t('username')}</th>
                                <th className="p-2">{t('role')}</th>
                                <th className="p-2 hidden sm:table-cell">{t('fullName')}</th>
                                <th className="p-2">{t('points')}</th>
                                <th className="p-2">{t('userNetPl')}</th>
                                <th className="p-2">{t('activeReferrals')}</th>
                                <th className="p-2">{t('status')}</th>
                                <th className="p-2 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => {
                                const pnl = pnlDataMap.get(user.id) || 0;
                                return (
                                <tr key={user.id} className="border-b border-gray-700/50">
                                    <td className="p-2">
                                        <button onClick={() => setEditingUser(user)} className="font-bold hover:underline hover:text-yellow-400 flex items-center gap-2">
                                            {user.username}
                                             {user.membership.currentTier !== 'none' && <MembershipBadge tier={user.membership.currentTier} size="sm" />}
                                        </button>
                                    </td>
                                    <td className="p-2 capitalize text-sm">{t(user.role)}</td>
                                    <td className="p-2 hidden sm:table-cell">{user.fullName}</td>
                                    <td className="p-2 font-bold flex items-center gap-1"><Gem size={14} className="text-green-400"/> {user.points.toLocaleString()}</td>
                                    <td className="p-2 font-semibold"><PnlDisplay value={pnl} /></td>
                                    <td className="p-2 font-bold text-center">{referralCounts.get(user.id) || 0}</td>
                                    <td className="p-2 flex gap-1">
                                        {user.isProfileLocked && <span title={t('profileLocked')}><ShieldOff size={16} className="text-red-400" /></span>}
                                        {user.isBetLocked && <span title={t('bettingLocked')}><Shield size={16} className="text-yellow-400" /></span>}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => setAdjustingPointsUser(user)} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full" title={t('adjustPoints')}>
                                            <Edit size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden max-h-[70vh] overflow-y-auto">
                    {filteredUsers.map(user => (
                        <UserCard 
                            key={user.id}
                            user={user}
                            referralCount={referralCounts.get(user.id) || 0}
                            pnl={pnlDataMap.get(user.id) || 0}
                            onEdit={setEditingUser}
                            onAdjustPoints={setAdjustingPointsUser}
                            t={t}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;