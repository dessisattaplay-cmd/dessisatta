import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { getSocialLinks, saveSocialLinks, getSupportInfo, saveSupportInfo } from '../../services/adminService';
import type { SocialLink, SupportInfo } from '../../types';
import RoyalButton from '../../components/ui/RoyalButton';
import RoyalInput from '../../components/ui/RoyalInput';
import { Facebook, Instagram, Youtube, Send, MessageCircle, Phone, Mail } from 'lucide-react';

const SiteSettingsPage: React.FC = () => {
    const { t } = useLocalization();
    const [socials, setSocials] = useState<SocialLink[]>([]);
    const [supportInfo, setSupportInfo] = useState<SupportInfo>({ whatsapp: '', phone: '', email: '' });

    useEffect(() => {
        setSocials(getSocialLinks());
        setSupportInfo(getSupportInfo());
    }, []);

    const handleSocialChange = (platform: SocialLink['platform'], url: string) => {
        setSocials(currentSocials => {
            const newSocials = [...currentSocials];
            const socialIndex = newSocials.findIndex(s => s.platform === platform);
            if (socialIndex > -1) {
                newSocials[socialIndex].url = url;
            }
            return newSocials;
        });
    };
    
    const handleSupportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSupportInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        saveSocialLinks(socials);
        saveSupportInfo(supportInfo);
        alert(t('saveSettings') + '!');
    };

    const getIcon = (platform: SocialLink['platform']) => {
        switch(platform) {
            case 'Facebook': return <Facebook />;
            case 'Instagram': return <Instagram />;
            case 'Youtube': return <Youtube />;
            case 'Send': return <Send />;
            case 'WhatsApp': return <MessageCircle />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-black/30 border border-gray-700/50 rounded-lg max-w-2xl mx-auto">
            <h1 className="text-3xl font-cinzel text-yellow-400">{t('manageSiteSettings')}</h1>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
                <h2 className="text-xl font-cinzel mb-4">{t('socialMediaLinks')}</h2>
                <div className="space-y-4">
                    {socials.map(social => (
                        <RoyalInput 
                            key={social.platform}
                            label={social.platform === 'Send' ? 'Telegram' : social.platform}
                            value={social.url}
                            onChange={(e) => handleSocialChange(social.platform, e.target.value)}
                            icon={getIcon(social.platform)}
                        />
                    ))}
                </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg">
                <h2 className="text-xl font-cinzel mb-4">{t('supportInfo')}</h2>
                <div className="space-y-4">
                    <RoyalInput label={t('whatsApp')} name="whatsapp" value={supportInfo.whatsapp} onChange={handleSupportChange} icon={<MessageCircle />} />
                    <RoyalInput label={t('phoneSupport')} name="phone" value={supportInfo.phone} onChange={handleSupportChange} icon={<Phone />} />
                    <RoyalInput label={t('supportEmail')} name="email" type="email" value={supportInfo.email} onChange={handleSupportChange} icon={<Mail />} />
                </div>
            </div>
            
            <RoyalButton onClick={handleSave} className="w-full">
                {t('saveSettings')}
            </RoyalButton>
        </div>
    );
};

export default SiteSettingsPage;