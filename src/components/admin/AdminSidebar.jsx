import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Crown, RefreshCw, LayoutDashboard, WalletCards, Eye, LogOut, Gavel, Megaphone, Bell, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminSidebar = ({ isMobile, activeTab, setActiveTab, users, adminModels, topUps, allChats, adminDisputes, loading, fetchUsers }) => {
    const navigate = useNavigate();
    
    // Стейт для реальних сповіщень
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const pendingModelsCount = adminModels.filter(m => !m.isApproved).length;

    // Завантаження реальних сповіщень з бази
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications'); 
                const data = await res.json();
                
                if (data.success || Array.isArray(data)) {
                    setNotifications(data.data || data || []);
                }
            } catch (err) {
                console.error('Помилка завантаження сповіщень', err);
            }
        };

        fetchNotifications();

        // Підключення сокетів для миттєвих сповіщень
        import('../../store/useStore').then(({ socket }) => {
            if (socket) {
                socket.on('new_notification', (newNotif) => {
                    setNotifications(prev => [newNotif, ...prev]);
                });
            }
        });

    }, []);

    // Очищення сповіщень у базі
    const clearNotifications = async () => {
        try {
            await fetch('/api/notifications/clear', { method: 'DELETE' });
            setNotifications([]);
            toast.success('Сповіщення очищено');
        } catch(err) {
            toast.error('Помилка очищення');
        }
    };

    const NavItem = ({ id, icon, label, count, color }) => (
        <div 
            onClick={() => setActiveTab(id)}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', cursor: 'pointer', borderRadius: '12px',
                background: activeTab === id ? `${color}22` : 'transparent',
                border: `1px solid ${activeTab === id ? color : 'transparent'}`,
                color: activeTab === id ? color : '#888',
                transition: '0.3s', flexShrink: 0
            }}
            className="menu-hover"
        >
            {icon}
            <span style={{ fontWeight: 'bold', fontSize: '15px', flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
            {count > 0 && <span style={{ background: color, color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>{count}</span>}
        </div>
    );

    return (
        <div style={{ width: isMobile ? '100%' : '280px', background: '#0a0a0f', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 10 }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00ffff', fontWeight: '900', fontSize: '20px' }}><ShieldAlert size={28} /> ADMIN</div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* ДЗВІНОЧОК СПОВІЩЕНЬ */}
                    <div style={{ position: 'relative' }}>
                        <div onClick={() => setShowNotifications(!showNotifications)} style={{ cursor: 'pointer', padding: '8px', background: '#222', borderRadius: '8px', position: 'relative' }} className="menu-hover">
                            <Bell size={18} color="#00ffff" />
                            {notifications.length > 0 && (
                                <span style={{ position: 'absolute', top: -5, right: -5, background: '#ff4444', color: '#fff', fontSize: '10px', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                                    {notifications.length}
                                </span>
                            )}
                        </div>

                        {/* ВИПАДАЮЧЕ ВІКНО СПОВІЩЕНЬ */}
                        {showNotifications && (
                            <div style={{ position: 'absolute', top: '45px', left: isMobile ? '-100px' : '0', width: '280px', background: '#111', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 100 }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>Сповіщення</span>
                                    <Trash2 size={16} color="#ff4444" style={{ cursor: 'pointer' }} onClick={clearNotifications} title="Очистити все" />
                                </div>
                                <div className="custom-scrollbar" style={{ maxHeight: '250px', overflowY: 'auto', padding: '10px' }}>
                                    {notifications.length > 0 ? notifications.map((n, i) => (
                                        <div key={n._id || i} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ccc', fontSize: '13px', background: '#1a1a24', borderRadius: '8px', marginBottom: '8px' }}>
                                            {/* Виводимо текст сповіщення (залежить від того, як поле називається в базі: text, message чи content) */}
                                            {n.text || n.message || n.content || "Нове сповіщення"}
                                        </div>
                                    )) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>Немає нових сповіщень</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div onClick={() => navigate('/cabinet')} style={{ cursor: 'pointer', padding: '8px', background: '#222', borderRadius: '8px' }} className="menu-hover">
                        <LogOut size={18} color="#ff4444" />
                    </div>
                </div>
            </div>

            <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', padding: '20px', gap: '10px', overflowX: isMobile ? 'auto' : 'hidden', overflowY: isMobile ? 'hidden' : 'auto' }}>
                <NavItem id="dashboard" icon={<LayoutDashboard size={20}/>} label="Дашборд" count={0} color="#b14bff" />
                <NavItem id="users" icon={<Users size={20}/>} label="Користувачі" count={users.length} color="#00ffff" />
                <NavItem id="profiles" icon={<Crown size={20}/>} label="Анкети" count={pendingModelsCount} color="#ff9800" />
                <NavItem id="finances" icon={<WalletCards size={20}/>} label="Фінанси" count={topUps.length} color="#4caf50" />
                <NavItem id="arbiter" icon={<Gavel size={20}/>} label="Арбітр спори" count={adminDisputes.length} color="#ff4444" />
                <NavItem id="chats" icon={<Eye size={20}/>} label="Panopticon" count={allChats.length} color="#ff4444" />
                <NavItem id="broadcast" icon={<Megaphone size={20}/>} label="Рупор" count={0} color="#e91e63" />
            </div>
            
            {!isMobile && (
                <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={fetchUsers} disabled={loading} style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> {loading ? 'Оновлюю...' : 'Синхронізувати'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminSidebar;