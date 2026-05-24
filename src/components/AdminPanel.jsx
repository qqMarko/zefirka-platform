import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, LogOut, X, Gavel, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import ModelProfileModal from './ModelProfileModal';
import DisputesTab from './DisputesTab';

import AdminSidebar from './admin/AdminSidebar';
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminProfiles from './admin/AdminProfiles';
import AdminFinances from './admin/AdminFinances';
import AdminArbiter from './admin/AdminArbiter';
import AdminPanopticon from './admin/AdminPanopticon';
import AdminBroadcast from './admin/AdminBroadcast';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { userRole, loadCatalog, onlineUsers, userUniqueId } = useStore();
    
    const [users, setUsers] = useState([]);
    const [adminModels, setAdminModels] = useState([]); 
    const [topUps, setTopUps] = useState([]); 
    const [allChats, setAllChats] = useState([]); 
    const [adminDisputes, setAdminDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [modelTab, setModelTab] = useState('pending'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModel, setSelectedModel] = useState(null); 
    const [fullImage, setFullImage] = useState(null); 
    const [viewChat, setViewChat] = useState(null);
    const [viewDispute, setViewDispute] = useState(null);

    const isMobile = window.innerWidth < 768;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [resUsers, resModels, resTopUps, resChats] = await Promise.all([
                fetch(`/api/admin/users?t=${Date.now()}`).then(res => res.json()),
                fetch(`/api/profiles?fetchAll=true&t=${Date.now()}`).then(res => res.json()),
                fetch(`/api/admin/topups?t=${Date.now()}`).then(res => res.json()),
                fetch(`/api/admin/chats?t=${Date.now()}`).then(res => res.json())
            ]);

            if (resUsers.success) setUsers(resUsers.data);
            if (resModels.success) setAdminModels(resModels.data.map(m => ({...m, id: m._id})));
            if (resTopUps.success) setTopUps(resTopUps.data);
            if (resChats.success) setAllChats(resChats.data);
        } catch (error) { toast.error('Помилка завантаження даних'); } 
        finally { setLoading(false); }
    };

    // ФУНКЦІЯ: Прибирає спір з адмінки після закриття
    const handleCloseDisputeLocally = (disputeId) => {
        setAdminDisputes(prev => prev.filter(d => d._id !== disputeId));
        setViewDispute(null);
    };

    useEffect(() => { if (userRole === 'admin') fetchUsers(); }, [userRole]);

    useEffect(() => {
        if (activeTab === 'arbiter') {
            fetch('/api/admin/disputes')
                .then(res => res.json())
                .then(data => { if (data.success) setAdminDisputes(data.data); })
                .catch(err => console.error(err));
        }
    }, [activeTab]);

    if (userRole !== 'admin') return <div style={{ color: '#ff4444', padding: '100px', textAlign: 'center', background: '#000', minHeight: '100vh', fontSize: '24px', fontWeight: 'bold' }}>🛑 ДОСТУП ЗАБОРОНЕНО.</div>;

    const sharedProps = { 
        users, fetchUsers, loadCatalog, onlineUsers, isMobile, activeTab, setActiveTab 
    };

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: '#050508', overflow: 'hidden' }}>
            
            <AdminSidebar {...sharedProps} 
                adminModels={adminModels} topUps={topUps} allChats={allChats} 
                adminDisputes={adminDisputes} loading={loading} 
            />

            <div className="custom-scrollbar" style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto', background: 'radial-gradient(circle at top right, #111 0%, #050508 100%)' }}>
                {activeTab === 'dashboard' && <AdminDashboard {...sharedProps} adminModels={adminModels} topUps={topUps} adminDisputes={adminDisputes} setModelTab={setModelTab} loading={loading} />}
                {activeTab === 'users' && <AdminUsers {...sharedProps} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
                {activeTab === 'profiles' && <AdminProfiles {...sharedProps} adminModels={adminModels} modelTab={modelTab} setModelTab={setModelTab} setSelectedModel={setSelectedModel} />}
                {activeTab === 'finances' && <AdminFinances {...sharedProps} topUps={topUps} setFullImage={setFullImage} />}
                {activeTab === 'arbiter' && <AdminArbiter {...sharedProps} adminDisputes={adminDisputes} setViewDispute={setViewDispute} setAdminDisputes={setAdminDisputes} />}
                {activeTab === 'chats' && <AdminPanopticon {...sharedProps} allChats={allChats} setViewChat={setViewChat} />}
                {activeTab === 'broadcast' && <AdminBroadcast />}
            </div>

            {selectedModel && (
                <div style={{ position: 'fixed', zIndex: 100000 }}>
                    <ModelProfileModal model={selectedModel} onClose={() => setSelectedModel(null)} openPrivateChat={() => toast('Чат недоступний в адмінці', { icon: '🛑' })} favorites={[]} handleToggleFavorite={() => {}} />
                </div>
            )}

            {fullImage && (
                <div onClick={() => setFullImage(null)} style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '20px' }}>
                    <img src={fullImage} alt="Чек" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '16px', border: '1px solid #4caf50' }} />
                </div>
            )}

            {viewDispute && (
    <div 
        onWheel={(e) => e.stopPropagation()} 
        style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '10px' : '20px' }}>
                    <div className="fade-in-up" style={{ background: '#050508', border: '1px solid #ff4444', borderRadius: '24px', width: '100%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(255,68,68,0.2)', overflow: 'hidden' }}>
                        <div style={{ padding: '15px 25px', background: 'rgba(255,68,68,0.1)', borderBottom: '1px solid rgba(255,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Gavel color="#ff4444" size={24} /> <span style={{ color: '#ff4444', fontWeight: '900', fontSize: '18px', textTransform: 'uppercase' }}>Режим Арбітра</span>
                            </div>
                            <button onClick={() => setViewDispute(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        {/* РОЗУМНИЙ СКРОЛ ДОДАНО СЮДИ */}
                        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                            <DisputesTab 
                                userUniqueId={userUniqueId} 
                                userRole="admin" 
                                hasDisputeAccess={true} 
                                forcedDispute={viewDispute} 
                                onDisputeClosed={handleCloseDisputeLocally} /* ПЕРЕДАЄМО ФУНКЦІЮ */
                            />
                        </div>
                    </div>
                </div>
            )}

            {viewChat && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '10px' : '20px' }}>
                    onWheel={(e) => e.stopPropagation()}
                    <div className="fade-in-up" style={{ background: '#050508', border: '1px solid #ff4444', borderRadius: '16px', width: '100%', maxWidth: '700px', height: isMobile ? '95vh' : '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px', background: '#111', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, color: '#ff4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}><Eye /> Прослушка</h2>
                            <X onClick={() => setViewChat(null)} style={{ cursor: 'pointer', color: '#888' }} size={24} />
                        </div>
                        {/* РОЗУМНИЙ СКРОЛ ДОДАНО СЮДИ */}
                        <div className="custom-scrollbar" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {viewChat.messages.map((m, i) => {
                                const isFirst = m.senderId === viewChat.participants[0];
                                return (
                                    <div key={i} style={{ alignSelf: isFirst ? 'flex-end' : 'flex-start', background: '#111', padding: '15px', borderRadius: '12px', borderLeft: isFirst ? 'none' : `3px solid #ff9800`, borderRight: isFirst ? `3px solid #00ffff` : 'none', maxWidth: '85%', color: '#ddd' }}>
                                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>{m.senderId.slice(-6)} | {m.time}</div>
                                        <div>{m.text}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;