import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useNavigate } from 'react-router-dom';
import { BarChart2, CreditCard, Users, Settings, MessageSquare } from 'lucide-react';
import RoyalButton from '../../components/ui/RoyalButton';
import type { GalleryImage, Feedback } from '../../types';
import { getPendingImages, approveImage, deleteImage } from '../../services/galleryService';
import { getUnreadFeedback, sendBroadcastMessage } from '../../services/adminService';

const AdminDashboardPage: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    
    // State for restored features
    const [pendingImages, setPendingImages] = useState<GalleryImage[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [broadcast, setBroadcast] = useState('');

    const fetchData = () => {
        setPendingImages(getPendingImages());
        setFeedback(getUnreadFeedback());
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleImageApproval = (id: number, doApprove: boolean) => {
        if(doApprove) approveImage(id); else deleteImage(id);
        fetchData(); // Refresh data
    }
    
    const handleBroadcast = () => {
        if (broadcast.trim()) {
            sendBroadcastMessage(broadcast.trim());
            alert('Broadcast message sent!');
            setBroadcast('');
        }
    };

    const quickLinks = [
        { label: "User Management", path: "/admin/user-management", icon: <Users size={24}/> },
        { label: "Payment Requests", path: "/admin/payment-admin", icon: <CreditCard size={24}/> },
        { label: "Site Settings", path: "/admin/site-settings", icon: <Settings size={24}/> },
        { label: "System Logs", path: "/admin/system-logs", icon: <BarChart2 size={24}/> },
    ]

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-cinzel text-center text-yellow-400">{t('dashboard')}</h1>
            
            <div className="p-6 bg-gray-800/50 rounded-lg">
                <h2 className="text-2xl font-cinzel mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickLinks.map(link => (
                         <button 
                            key={link.path}
                            onClick={() => navigate(link.path)}
                            className="p-4 bg-gray-700/50 rounded-lg text-center hover:bg-gray-700 transition-colors flex flex-col items-center justify-center aspect-square"
                        >
                            <div className="mx-auto w-fit text-amber-400 mb-2">{link.icon}</div>
                            <p className="font-semibold">{link.label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Broadcast Section */}
            <div className="p-4 bg-black/30 border border-gray-700/50 rounded-lg">
                <h2 className="text-2xl font-cinzel mb-4 flex items-center gap-2"><MessageSquare/>{t('broadcastMessage')}</h2>
                 <textarea 
                    value={broadcast}
                    onChange={(e) => setBroadcast(e.target.value)}
                    placeholder={t('broadcastPlaceholder')}
                    rows={3}
                    className="w-full bg-black/40 border-2 border-amber-500/50 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <RoyalButton onClick={handleBroadcast} className="w-full mt-2">{t('sendBroadcast')}</RoyalButton>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                 {/* Feedback Section */}
                <div className="p-4 bg-black/30 border border-gray-700/50 rounded-lg">
                    <h2 className="text-2xl font-cinzel mb-4">{t('feedback')} ({feedback.length})</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {feedback.length > 0 ? feedback.map(f => (
                            <div key={f.id} className="p-2 bg-gray-800/50 rounded">
                                <p className="font-bold">{f.name} <span className="text-sm text-gray-400">({f.email})</span></p>
                                <p className="text-gray-300 text-sm italic">"{f.message}"</p>
                            </div>
                        )) : <p className="text-gray-500">{t('noFeedback')}</p>}
                    </div>
                </div>

                {/* Gallery Management Section */}
                <div className="p-4 bg-black/30 border border-gray-700/50 rounded-lg">
                    <h2 className="text-2xl font-cinzel mb-4">{t('galleryManagement')} ({pendingImages.length})</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {pendingImages.length > 0 ? pendingImages.map(image => (
                            <div key={image.id} className="flex items-center gap-4 p-2 bg-gray-800/50 rounded">
                                <img src={image.url} alt={image.caption} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-1">
                                    <p className="font-bold">{image.caption}</p>
                                    <p className="text-sm text-gray-400">By: {image.uploader}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleImageApproval(image.id, true)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">{t('approve')}</button>
                                    <button onClick={() => handleImageApproval(image.id, false)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">{t('delete')}</button>
                                </div>
                            </div>
                        )) : <p className="text-gray-500">{t('noPendingRequests')}</p>}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboardPage;
