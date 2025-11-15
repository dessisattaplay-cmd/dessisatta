import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import RoyalButton from '../components/ui/RoyalButton';
import RoyalInput from '../components/ui/RoyalInput';
import SattaIcon from '../components/ui/SattaIcon';
import useForm from '../hooks/useForm';

const validate = (values: {username: string; password: string}, t: (key: string, options?: Record<string, string | number>) => string) => {
    const errors: Partial<typeof values> = {};
    if (!values.username) {
        errors.username = t('validationRequired');
    } else if (values.username.length < 4) {
        errors.username = t('validationMinLength', { length: 4 });
    } else if (!/^[a-zA-Z0-9]+$/.test(values.username)) {
        errors.username = t('validationAlphanumeric');
    }

    if (!values.password) {
        errors.password = t('validationRequired');
    }
    return errors;
};

const LoginPage: React.FC = () => {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLocalization();

  const {
      values,
      errors,
      touched,
      isFormValid,
      handleChange,
      handleBlur,
      handleSubmit
  } = useForm({ username: '', password: ''}, validate);

  const handleLogin = (formValues: {username: string; password: string}) => {
    setServerError('');
    const success = login(formValues.username, formValues.password);
    if (success) {
      navigate('/dashboard');
    } else {
      setServerError(t('loginError'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10">
      <div className="text-center mb-8">
        <SattaIcon className="w-16 h-16 mx-auto text-yellow-400" />
        <h1 className="font-cinzel text-3xl mt-4 text-yellow-400">{t('memberLogin')}</h1>
        <p className="text-gray-300 mt-2">{t('loginSubtitle')}</p>
      </div>
      {serverError && <p className="text-red-500 text-center mb-4">{serverError}</p>}
      <form onSubmit={handleSubmit(handleLogin)} className="space-y-2" noValidate>
        <RoyalInput
          label={t('username')}
          type="text"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          touched={touched.username}
          required
        />
        <RoyalInput
          label={t('password')}
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          touched={touched.password}
          required
        />
        <div className="pt-4">
          <RoyalButton type="submit" className="w-full text-lg" disabled={!isFormValid}>
            {t('login')}
          </RoyalButton>
        </div>
      </form>
      <p className="text-center mt-6 text-gray-400">
        {t('notAMember')}{' '}
        <Link to="/register" className="font-bold text-yellow-400 hover:underline">
          {t('registerNow')}
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;