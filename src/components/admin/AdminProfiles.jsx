import React from 'react';
import { Crown, CheckCircle2, Check, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProfiles = ({ adminModels, modelTab, setModelTab, setSelectedModel, fetchUsers, loadCatalog, authFetch }) => {
    
    const handleVerifyProfile = async (profileId, vLevel) => {
        try {
            const res = await authFetch(`/api/admin/profiles/${profileId}/verify`, { method: 'POST', body: JSON.stringify({ vLevel }) });
            if (res.ok) { toast.success('✅ Статус змінено!'); fetchUsers(); if (loadCatalog) loadCatalog(); }
        } catch (error) { toast.error('Помилка сервера'); }
    };

    // ✅ ВЕРИФІКАЦІЯ: фото (срібна) / відео (золота) / зняти
    const handleSetVerification = async (profileId, verification) => {
        try {
            const res = await authFetch(`/api/admin/profiles/${profileId}/set-verification`, { method: 'POST', body: JSON.stringify({ verification }) });
            if (res.ok) {
                const labels = { photo: '🥈 Фото-верифікацію видано', video: '🥇 Відео-верифікацію видано', none: '❌ Верифікацію знято' };
                toast.success(labels[verification]); fetchUsers(); if (loadCatalog) loadCatalog();
            } else toast.error('Помилка сервера');
        } catch (error) { toast.error('Помилка сервера'); }
    };

    const handleApproveProfile = async (profileId) => {
        const loadingToast = toast.loading('Зберігаю в базу...');
        try {
            const res = await authFetch(`/api/admin/profiles/${profileId}/approve`, { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.success && data.profile.isApproved) { toast.success('✅ Анкету опубліковано!', { id: loadingToast }); fetchUsers(); if (loadCatalog) loadCatalog(); } 
            else { toast.error('❌ Помилка: База не зберегла статус.', { id: loadingToast }); }
        } catch (error) { toast.error('Мережева помилка', { id: loadingToast }); }
    };

    const handleDeleteProfile = async (profileId) => {
        if (!window.confirm("Точно видалити цю анкету назавжди?")) return;
        try {
            // 🟢 Дістаємо токен поточного користувача (адміна)
            const res = await authFetch(`/api/profiles/${profileId}`, { method: 'DELETE' });
            
            if (res.ok) { 
                toast.success('🗑 Анкету видалено!'); 
                fetchUsers(); 
                if (loadCatalog) loadCatalog(); 
            } else {
                // Якщо раптом сервер повернув помилку
                toast.error('❌ Не вдалося видалити анкету');
            }
        } catch (error) { 
            toast.error('Помилка сервера'); 
        }
    };

    const pendingModels = adminModels.filter(m => !m.isApproved);
    const approvedModels = adminModels.filter(m => m.isApproved);
    const displayedModels = modelTab === 'pending' ? pendingModels : approvedModels;

    return (
        <div className="fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>Модерація анкет</h2>
                <div style={{ display: 'flex', background: '#111', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={() => setModelTab('pending')} style={{ padding: '10px 20px', background: modelTab === 'pending' ? '#ff9800' : 'transparent', color: modelTab === 'pending' ? '#000' : '#888', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Очікують ({pendingModels.length})</button>
                    <button onClick={() => setModelTab('approved')} style={{ padding: '10px 20px', background: modelTab === 'approved' ? '#00ffff' : 'transparent', color: modelTab === 'approved' ? '#000' : '#888', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Опубліковані ({approvedModels.length})</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {displayedModels.length === 0 ? <div style={{ color: '#666' }}>Пусто</div> : 
                    displayedModels.map(m => {
                        // 🟢 БЕЗПЕЧНЕ ОТРИМАННЯ ID АНКЕТИ ТА ID ЮЗЕРА
                        const profileId = m._id || m.id;
                        const ownerId = String(m.userId?._id || m.userId || 'Невідомо');

                        return (
                            <div key={profileId || Math.random()} style={{ background: '#0a0a0f', padding: '20px', borderRadius: '16px', border: `1px solid ${!m.isApproved ? '#ff9800' : (m.vLevel === 2 ? '#ffc107' : (m.vLevel === 1 ? '#4caf50' : 'rgba(255,255,255,0.05)'))}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                                    {m.photos && m.photos.length > 0 ? ( <img src={m.photos[0]} alt="avatar" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} /> ) : ( <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#222' }}></div> )}
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 'bold', color: 'white', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || 'Без імені'}, {m.age}</div>
                                        {/* 🟢 ТЕПЕР ID ЮЗЕРА ВИВОДИТЬСЯ БЕЗПЕЧНО, КРАШУ НЕ БУДЕ */}
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>User ID: {ownerId}</div>
                                    </div>
                                    {m.isApproved && <div>{m.vLevel === 2 ? <Crown color="#ffc107" size={28}/> : (m.vLevel === 1 ? <CheckCircle2 color="#4caf50" size={28}/> : <Check color="#666" size={28}/>)}</div>}
                                </div>
                                
                                {!m.isApproved ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleApproveProfile(profileId)} style={{ flex: 2, padding: '12px', background: '#4caf50', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} className="menu-hover"><Check size={18}/> Опублікувати</button>
                                        <button onClick={() => setSelectedModel(m)} style={{ flex: 1, padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="menu-hover"><Eye size={18}/></button>
                                        <button onClick={() => handleDeleteProfile(profileId)} style={{ flex: 1, padding: '12px', background: 'rgba(220, 53, 69, 0.1)', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="menu-hover"><Trash2 size={18}/></button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <button onClick={() => setSelectedModel(m)} style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} className="menu-hover"><Eye size={16}/> Переглянути</button>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleVerifyProfile(profileId, 1)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #4caf50', color: '#4caf50', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} className="menu-hover">Базова (1)</button>
                                            <button onClick={() => handleVerifyProfile(profileId, 2)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #ffc107', color: '#ffc107', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} className="menu-hover">VIP (2)</button>
                                            <button onClick={() => handleVerifyProfile(profileId, 0)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }} className="menu-hover">Зняти</button>
                                        </div>

                                        {/* ✅ ВЕРИФІКАЦІЯ ГАЛОЧКОЮ (окремо від VIP) */}
                                        <div style={{ marginTop: '4px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: '#777', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Верифікація
                                                {m.verification === 'photo' && <span style={{ color: '#C0C0C0' }}>🥈 Фото</span>}
                                                {m.verification === 'video' && <span style={{ color: '#FFD700' }}>🥇 Відео</span>}
                                                {(!m.verification || m.verification === 'none') && <span style={{ color: '#555' }}>— немає</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleSetVerification(profileId, 'photo')} style={{ flex: 1, padding: '9px', background: m.verification === 'photo' ? 'rgba(192,192,192,0.2)' : 'transparent', border: '1px solid #C0C0C0', color: '#C0C0C0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} className="menu-hover">🥈 Фото</button>
                                                <button onClick={() => handleSetVerification(profileId, 'video')} style={{ flex: 1, padding: '9px', background: m.verification === 'video' ? 'rgba(255,215,0,0.2)' : 'transparent', border: '1px solid #FFD700', color: '#FFD700', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} className="menu-hover">🥇 Відео</button>
                                                <button onClick={() => handleSetVerification(profileId, 'none')} style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }} className="menu-hover">Зняти</button>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteProfile(profileId)} style={{ width: '100%', padding: '10px', background: 'rgba(220, 53, 69, 0.05)', border: '1px dashed #dc3545', color: '#dc3545', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }} className="menu-hover"><Trash2 size={14}/> Видалити анкету назавжди</button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default AdminProfiles;