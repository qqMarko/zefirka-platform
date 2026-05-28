import React, { useRef, useEffect, useState } from 'react';
import { Search, LogIn, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

const AdminUsers = ({ users, isMobile, searchQuery, setSearchQuery, fetchUsers, authFetch }) => {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onWheel = (e) => { e.preventDefault(); el.scrollTop += e.deltaY; };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const handleCustomBalance = async (userId, type) => {
        const amountStr = prompt(`Введіть суму для ${type === 'add' ? 'ПОПОВНЕННЯ' : 'ШТРАФУ'} (тільки цифри):`, "500");
        if (!amountStr) return; 
        const num = Number(amountStr);
        if (isNaN(num) || num === 0) return toast.error('❌ Введіть коректне число!');
        
        const amount = type === 'add' ? Math.abs(num) : -Math.abs(num);
        try {
            const res = await authFetch(`/api/admin/users/${userId}/balance`, {
                method: 'POST', body: JSON.stringify({ amount })
            });
            if (res.ok) { toast.success(amount > 0 ? `💳 Баланс поповнено!` : `💸 Штраф виписано!`); fetchUsers(); }
        } catch (error) { toast.error('Помилка сервера'); }
    };

    const handleToggleBan = async (userId) => {
        if (!window.confirm("Змінити статус доступу для цього користувача?")) return;
        try {
            const res = await authFetch(`/api/admin/users/${userId}/toggle-ban`, { method: 'POST' });
            if (res.ok) { toast.success('🔄 Статус оновлено!'); fetchUsers(); } 
        } catch (error) { toast.error('Мережева помилка'); }
    };

    const handleShadowLogin = async (userId, email) => {
        if (!window.confirm(`👻 Увійти в акаунт ${email}?\n\nВи зможете повернутися в Адмінку кліком на верхню панель.`)) return;
        try {
            const res = await authFetch(`/api/admin/users/${userId}/shadow-login`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('adminToken', localStorage.getItem('token'));
                localStorage.setItem('token', data.token);
                useStore.getState().login(data.token, data.role, data.userId, data.email);
                toast.success(`Ви успішно телепортувались: ${email}`, { duration: 4000, icon: '👻' });
                navigate('/cabinet'); 
            } else toast.error('Помилка телепортації');
        } catch (err) { toast.error('Помилка сервера'); }
    };

    const handleGrantVip = async (userId) => {
        const pkg = prompt("Введіть VIP-пакет:\n\nМоделі: start / premium / diamond\nКлієнти: premium_client / priority_chat / concierge", "premium");
        if (!pkg) return;
        try {
            const res = await authFetch(`/api/admin/grant-vip/${userId}`, { method: 'POST', body: JSON.stringify({ packageId: pkg.trim().toLowerCase() }) });
            const data = await res.json();
            if (data.success) { toast.success(`👑 Видано VIP: ${pkg.toUpperCase()}`); fetchUsers(); }
            else toast.error(`❌ ${data.message}`);
        } catch (err) { toast.error('Помилка сервера'); }
    };

    const handleSetVerification = async (userId, verification) => {
        try {
            const res = await authFetch(`/api/admin/users/${userId}/set-verification-all`, { method: 'POST', body: JSON.stringify({ verification }) });
            const data = await res.json();
            if (data.success) {
                const lbl = { photo: '🥈 Фото', video: '🥇 Відео', none: '❌ Знято' };
                toast.success(`Верифікація: ${lbl[verification]}`); fetchUsers();
            } else toast.error(`❌ ${data.message || 'Помилка'}`);
        } catch (err) { toast.error('Помилка сервера'); }
    };

    const handleSetTrust = async (userId, current) => {
        const val = prompt("Відсоток довіри (0-100):", current ?? 100);
        if (val === null) return;
        const score = Number(val);
        if (isNaN(score) || score < 0 || score > 100) return toast.error('❌ Введіть число 0-100');
        try {
            const res = await authFetch(`/api/admin/users/${userId}/trust`, { method: 'POST', body: JSON.stringify({ trustScore: score }) });
            const data = await res.json();
            if (data.success) { toast.success(`📊 Довіра: ${score}%`); fetchUsers(); }
            else toast.error(`❌ ${data.message}`);
        } catch (err) { toast.error('Помилка сервера'); }
    };

    const handleRemoveVip = async (userId) => {
        if (!window.confirm("🗑 Точно хочеш забрати VIP статус у цього юзера?")) return;
        const loadingToast = toast.loading('Забираємо VIP...');
        try {
            let BASE_URL = import.meta.env.VITE_API_URL || '';
            if (BASE_URL.endsWith('/api')) BASE_URL = BASE_URL.slice(0, -4);
            const res = await authFetch(`/api/admin/remove-vip/${userId}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) { toast.success('✅ VIP статус знято!', { id: loadingToast }); fetchUsers(); } 
            else toast.error(`❌ ${data.message}`, { id: loadingToast });
        } catch (err) { toast.error('Мережева помилка', { id: loadingToast }); }
    };

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u._id.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>Управління користувачами</h2>
                <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
                    <Search size={18} color="#888" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" placeholder="Знайти ID або Email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 15px 12px 45px', background: '#111', border: '1px solid rgba(0,255,255,0.3)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                </div>
            </div>

            <div ref={scrollRef} className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: '6px' }}>
                {filteredUsers.map(u => (
                    <div key={u._id} style={{ background: '#0a0a0f', padding: '20px', borderRadius: '16px', border: u.isBanned ? '1px solid #ff444488' : '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div style={{ overflow: 'hidden', paddingRight: '10px' }}>
                                <div style={{ fontWeight: 'bold', color: u.isBanned ? '#ff4444' : 'white', fontSize: '16px', textDecoration: u.isBanned ? 'line-through' : 'none', wordBreak: 'break-all' }}>
                                    {u.email} {u.isBanned && "(BAN)"}
                                    {u.vipPackage && u.vipPackage !== 'none' && <span style={{ marginLeft: '10px', background: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>VIP: {u.vipPackage.toUpperCase()}</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px', cursor: 'pointer', fontFamily: 'monospace' }} onClick={() => { navigator.clipboard.writeText(u._id); toast.success('ID скопійовано'); }}>{u._id}</div>
                            </div>
                            <div style={{ textAlign: 'right', color: '#4caf50', fontWeight: '900', fontSize: '22px', whiteSpace: 'nowrap', background: '#0a2212', padding: '5px 12px', borderRadius: '8px' }}>{u.balance} ₴</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                            <button onClick={() => handleCustomBalance(u._id, 'add')} style={{ padding: '9px', background: '#28a745', border: 'none', color: 'white', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>+ Дати</button>
                            <button onClick={() => handleCustomBalance(u._id, 'sub')} style={{ padding: '9px', background: '#dc3545', border: 'none', color: 'white', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>- Забрати</button>
                            <button onClick={() => handleToggleBan(u._id)} style={{ padding: '9px', background: 'transparent', border: `1px solid ${u.isBanned ? '#28a745' : '#dc3545'}`, color: u.isBanned ? '#28a745' : '#dc3545', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{u.isBanned ? "Розбан" : "БАН"}</button>
                            <button onClick={() => handleShadowLogin(u._id, u.email)} style={{ padding: '9px', background: 'transparent', border: '1px solid #b14bff', color: '#b14bff', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '13px' }}><LogIn size={14}/> Увійти</button>

                            {/* Розкривне меню керування */}
                            <button onClick={() => setExpandedId(expandedId === u._id ? null : u._id)} style={{ gridColumn: 'span 2', padding: '9px', background: expandedId === u._id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: '0.18s' }}>
                                ⚙ Керування (VIP, галочка, довіра)
                                <ChevronDown size={15} style={{ transform: expandedId === u._id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                            </button>

                            {expandedId === u._id && (
                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '7px', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', animation: 'fadeIn 0.2s ease' }}>
                                    <button onClick={() => handleGrantVip(u._id)} style={{ padding: '9px', background: 'rgba(255,193,7,0.12)', border: '1px solid #ffc107', color: '#ffc107', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>👑 Видати / Змінити VIP{u.vipPackage && u.vipPackage !== 'none' ? ` (${u.vipPackage})` : ''}</button>
                                    {u.vipPackage && u.vipPackage !== 'none' && (
                                        <button onClick={() => handleRemoveVip(u._id)} style={{ padding: '7px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🗑 Зняти VIP</button>
                                    )}
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: '#777', fontWeight: '700', flexShrink: 0 }}>Галочка:</span>
                                        <button onClick={() => handleSetVerification(u._id, 'photo')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid #C0C0C0', color: '#C0C0C0', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🥈 Фото</button>
                                        <button onClick={() => handleSetVerification(u._id, 'video')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid #FFD700', color: '#FFD700', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🥇 Відео</button>
                                        <button onClick={() => handleSetVerification(u._id, 'none')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                    </div>
                                    <button onClick={() => handleSetTrust(u._id, u.trustScore)} style={{ padding: '9px', background: 'rgba(0,255,255,0.08)', border: '1px solid #00bcd4', color: '#00bcd4', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>📊 Довіра: {u.trustScore ?? 100}% — змінити</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminUsers;