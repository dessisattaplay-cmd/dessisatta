import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import PointsPage from './pages/PaymentPage';
import GalleryPage from './pages/GalleryPage';
import SupportPage from './pages/SupportPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/chatbot/Chatbot';

// Admin Imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import PaymentAdminPage from './pages/PaymentAdminPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import SystemLogsPage from './pages/SystemLogsPage';
import CreateWithdrawTypePage from './pages/admin/CreateWithdrawTypePage';
import WithdrawTypesListPage from './pages/admin/WithdrawTypesListPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import SiteSettingsPage from './pages/admin/SiteSettingsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import BetManagementPage from './pages/admin/BetManagementPage';
import NotificationPopup from './components/common/NotificationPopup';
import GlobalScheduler from './components/common/GlobalScheduler';
import ProfitLossPage from './pages/admin/ProfitLossPage';


const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#010412] text-white flex flex-col relative overflow-x-hidden">
      <NotificationPopup />
      {/* Background Animations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-20">
        {/* Floating particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={`particle-${i}`}
            className="absolute rounded-full bg-yellow-400 opacity-10 animate-float"
            style={{
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
        {/* Gold Dust */}
        {Array.from({ length: 70 }).map((_, i) => (
            <div
                key={`dust-${i}`}
                className="gold-dust"
                style={{
                    bottom: '0',
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 10}s`,
                    animationDuration: `${5 + Math.random() * 5}s`,
                }}
            />
        ))}
      </div>
      
      <Routes>
        {/* Admin Routes with Layout */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboardPage />} />
                <Route path="/user-management" element={<UserManagementPage />} />
                <Route path="/payment-admin" element={<PaymentAdminPage />} />
                <Route path="/payment-settings" element={<PaymentSettingsPage />} />
                <Route path="/withdraw-types/create" element={<CreateWithdrawTypePage />} />
                <Route path="/withdraw-types" element={<WithdrawTypesListPage />} />
                 <Route path="/promotions" element={<PromotionsPage />} />
                 <Route path="/site-settings" element={<SiteSettingsPage />} />
                <Route path="/system-logs" element={<SystemLogsPage />} />
                <Route path="/bet-management" element={<BetManagementPage />} />
                <Route path="/profit-loss" element={<ProfitLossPage />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Public Routes */}
        <Route path="/*" element={
          <>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/support" element={<SupportPage />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/points" element={<ProtectedRoute><PointsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>

      {!isAdminPage && <Chatbot />}

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
      `}</style>
    </div>
  );
}


function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
        <HashRouter>
          <GlobalScheduler />
          <AppContent />
        </HashRouter>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;