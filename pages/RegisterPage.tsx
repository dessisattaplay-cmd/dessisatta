import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import RoyalButton from '../components/ui/RoyalButton';
import RoyalInput from '../components/ui/RoyalInput';
import SattaIcon from '../components/ui/SattaIcon';
import useForm from '../hooks/useForm';
import type { User } from '../types';

const getUsers = (): User[] => {
    const usersStr = localStorage.getItem('dessi-satta-users');
    return usersStr ? JSON.parse(usersStr) : [];
};

type FormValues = {
    fullName: string;
    username: string;
    mobileNumber: string;
    address: string;
    password: string;
    confirmPassword: string;
    referredBy: string;
};

const validate = (values: FormValues, t: (key: string, options?: Record<string, string | number>) => string, existingUsers: User[]) => {
    const errors: Partial<FormValues> = {};

    if (!values.fullName) {
        errors.fullName = t('validationRequired');
    } else if (values.fullName.length < 3) {
        errors.fullName = t('validationMinLength', { length: 3 });
    } else if (!/^[a-zA-Z\s]+$/.test(values.fullName)) {
        errors.fullName = t('validationNameChars');
    }

    if (!values.username) {
        errors.username = t('validationRequired');
    } else if (values.username.length < 4) {
        errors.username = t('validationMinLength', { length: 4 });
    } else if (!/^[a-zA-Z0-9]+$/.test(values.username)) {
        errors.username = t('validationAlphanumeric');
    } else if (existingUsers.some(u => u.username === values.username)) {
        errors.username = t('validationUsernameExists');
    }

    if (!values.mobileNumber) {
        errors.mobileNumber = t('validationRequired');
    } else if (!/^\d{10}$/.test(values.mobileNumber)) {
        errors.mobileNumber = t('validationExactLength', { length: 10 });
    } else if (existingUsers.some(u => u.mobileNumber === values.mobileNumber)) {
        errors.mobileNumber = t('validationMobileExists');
    }
    
    if (!values.password) {
        errors.password = t('validationRequired');
    } else if (values.password.length < 6) {
        errors.password = t('validationMinLength', { length: 6 });
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = t('validationRequired');
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = t('validationPasswordMatch');
    }

    if (!values.address) {
        errors.address = t('validationRequired');
    } else if (values.address.length < 10) {
        errors.address = t('validationMinLength', { length: 10 });
    }

    if (values.referredBy && !/^DESSI[A-Z0-9]{6}$/.test(values.referredBy)) {
        errors.referredBy = t('validationInvalidReferral');
    }

    return errors;
};

const AgreementModal: React.FC<{ onClose: () => void, t: (key: string) => string }> = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
                <h2 className="font-cinzel text-xl text-yellow-400 p-4 border-b border-gray-700">{t('userAgreementTitle')}</h2>
                <div className="p-4 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-300">{t('userAgreementContent')}</p>
                </div>
                <div className="p-4 border-t border-gray-700">
                    <RoyalButton onClick={onClose} className="w-full">{t('close')}</RoyalButton>
                </div>
            </div>
        </div>
    );
};


const RegisterPage: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLocalization();
  
  const existingUsers = getUsers();
  const { values, errors, touched, isFormValid, handleChange, handleBlur, handleSubmit } = useForm(
      { fullName: '', username: '', mobileNumber: '', address: '', password: '', confirmPassword: '', referredBy: '' },
      (vals, tFunc) => validate(vals, tFunc, existingUsers)
  );


  const handleRegister = (formValues: FormValues) => {
    const { confirmPassword, ...userDetails } = formValues;
    const newUser = register(userDetails);
    if(newUser) {
        setNewUserCode(newUser.referralCode);
        setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
        <div className="max-w-md mx-auto text-center p-8 bg-black/50 backdrop-blur-md border-2 border-yellow-400 rounded-xl shadow-lg shadow-yellow-400/20">
            <h1 className="font-cinzel text-3xl text-yellow-400">{t('welcomeToDessi')}</h1>
            <p className="text-gray-300 mt-4">{t('welcomeMessage')}</p>
            <div className="my-6 p-4 border-2 border-dashed border-amber-500 rounded-lg">
                <p className="text-gray-400">{t('yourReferralCode')}:</p>
                <p className="text-3xl font-bold text-white tracking-widest bg-gray-800 py-2 rounded mt-2 font-teko">{newUserCode}</p>
            </div>
            <RoyalButton onClick={() => navigate('/dashboard')} className="w-full">
                {t('goToDashboard')}
            </RoyalButton>
        </div>
    )
  }

  return (
    <>
      {showAgreement && <AgreementModal onClose={() => setShowAgreement(false)} t={t} />}
      <div className="max-w-md mx-auto mt-10 p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10">
        <div className="text-center mb-8">
          <SattaIcon className="w-16 h-16 mx-auto text-yellow-400" />
          <h1 className="font-cinzel text-3xl mt-4 text-yellow-400">{t('joinTheGame')}</h1>
          <p className="text-gray-300 mt-2">{t('registrationSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit(handleRegister)} className="space-y-1" noValidate>
          <RoyalInput label={t('fullName')} type="text" name="fullName" value={values.fullName} onChange={handleChange} onBlur={handleBlur} error={errors.fullName} touched={touched.fullName} required />
          <RoyalInput label={t('username')} type="text" name="username" value={values.username} onChange={handleChange} onBlur={handleBlur} error={errors.username} touched={touched.username} required />
          <RoyalInput label={t('mobileNumber')} type="tel" name="mobileNumber" value={values.mobileNumber} onChange={handleChange} onBlur={handleBlur} error={errors.mobileNumber} touched={touched.mobileNumber} pattern="[0-9]{10}" title="Enter a 10-digit mobile number" required />
          <RoyalInput label={t('password')} type="password" name="password" value={values.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} required />
          <RoyalInput label={t('confirmPassword')} type="password" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} touched={touched.confirmPassword} required />
          <RoyalInput label={t('address')} type="text" name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} touched={touched.address} required />
          <RoyalInput label={`${t('referralCode')} (${t('optional')})`} type="text" name="referredBy" value={values.referredBy} onChange={handleChange} onBlur={handleBlur} error={errors.referredBy} touched={touched.referredBy} />
          
          <div className="pt-3">
              <label htmlFor="agreement" className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                      id="agreement"
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={() => setAgreementAccepted(!agreementAccepted)}
                      className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-600"
                  />
                  <span>
                      {t('acceptTerms')}{' '}
                      <button type="button" onClick={() => setShowAgreement(true)} className="text-yellow-400 hover:underline">
                          (View)
                      </button>
                  </span>
              </label>
          </div>

          <div className="pt-4">
            <RoyalButton type="submit" className="w-full text-lg" disabled={!isFormValid || !agreementAccepted}>
              {t('registerNow')}
            </RoyalButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegisterPage;