import React, { useState, useEffect } from 'react';
import { Megaphone, Power, Send, Rocket, Crown, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { accent } from '../../styles/theme';

const availablePackages = [
    { id: 'start', name: 'START', type: 'Модель', color: '#ff007f' },
    { id: 'premium', name: 'PREMIUM', type: 'Модель', color: '#ffc107' },
    { id: 'diamond', name: 'DIAMOND', type: 'Модель', color: '#00ffff' },
    { id: 'premium_client', name: 'GUEST', type: 'Клієнт', color: '#4caf50' },
    { id: 'priority_chat', name: 'PRIORITY', type: 'Клієнт', color: '#ffc107' },
    { id: 'concierge', name: 'CONCIERGE', type: 'Клієнт', color: '#ff007f' }
];

const AdminBroadcast = () => {
    const [message, setMessage] = useState('');
    const [vipDiscountPercent, setVipDiscountPercent] = useState(0);
    const [activeVipPackages, setActiveVipPackages] = useState([]);
    const [bumpDiscountPercent, setBumpDiscountPercent] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);

    let BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (BACKEND_URL.endsWith('/api')) BACKEND_URL = BACKEND_URL.slice(0, -4);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('zefirka_token')}`
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/admin/megaphone/status`, { headers: getAuthHeaders() });
            if (res.data.success && res.data.settings) {
                setMessage(res.data.settings.message || '');
                setVipDiscountPercent(res.data.settings.vipDiscountPercent || 0);
                setActiveVipPackages(res.data.settings.activeVipPackages || []);
                setBumpDiscountPercent(res.data.settings.bumpDiscountPercent || 0);
                setIsActive(res.data.settings.isActive || false);
            }
        } catch (err) {
            console.error("Помилка завантаження статусу рупора:", err);
            toast.error('Не вдалося завантажити поточний стан рупора');
        }
    };

    const togglePackage = (pkgId) => {
        setActiveVipPackages(prev => 
            prev.includes(pkgId) ? prev.filter(id => id !== pkgId) : [...prev, pkgId]
        );
    };

    const handleBroadcast = async () => {
        setLoading(true);
        const loadingToast = toast.loading('Оновлення рупора...');
        
        try {
            const response = await axios.post(`${BACKEND_URL}/api/admin/megaphone/broadcast`, {
                message, vipDiscountPercent, activeVipPackages, bumpDiscountPercent, isActive
            }, { headers: getAuthHeaders() });

            if (response.data.success) {
                toast.success('Рупор та акції успішно оновлено!', { 
                    id: loadingToast, style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } 
                });
            } else {
                toast.error(response.data.message || 'Помилка оновлення', { id: loadingToast });
            }
        } catch (error) {
            console.error("Помилка при збереженні:", error);
            toast.error('Помилка сервера при оновленні рупора', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Окремий хендлер для перемикача — зберігає ТІЛЬКИ isActive без повторної розсилки
    const handleToggleActive = async () => {
        const newValue = !isActive;
        setIsActive(newValue);
        try {
            await axios.post(`${BACKEND_URL}/api/admin/megaphone/toggle`, 
                { isActive: newValue }, 
                { headers: getAuthHeaders() }
            );
            toast.success(newValue ? '✅ Акцію увімкнено' : '🔕 Акцію вимкнено', {
                style: { background: '#111', color: '#fff', border: `1px solid ${accent}` }
            });
        } catch (error) {
            setIsActive(!newValue); // відкат
            toast.error('Помилка збереження стану акції');
        }
    };

    return (
        // 🔥 ФІКСАЦІЯ КОНТЕЙНЕРА НА 100% ВИСОТИ МІНУС ВІДСТУПИ 🔥
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '850px', margin: '0 auto', color: 'white' }}>
            
            {/* ШАПКА ВІКНА (ФІКСОВАНА, НЕ СКРОЛИТЬСЯ) */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}44)`, padding: '16px', borderRadius: '16px', border: `1px solid ${accent}55`, boxShadow: `0 0 20px ${accent}22` }}>
                    <Megaphone color={accent} size={32} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '1px' }}>Маркетинг & Акції</h2>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '15px' }}>Керування глобальними сповіщеннями та знижками на сайті</p>
                </div>
            </div>

            {/* ВНУТРІШНЄ ВІКНО ДЛЯ СКРОЛУ (ПЕРЕХОПЛЮЄ КОЛІЩАТКО) */}
            <div 
                className="custom-scrollbar" 
                onWheel={(e) => e.stopPropagation()} // 🔥 МАГІЯ: БЛОКУЄ СКРОЛ ФОНУ
                style={{ flex: 1, overflowY: 'auto', paddingRight: '15px', paddingBottom: '30px' }}
            >
                <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    {/* ГОЛОВНИЙ ПЕРЕМИКАЧ */}
                    <div 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 25px', background: isActive ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05))' : 'linear-gradient(90deg, rgba(255, 68, 68, 0.15), rgba(255, 68, 68, 0.05))', border: `1px solid ${isActive ? '#4caf50' : '#ff4444'}`, borderRadius: '16px', marginBottom: '30px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: isActive ? '0 0 20px rgba(76, 175, 80, 0.1)' : '0 0 20px rgba(255, 68, 68, 0.1)' }} 
                        onClick={handleToggleActive}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: isActive ? '#4caf50' : '#ff4444', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Power color="#fff" size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '900', fontSize: '18px', color: isActive ? '#4caf50' : '#ff4444' }}>
                                    {isActive ? 'АКЦІЯ АКТИВНА' : 'АКЦІЯ ВИМКНЕНА'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                                    {isActive ? 'Користувачі бачать повідомлення та знижки у реальному часі' : 'Усі знижки приховані'}
                                </div>
                            </div>
                        </div>
                        <div style={{ width: '60px', height: '32px', background: isActive ? '#4caf50' : '#333', borderRadius: '30px', position: 'relative', transition: '0.3s' }}>
                            <div style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isActive ? '30px' : '2px', transition: '0.3s' }} />
                        </div>
                    </div>

                    {/* ТЕКСТ ПОВІДОМЛЕННЯ */}
                    <div style={{ marginBottom: '30px', background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: '900' }}>
                            <Tag size={18} color={accent} /> Текст розсилки (Рупор)
                        </label>
                        <textarea 
                            placeholder="Наприклад: 🔥 Знижка -20% на DIAMOND!"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ width: '100%', padding: '15px', background: '#050508', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', minHeight: '100px', fontSize: '15px', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', marginBottom: '35px' }}>
                        {/* ЗНИЖКА НА VIP */}
                        <div style={{ background: '#111', border: `1px solid ${vipDiscountPercent > 0 ? accent : 'rgba(255,255,255,0.05)'}`, padding: '25px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '900', fontSize: '16px' }}>
                                    <Crown size={22} color="#ffd700" /> Знижка на VIP
                                </div>
                                <span style={{ background: vipDiscountPercent > 0 ? accent : '#222', color: vipDiscountPercent > 0 ? '#000' : '#888', padding: '6px 12px', borderRadius: '8px', fontWeight: '900' }}>
                                    -{vipDiscountPercent}%
                                </span>
                            </div>
                            <input 
                                type="range" min="0" max="99" value={vipDiscountPercent} 
                                onChange={(e) => setVipDiscountPercent(Number(e.target.value))}
                                style={{ width: '100%', accentColor: accent, cursor: 'pointer' }}
                            />
                            {vipDiscountPercent > 0 && (
                                <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px', fontWeight: 'bold' }}>Пакети:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {availablePackages.map(pkg => (
                                            <div key={pkg.id} onClick={() => togglePackage(pkg.id)} style={{ padding: '12px 10px', borderRadius: '10px', background: activeVipPackages.includes(pkg.id) ? `${pkg.color}22` : '#050508', border: `1px solid ${activeVipPackages.includes(pkg.id) ? pkg.color : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: activeVipPackages.includes(pkg.id) ? pkg.color : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {activeVipPackages.includes(pkg.id) && <Check size={14} color="#000" strokeWidth={4} />}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: activeVipPackages.includes(pkg.id) ? 'white' : '#888', fontSize: '13px', fontWeight: '900' }}>{pkg.name.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ЗНИЖКА НА ПІДНЯТТЯ */}
                        <div style={{ background: '#111', border: `1px solid ${bumpDiscountPercent > 0 ? '#ff9800' : 'rgba(255,255,255,0.05)'}`, padding: '25px', borderRadius: '16px', height: 'max-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '900', fontSize: '16px' }}>
                                    <Rocket size={22} color="#ff9800" /> Знижка на Підняття
                                </div>
                                <span style={{ background: bumpDiscountPercent > 0 ? '#ff9800' : '#222', color: bumpDiscountPercent > 0 ? '#000' : '#888', padding: '6px 12px', borderRadius: '8px', fontWeight: '900' }}>
                                    -{bumpDiscountPercent}%
                                </span>
                            </div>
                            <input 
                                type="range" min="0" max="99" value={bumpDiscountPercent} 
                                onChange={(e) => setBumpDiscountPercent(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#ff9800', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleBroadcast} disabled={loading}
                        style={{ width: '100%', padding: '20px', background: `linear-gradient(45deg, ${accent}, #ff4081)`, border: 'none', color: '#fff', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textTransform: 'uppercase' }}
                    >
                        {loading ? 'ЗБЕРЕЖЕННЯ...' : <><Send size={22} /> Зберегти та Застосувати Акцію</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminBroadcast;