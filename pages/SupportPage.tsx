import React, { useState, useEffect } from 'react';
import RoyalInput from '../components/ui/RoyalInput';
import RoyalButton from '../components/ui/RoyalButton';
import { Phone, MessageSquare, Mail } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import useForm from '../hooks/useForm';
import { saveFeedback, getSupportInfo } from '../services/adminService';
import type { SupportInfo } from '../types';

type FormValues = {
    name: string;
    email: string;
    message: string;
}

const validate = (values: FormValues, t: (key: string, options?: Record<string, string | number>) => string) => {
    const errors: Partial<FormValues> = {};
    if (!values.name) {
        errors.name = t('validationRequired');
    } else if (values.name.length < 3) {
        errors.name = t('validationMinLength', { length: 3 });
    }

    if (!values.email) {
        errors.email = t('validationRequired');
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = t('validationValidEmail');
    }

    if (!values.message) {
        errors.message = t('validationRequired');
    } else if (values.message.length < 10) {
        errors.message = t('validationMinLength', { length: 10 });
    }
    return errors;
};

const SupportContactCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    contactLink: string;
    borderColor: string;
    textColor: string;
    buttonText: string;
}> = ({ icon, title, contactLink, borderColor, textColor, buttonText }) => (
    <a 
        href={contactLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`block p-6 bg-black/30 border ${borderColor} rounded-lg text-center hover:bg-gray-800/50 transition-colors transform hover:-translate-y-1`}
    >
        <div className={`w-12 h-12 mx-auto ${textColor} mb-2`}>{icon}</div>
        <h3 className={`font-cinzel text-xl ${textColor}`}>{title}</h3>
        <p className="mt-4 inline-block bg-gray-700 px-4 py-2 rounded-full font-bold text-white hover:bg-gray-600 transition-colors">{buttonText}</p>
    </a>
);

const SupportPage: React.FC = () => {
    const { t } = useLocalization();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [supportInfo, setSupportInfo] = useState<SupportInfo | null>(null);

    useEffect(() => {
        setSupportInfo(getSupportInfo());
    }, []);

    const {
        values,
        errors,
        touched,
        isFormValid,
        handleChange,
        handleBlur,
        handleSubmit,
        setValues,
    } = useForm({ name: '', email: '', message: ''}, validate);
    
    const handleFeedbackSubmit = (formValues: FormValues) => {
        saveFeedback(formValues);
        setIsSubmitted(true);
        setValues({ name: '', email: '', message: '' });
    };

    const messageHasError = touched.message && errors.message;

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl font-cinzel text-yellow-400">{t('support')}</h1>
                <p className="text-gray-400 mt-2">We are here to help you on your royal journey.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
                {supportInfo && (
                    <>
                        <SupportContactCard 
                            icon={<MessageSquare className="w-12 h-12"/>}
                            title={t('whatsApp')}
                            contactLink={`https://wa.me/${supportInfo.whatsapp.replace(/\D/g, '')}`}
                            borderColor="border-green-500/30"
                            textColor="text-green-300"
                            buttonText="Chat Now"
                        />
                        <SupportContactCard 
                            icon={<Phone className="w-12 h-12"/>}
                            title={t('phoneSupport')}
                            contactLink={`tel:${supportInfo.phone.replace(/\D/g, '')}`}
                            borderColor="border-blue-500/30"
                            textColor="text-blue-300"
                            buttonText="Call Us"
                        />
                        <SupportContactCard 
                            icon={<Mail className="w-12 h-12"/>}
                            title={t('supportEmail')}
                            contactLink={`mailto:${supportInfo.email}`}
                            borderColor="border-amber-500/30"
                            textColor="text-amber-300"
                            buttonText="Email Us"
                        />
                    </>
                )}
            </div>

            <div className="max-w-lg mx-auto p-8 bg-black/50 backdrop-blur-md border-2 border-amber-500/50 rounded-xl">
                 <h2 className="text-2xl font-cinzel text-center text-yellow-400 mb-6">Send us a Message</h2>
                {isSubmitted ? (
                    <div className="text-center text-green-400 p-4 border border-green-500/50 rounded-lg">
                        <p className="font-bold">Thank you for your feedback!</p>
                        <p>Our team will get back to you shortly.</p>
                    </div>
                ) : (
                 <form onSubmit={handleSubmit(handleFeedbackSubmit)} className="space-y-1" noValidate>
                    <RoyalInput label="Your Name" type="text" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} touched={touched.name} required />
                    <RoyalInput label="Your Email" type="email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required />
                    <div className="h-40">
                        <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">Message</label>
                        <textarea
                            name="message"
                            value={values.message}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            rows={4}
                            className={`w-full bg-black/40 border-2 ${messageHasError ? 'border-red-500' : 'border-amber-500/50'} rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${messageHasError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-yellow-400 focus:border-yellow-400'} focus:shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-300`}
                        ></textarea>
                         {messageHasError && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>
                    <div className="pt-4">
                        <RoyalButton type="submit" className="w-full" disabled={!isFormValid}>Send Feedback</RoyalButton>
                    </div>
                 </form>
                )}
            </div>
        </div>
    );
};

export default SupportPage;