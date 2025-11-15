import React, { useState, useEffect } from 'react';
import SattaIcon from '../ui/SattaIcon';
import { Facebook, Instagram, Youtube, Send, MessageCircle } from 'lucide-react';
import { useLocalization } from '../../hooks/useLocalization';
import { Link } from 'react-router-dom';
import { getSocialLinks } from '../../services/adminService';
import type { SocialLink } from '../../types';

const SocialIcon: React.FC<{platform: SocialLink['platform']}> = ({ platform }) => {
    switch(platform) {
        case 'Facebook': return <Facebook size={24} />;
        case 'Instagram': return <Instagram size={24} />;
        case 'Youtube': return <Youtube size={24} />;
        case 'Send': return <Send size={24} />; // Telegram
        case 'WhatsApp': return <MessageCircle size={24} />;
        default: return null;
    }
}

const Footer: React.FC = () => {
  const { t } = useLocalization();
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    setSocials(getSocialLinks());
  }, []);

  return (
    <footer className="bg-black/50 border-t-2 border-amber-500/50 mt-12 py-8">
      <div className="container mx-auto px-4 text-center text-gray-400">
        <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="flex justify-center md:justify-start items-center gap-2">
                <SattaIcon className="w-8 h-8 text-yellow-400" />
                <p className="font-cinzel text-2xl text-yellow-400">Dessi Satta</p>
            </div>
             <div className="flex justify-center gap-6">
                {socials.map(social => (
                  <a key={social.platform} href={social.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-colors">
                      <SocialIcon platform={social.platform} />
                  </a>
                ))}
            </div>
             <div className="flex justify-center md:justify-end gap-4 font-semibold">
                <Link to="/support" className="hover:text-yellow-400 transition-colors">{t('support')}</Link>
                <span>|</span>
                <Link to="/history" className="hover:text-yellow-400 transition-colors">{t('history')}</Link>
                <span>|</span>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('App download will be available soon!'); }} className="hover:text-yellow-400 transition-colors">{t('downloadApp')}</a>
            </div>
        </div>
        <div className="mt-8 pt-8 border-t border-amber-500/20">
             <p className="text-xs">
              {t('disclaimer')}
            </p>
            <p className="text-xs mt-2">
              © {new Date().getFullYear()} Dessi Satta Entertainment. {t('allRightsReserved')}
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;