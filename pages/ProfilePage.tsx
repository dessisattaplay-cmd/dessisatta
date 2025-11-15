import React from 'react';
import { useAuth } from '../hooks/useAuth';
import RoyalInput from '../components/ui/RoyalInput';
import RoyalButton from '../components/ui/RoyalButton';
import { useLocalization } from '../hooks/useLocalization';
import { User as UserIcon } from 'lucide-react';
import useForm from '../hooks/useForm';
import MembershipBadge from '../components/common/MembershipBadge';
import { getMonthIdentifier } from '../services/membershipService';

type FormValues = {
    fullName: string;
    mobileNumber: string;
    address: string;
};

const validate = (values: FormValues, t: (key: string, options?: Record<string, string | number>) => string) => {
    const errors: Partial<FormValues> = {};

    if (!values.fullName) {
        errors.fullName = t('validationRequired');
    } else if (values.fullName.length < 3) {
        errors.fullName = t('validationMinLength', { length: 3 });
    } else if (!/^[a-zA-Z\s]+$/.test(values.fullName)) {
        errors.fullName = t('validationNameChars');
    }

    if (!values.mobileNumber) {
        errors.mobileNumber = t('validationRequired');
    } else if (!/^\d{10}$/.test(values.mobileNumber)) {
        errors.mobileNumber = t('validationExactLength', { length: 10 });
    }

    if (!values.address) {
        errors.address = t('validationRequired');
    } else if (values.address.length < 10) {
        errors.address = t('validationMinLength', { length: 10 });
    }
    
    return errors;
}


const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLocalization();

    const {
        values,
        errors,
        touched,
        isFormValid,
        handleChange,
        handleBlur,
        handleSubmit,
    } = useForm({
        fullName: user?.fullName || '',
        mobileNumber: user?.mobileNumber || '',
        address: user?.address || '',
    }, validate);


    if (!user) {
        return <div>{t('loading')}...</div>
    }

    const handleUpdate = (formValues: FormValues) => {
        console.log("Updated Profile:", formValues);
        alert("Profile updated successfully! (Simulation)");
    };

    const lastMonthIdentifier = getMonthIdentifier(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const lastMonthTier = user.membership.history.find(h => h.month === lastMonthIdentifier)?.tier || 'none';

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="mt-10 p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10">
                <div className="text-center mb-8">
                    <UserIcon className="w-16 h-16 mx-auto text-yellow-400" />
                    <h1 className="font-cinzel text-3xl mt-4 text-yellow-400">{t('myProfile')}</h1>
                    <p className="text-gray-400 mt-2">@{user.username}</p>
                </div>

                <form onSubmit={handleSubmit(handleUpdate)} className="space-y-1" noValidate>
                    <RoyalInput 
                        label={t('fullName')}
                        type="text"
                        name="fullName"
                        value={values.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fullName}
                        touched={touched.fullName}
                        required
                    />
                    <RoyalInput 
                        label={t('mobileNumber')}
                        type="tel"
                        name="mobileNumber"
                        value={values.mobileNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.mobileNumber}
                        touched={touched.mobileNumber}
                        required
                    />
                    <RoyalInput 
                        label={t('address')}
                        type="text"
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.address}
                        touched={touched.address}
                        required
                    />
                    <div className="pt-4">
                        <RoyalButton type="submit" className="w-full" disabled={!isFormValid}>
                            Update Profile
                        </RoyalButton>
                    </div>
                </form>
            </div>
            
            <div className="p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10">
                <h2 className="font-cinzel text-2xl text-center text-yellow-400 mb-6">{t('membershipStatus')}</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="font-semibold">{t('currentTier')}:</span>
                        <MembershipBadge tier={user.membership.currentTier} />
                    </div>
                     <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="font-semibold">{t('lastMonthTier')}:</span>
                        <MembershipBadge tier={lastMonthTier} />
                    </div>
                    <div>
                        <h3 className="font-cinzel text-lg text-amber-300 mb-2">{t('badgeHistory')}</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                           {user.membership.history.length > 0 ? (
                                user.membership.history.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                                        <span className="text-sm font-semibold text-gray-300">{item.month}</span>
                                        <MembershipBadge tier={item.tier} size="sm" />
                                    </div>
                                ))
                           ) : (
                            <p className="text-sm text-center text-gray-500 py-2">No history yet.</p>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;