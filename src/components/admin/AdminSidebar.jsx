import React from 'react';
import { ShieldAlert, Users, Crown, RefreshCw, LayoutDashboard, WalletCards, Eye, LogOut, Gavel, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ isMobile, activeTab, setActiveTab, users, adminModels, topUps, allChats, adminDisputes, loading, fetchUsers }) => {
    const navigate = useNavigate();

    const pendingModelsCount = adminModels.filter(m => !m.isApproved).length;

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
                <div onClick={() => navigate('/cabinet')} style={{ cursor: 'pointer', padding: '8px', background: '#222', borderRadius: '8px' }} className="menu-hover"><LogOut size={18} color="#ff4444" /></div>
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