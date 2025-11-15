import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLocalization } from '../../hooks/useLocalization';
import SattaIcon from '../ui/SattaIcon';
import RoyalButton from '../ui/RoyalButton';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { Gem, Menu, X, Download } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMobileLinkClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const activeLinkStyle = {
    color: '#F59E0B', // amber-500
    textShadow: '0 0 8px #F59E0B',
  };

  const MobileNavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <NavLink 
      to={to} 
      onClick={() => handleMobileLinkClick(to)}
      className={({ isActive }) => `hover:text-amber-500 transition-colors ${isActive ? 'text-amber-500' : 'text-white'}`}
    >
      {children}
    </NavLink>
  );

  return (
    <>
      <header className="bg-black/30 backdrop-blur-sm border-b-2 border-amber-500/50 shadow-lg shadow-amber-500/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <NavLink to="/" className="flex items-center gap-2 text-2xl font-cinzel font-bold text-yellow-400 hover:text-white transition-colors duration-300">
            <SattaIcon className="w-8 h-8" />
            Dessi Satta
          </NavLink>
          <nav className="hidden md:flex items-center gap-6 font-teko text-2xl tracking-wider">
            <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="hover:text-amber-500 transition-colors">{t('home')}</NavLink>
            <NavLink to="/history" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="hover:text-amber-500 transition-colors">{t('history')}</NavLink>
            <NavLink to="/gallery" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="hover:text-amber-500 transition-colors">{t('gallery')}</NavLink>
            {isAuthenticated && <NavLink to="/dashboard" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="hover:text-amber-500 transition-colors">{t('dashboard')}</NavLink>}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
                <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right flex items-center gap-2">
                  <p className="text-xl font-bold text-green-400 flex items-center gap-1 font-teko">
                    <Gem size={18} /> {user?.points.toLocaleString()}
                  </p>
                </div>
                <button onClick={handleLogout} className="text-sm font-bold bg-red-800 hover:bg-red-700 transition-colors px-3 py-2 rounded-md">{t('logout')}</button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <RoyalButton onClick={() => navigate('/register')} className="px-3 py-2 text-sm">{t('register')}</RoyalButton>
                <button onClick={() => navigate('/login')} className="font-bold text-amber-400 hover:text-white transition-colors">{t('login')}</button>
              </div>
            )}
             <RoyalButton onClick={() => alert('App download will be available soon!')} className="px-3 py-2 text-sm hidden lg:flex items-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-600 shadow-[0_0_15px_rgba(74,222,128,0.6)] hover:shadow-[0_0_30px_rgba(74,222,128,0.8)]">
                <Download size={16} className="mr-1" />
                {t('downloadApp')}
              </RoyalButton>
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-white">
              <Menu size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-[#010412] z-60 flex flex-col items-center justify-center md:hidden animate-fade-in">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-5 text-white">
            <X size={32} />
          </button>
          <nav className="flex flex-col items-center gap-8 font-teko text-4xl tracking-wider">
            <MobileNavLink to="/">{t('home')}</MobileNavLink>
            <MobileNavLink to="/history">{t('history')}</MobileNavLink>
            <MobileNavLink to="/gallery">{t('gallery')}</MobileNavLink>
            {isAuthenticated && <MobileNavLink to="/dashboard">{t('dashboard')}</MobileNavLink>}
          </nav>

          <div className="mt-8">
            <LanguageSwitcher />
          </div>
          
          <div className="absolute bottom-16 flex flex-col items-center gap-6 w-full px-8">
            <RoyalButton onClick={() => { alert('App download will be available soon!'); setIsMenuOpen(false); }} className="w-full flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-600 shadow-[0_0_15px_rgba(74,222,128,0.6)] hover:shadow-[0_0_30px_rgba(74,222,128,0.8)]">
                <Download size={18} className="mr-2" />
                {t('downloadApp')}
            </RoyalButton>

            {isAuthenticated ? (
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2 font-teko mb-4">
                        <Gem size={22} /> {user?.points.toLocaleString()}
                    </p>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-lg font-bold bg-red-800 hover:bg-red-700 transition-colors px-6 py-3 rounded-md w-full">{t('logout')}</button>
                </div>
            ) : (
                <div className="flex gap-4 w-full">
                    <RoyalButton onClick={() => handleMobileLinkClick('/register')} className="flex-1">{t('register')}</RoyalButton>
                    <button onClick={() => handleMobileLinkClick('/login')} className="font-bold text-amber-400 hover:text-white transition-colors flex-1 text-lg border-2 border-amber-400 rounded-lg">{t('login')}</button>
                </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;
