import React, { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, BarChart, LogOut, ChevronDown, ChevronRight, Menu, X, Globe, Ticket } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SattaIcon from '../ui/SattaIcon';
import AdminNotificationHandler from '../admin/AdminNotificationHandler';


const NavItem: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode; end?: boolean, onClick?: () => void }> = ({ to, icon, children, end = false, onClick }) => (
    <NavLink 
        to={to} 
        end={end}
        onClick={onClick}
        className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white ${
            isActive ? 'bg-amber-600/20 text-amber-400 border-l-4 border-amber-400' : ''
        }`}
    >
        {icon}
        <span className="font-semibold">{children}</span>
    </NavLink>
);

const CollapsibleNav: React.FC<{ icon: React.ReactNode; title: string; children: ReactNode }> = ({ icon, title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white">
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-semibold">{title}</span>
                </div>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            {isOpen && <div className="pl-8 pt-2 space-y-1">{children}</div>}
        </div>
    )
};

const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    const handleLinkClick = () => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }

    const sidebarContent = (
         <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                <SattaIcon className="w-8 h-8 text-yellow-400"/>
                <h1 className="text-xl font-bold font-cinzel text-white">Admin Panel</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavItem to="/admin" icon={<LayoutDashboard size={20} />} end={true} onClick={handleLinkClick}>Dashboard</NavItem>
                <NavItem to="/admin/user-management" icon={<Users size={20} />} onClick={handleLinkClick}>User Management</NavItem>
                <CollapsibleNav icon={<CreditCard size={20} />} title="Payments">
                    <NavItem to="/admin/payment-admin" icon={<div className="w-5" />} onClick={handleLinkClick}>Payment Requests</NavItem>
                    <NavItem to="/admin/payment-settings" icon={<div className="w-5" />} onClick={handleLinkClick}>Deposit Settings</NavItem>
                    <NavItem to="/admin/withdraw-types" icon={<div className="w-5" />} onClick={handleLinkClick}>Withdrawal Types</NavItem>
                </CollapsibleNav>
                <CollapsibleNav icon={<Ticket size={20} />} title="Betting">
                    <NavItem to="/admin/bet-management" icon={<div className="w-5" />} onClick={handleLinkClick}>Bet Management</NavItem>
                </CollapsibleNav>
                 <CollapsibleNav icon={<Settings size={20} />} title="Content">
                    <NavItem to="/admin/promotions" icon={<div className="w-5" />} onClick={handleLinkClick}>Promotions</NavItem>
                    <NavItem to="/admin/site-settings" icon={<div className="w-5" />} onClick={handleLinkClick}>Site Settings</NavItem>
                </CollapsibleNav>
                 <CollapsibleNav icon={<BarChart size={20} />} title="Reports">
                   <NavItem to="/admin/system-logs" icon={<div className="w-5" />} onClick={handleLinkClick}>System Logs</NavItem>
                   <NavItem to="/admin/profit-loss" icon={<div className="w-5" />} onClick={handleLinkClick}>Profit & Loss</NavItem>
                </CollapsibleNav>
            </nav>
            <div className="p-4 border-t border-gray-700 space-y-2">
                 <NavItem to="/" icon={<Globe size={20} />} onClick={handleLinkClick}>View Site</NavItem>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-red-900/50">
                    <LogOut size={20} />
                    <span className="font-semibold">Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen">
            <AdminNotificationHandler />
            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            <aside className={`fixed lg:relative top-0 left-0 h-full w-64 bg-[#111827] text-white z-50 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                {sidebarContent}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#010412]">
                <header className="lg:hidden p-4 bg-[#111827] flex justify-between items-center text-white">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
                    </button>
                     <h1 className="text-lg font-bold font-cinzel">Admin Menu</h1>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;