import React, { useState, useEffect } from 'react';
import { Megaphone, Power, Send, Rocket, Crown, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { accent } from '../../styles/theme';

// Список доступних пакетів для вибору знижки
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

    // Коректне формування URL для бекенду
    let BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (BACKEND_URL.endsWith('/api')) BACKEND_URL = BACKEND_URL.slice(0, -4);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/admin/megaphone/status`, { withCredentials: true });
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
                message,
                vipDiscountPercent,
                activeVipPackages,
                bumpDiscountPercent,
                isActive
            }, { withCredentials: true });

            if (response.data.success) {
                toast.success('Рупор та акції успішно оновлено!', { 
                    id: loadingToast,
                    style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } 
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

    return (
        <div className="fade-in-up custom-scrollbar" style={{ maxWidth: '850px', margin: '0 auto', color: 'white', paddingBottom: '40px' }}>
            
            {/* ХЕДЕР СЕКЦІЇ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}44)`, padding: '16px', borderRadius: '16px', border: `1px solid ${accent}55`, boxShadow: `0 0 20px ${accent}22` }}>
                    <Megaphone color={accent} size={32} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '1px' }}>Маркетинг & Акції</h2>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '15px' }}>Керування глобальними сповіщеннями та знижками на сайті</p>
                </div>
            </div>

            <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                
                {/* ГОЛОВНИЙ ПЕРЕМИКАЧ (МАЙСТЕР-СВІТЧ) */}
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 25px', background: isActive ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05))' : 'linear-gradient(90deg, rgba(255, 68, 68, 0.15), rgba(255, 68, 68, 0.05))', border: `1px solid ${isActive ? '#4caf50' : '#ff4444'}`, borderRadius: '16px', marginBottom: '30px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: isActive ? '0 0 20px rgba(76, 175, 80, 0.1)' : '0 0 20px rgba(255, 68, 68, 0.1)' }} 
                    onClick={() => setIsActive(!isActive)}
                    className="menu-hover"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: isActive ? '#4caf50' : '#ff4444', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isActive ? '0 0 15px #4caf50' : '0 0 15px #ff4444' }}>
                            <Power color="#fff" size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: '18px', color: isActive ? '#4caf50' : '#ff4444', letterSpacing: '0.5px' }}>
                                {isActive ? 'АКЦІЯ АКТИВНА' : 'АКЦІЯ ВИМКНЕНА'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                                {isActive ? 'Користувачі бачать повідомлення та знижки у реальному часі' : 'Усі знижки та повідомлення приховані від користувачів'}
                            </div>
                        </div>
                    </div>
                    {/* Перемикач */}
                    <div style={{ width: '60px', height: '32px', background: isActive ? '#4caf50' : '#333', borderRadius: '30px', position: 'relative', transition: '0.3s', border: '2px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isActive ? '30px' : '2px', transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
                    </div>
                </div>

                {/* ТЕКСТ ПОВІДОМЛЕННЯ */}
                <div style={{ marginBottom: '30px', background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: '900' }}>
                        <Tag size={18} color={accent} /> Текст розсилки (Рупор)
                    </label>
                    <textarea 
                        placeholder="Наприклад: 🔥 Тільки сьогодні знижка -20% на пакети DIAMOND та PREMIUM! Поспішай!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ width: '100%', padding: '15px', background: '#050508', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '100px', fontSize: '15px', fontFamily: 'inherit' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', marginBottom: '35px' }}>
                    
                    {/* БЛОК: ЗНИЖКА НА VIP */}
                    <div style={{ background: '#111', border: `1px solid ${vipDiscountPercent > 0 ? accent : 'rgba(255,255,255,0.05)'}`, padding: '25px', borderRadius: '16px', transition: '0.3s', boxShadow: vipDiscountPercent > 0 ? `0 0 20px ${accent}11` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '900', fontSize: '16px' }}>
                                <Crown size={22} color="#ffd700" /> Знижка на VIP
                            </div>
                            <span style={{ background: vipDiscountPercent > 0 ? `${accent}` : '#222', color: vipDiscountPercent > 0 ? '#000' : '#888', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '900', transition: '0.3s' }}>
                                -{vipDiscountPercent}%
                            </span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="0" max="99" 
                            value={vipDiscountPercent} 
                            onChange={(e) => setVipDiscountPercent(Number(e.target.value))}
                            style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: '6px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>
                            <span>0%</span>
                            <span>50%</span>
                            <span>99%</span>
                        </div>

                        {/* ВИБІР ПАКЕТІВ (З'являється тільки якщо знижка > 0) */}
                        {vipDiscountPercent > 0 && (
                            <div className="fade-in-up" style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px', fontWeight: 'bold' }}>Застосувати знижку до пакетів:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {availablePackages.map(pkg => {
                                        const isSelected = activeVipPackages.includes(pkg.id);
                                        return (
                                            <div 
                                                key={pkg.id} 
                                                onClick={() => togglePackage(pkg.id)} 
                                                className="menu-hover"
                                                style={{ padding: '12px 10px', borderRadius: '10px', background: isSelected ? `${pkg.color}22` : '#050508', border: `1px solid ${isSelected ? pkg.color : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: isSelected ? `inset 0 0 10px ${pkg.color}11` : 'none' }} 
                                            >
                                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: isSelected ? pkg.color : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                                                    {isSelected && <Check size={14} color="#000" strokeWidth={4} />}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: isSelected ? 'white' : '#888', fontSize: '13px', fontWeight: '900' }}>{pkg.name.split(' ')[0]}</span>
                                                    <span style={{ color: '#666', fontSize: '10px', fontWeight: 'bold' }}>{pkg.type}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* БЛОК: ЗНИЖКА НА ПІДНЯТТЯ */}
                    <div style={{ background: '#111', border: `1px solid ${bumpDiscountPercent > 0 ? '#ff9800' : 'rgba(255,255,255,0.05)'}`, padding: '25px', borderRadius: '16px', transition: '0.3s', boxShadow: bumpDiscountPercent > 0 ? `0 0 20px rgba(255, 152, 0, 0.1)` : 'none', height: 'max-content' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '900', fontSize: '16px' }}>
                                <Rocket size={22} color="#ff9800" /> Знижка на Підняття
                            </div>
                            <span style={{ background: bumpDiscountPercent > 0 ? '#ff9800' : '#222', color: bumpDiscountPercent > 0 ? '#000' : '#888', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '900', transition: '0.3s' }}>
                                -{bumpDiscountPercent}%
                            </span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="0" max="99" 
                            value={bumpDiscountPercent} 
                            onChange={(e) => setBumpDiscountPercent(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#ff9800', cursor: 'pointer', height: '6px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>
                            <span>0%</span>
                            <span>50%</span>
                            <span>99%</span>
                        </div>
                    </div>

                </div>

                {/* КНОПКА ЗБЕРЕЖЕННЯ */}
                <button 
                    onClick={handleBroadcast} 
                    disabled={loading}
                    className="menu-hover"
                    style={{ width: '100%', padding: '20px', background: `linear-gradient(45deg, ${accent}, #ff4081)`, border: 'none', color: '#fff', borderRadius: '16px', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: `0 10px 30px ${accent}66`, transition: 'all 0.3s ease', textTransform: 'uppercase' }}
                >
                    {loading ? (
                        <>
                            <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            ЗБЕРЕЖЕННЯ...
                        </>
                    ) : (
                        <>
                            <Send size={22} /> Зберегти та Застосувати Акцію
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AdminBroadcast;