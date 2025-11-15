import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import type { Language } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLocalization();

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'EN' },
    { code: 'hi', name: 'हिं' },
    { code: 'bn', name: 'বাং' },
  ];

  return (
    <div className="flex items-center bg-black/30 border border-amber-500/30 rounded-full p-1">
      <Globe size={16} className="text-amber-400 mx-1"/>
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-2 py-0.5 text-sm rounded-full transition-colors font-semibold ${
            language === lang.code
              ? 'bg-amber-500 text-black'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;