import React from 'react';
import { LayoutDashboard, RefreshCw, TrendingUp, Users, Crown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AdminDashboard = ({ isMobile, users, adminModels, topUps, adminDisputes, onlineUsers, loading, fetchUsers, setActiveTab, setModelTab }) => {
    
    const pendingModels = adminModels.filter(m => !m.isApproved);
    const approvedModels = adminModels.filter(m => m.isApproved);
    const totalBalances = users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const currentOnlineCount = Object.values(onlineUsers || {}).filter(u => u.status === 'online').length;
    const pendingTasksCount = pendingModels.length + topUps.length + adminDisputes.length;

    return (
        <div className="fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutDashboard size={28} color="#b14bff"/> Пульс Платформи
                </h2>
                {isMobile && <button onClick={fetchUsers} style={{ background: 'none', border: '1px solid #b14bff', color: '#b14bff', padding: '8px 12px', borderRadius: '8px' }}><RefreshCw size={16} className={loading ? 'spin' : ''}/></button>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a2a44, #050508)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(0, 165, 232, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ color: '#00A5E8', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', gap: '8px' }}>В Мережі (Онлайн)</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{currentOnlineCount} <span style={{ fontSize: '16px', color: '#00A5E8' }}>осіб</span></div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #0a2212, #050508)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(76,175,80,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ color: '#4caf50', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', gap: '8px' }}><TrendingUp size={16}/> Грошей на балансах</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{totalBalances.toLocaleString('uk-UA')} <span style={{ fontSize: '16px', color: '#4caf50' }}>UAH</span></div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #003333, #050508)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(0,255,255,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ color: '#00ffff', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', gap: '8px' }}><Users size={16}/> Всі користувачі</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{users.length} <span style={{ fontSize: '16px', color: '#00ffff' }}>осіб</span></div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #2a1a00, #050508)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,152,0,0.3)' }}>
                    <div style={{ color: '#ff9800', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', gap: '8px' }}><Crown size={16}/> Опубліковані анкети</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{approvedModels.length} <span style={{ fontSize: '16px', color: '#ff9800' }}>шт</span></div>
                </div>

                <div style={{ background: pendingTasksCount > 0 ? 'linear-gradient(135deg, #330000, #050508)' : '#0a0a0f', padding: '25px', borderRadius: '16px', border: `1px solid ${pendingTasksCount > 0 ? '#ff4444' : '#333'}` }}>
                    <div style={{ color: pendingTasksCount > 0 ? '#ff4444' : '#666', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', gap: '8px' }}><AlertTriangle size={16}/> Потребують уваги</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: pendingTasksCount > 0 ? 'white' : '#555' }}>{pendingTasksCount} <span style={{ fontSize: '16px', color: pendingTasksCount > 0 ? '#ff4444' : '#555' }}>задач</span></div>
                </div>
            </div>

            <div style={{ background: '#0a0a0f', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '18px' }}>Оперативні задачі</h3>
                {pendingTasksCount === 0 ? (
                    <div style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#0a2212', borderRadius: '8px' }}>
                        <CheckCircle2 size={20}/> <b>Усі задачі виконано!</b> Ви можете відпочивати.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {topUps.length > 0 && (
                            <div onClick={() => setActiveTab('finances')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #4caf50', cursor: 'pointer' }}>
                                <div style={{ color: 'white' }}>Нові чеки на поповнення: <b style={{ color: '#4caf50' }}>{topUps.length} шт.</b></div>
                                <div style={{ color: '#888', fontSize: '12px' }}>Перейти ➔</div>
                            </div>
                        )}
                        {pendingModels.length > 0 && (
                            <div onClick={() => {setActiveTab('profiles'); setModelTab('pending');}} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ff9800', cursor: 'pointer' }}>
                                <div style={{ color: 'white' }}>Анкети очікують перевірки: <b style={{ color: '#ff9800' }}>{pendingModels.length} шт.</b></div>
                                <div style={{ color: '#888', fontSize: '12px' }}>Перейти ➔</div>
                            </div>
                        )}
                        {adminDisputes.length > 0 && (
                            <div onClick={() => setActiveTab('arbiter')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ff4444', cursor: 'pointer' }}>
                                <div style={{ color: 'white' }}>Відкриті спори: <b style={{ color: '#ff4444' }}>{adminDisputes.length} шт.</b></div>
                                <div style={{ color: '#888', fontSize: '12px' }}>Перейти ➔</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;