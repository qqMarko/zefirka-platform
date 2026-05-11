import React, { useState } from 'react';
import { X, Mail, Lock, Phone, User, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';

const AuthModal = ({ accent = '#00ffff' }) => {
    // 🚀 Використовуємо селектори Zustand (щоб уникнути зайвих рендерів)
    const setShowAuth = useStore(state => state.setShowAuth);
    const login = useStore(state => state.login);
    
    const [mode, setMode] = useState('login'); 
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('client');
    const [otp, setOtp] = useState('');
    
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

        try {
            if (mode === 'login') {
                const res = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (data.success && data.require2FA) {
                    toast.success(data.message || 'Введіть код з пошти!', { icon: '🛡️' });
                    setMode('verify-2fa');
                } else if (data.success) {
                    toast.success('Вхід успішний!');
                    const safeUser = data.user || {};
                    const userId = safeUser.id || safeUser._id;
                    
                    // 🚀 ВІДКЛАДЕНИЙ ЛОГІН (Обходить проковтування помилок React)
                    setTimeout(() => {
                        login(userId, safeUser.role, safeUser.email, data.token, safeUser.twoFactorEnabled || false);
                    }, 50);
                    
                } else {
                    toast.error(data.message || 'Невірна пошта або пароль');
                }

            } else if (mode === 'verify-2fa') {
                const res = await fetch(`${BASE_URL}/auth/verify-2fa-login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code: otp })
                });
                const data = await res.json();
                
                if (data.success) {
                    toast.success('Автентифікація успішна!');
                    const safeUser = data.user || {};
                    const userId = safeUser.id || safeUser._id;
                    
                    setTimeout(() => {
                        login(userId, safeUser.role, safeUser.email, data.token, safeUser.twoFactorEnabled || true);
                    }, 50);
                } else {
                    toast.error(data.message || 'Невірний або прострочений код');
                }

            } else if (mode === 'register') {
                const res = await fetch(`${BASE_URL}/auth/register-init`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, phone, role })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success('Код відправлено на пошту!');
                    setMode('verify');
                } else toast.error(data.message || 'Помилка реєстрації');

            } else if (mode === 'verify') {
                const res = await fetch(`${BASE_URL}/auth/register-verify`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success('Реєстрація успішна!');
                    const safeUser = data.user || {};
                    const userId = safeUser.id || safeUser._id;
                    
                    setTimeout(() => {
                        login(userId, safeUser.role, safeUser.email, data.token, safeUser.twoFactorEnabled || false);
                    }, 50);
                } else toast.error(data.message || 'Невірний код');

            } else if (mode === 'forgot') {
                // ... логіка відновлення без змін
                const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success('📧 Код відправлено на пошту!', { duration: 5000 });
                    setMode('reset');
                } else toast.error(data.message || 'Помилка');

            } else if (mode === 'reset') {
                const res = await fetch(`${BASE_URL}/auth/reset-password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code: resetCode, newPassword })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success('✅ Пароль успішно змінено!', { duration: 5000 });
                    setMode('login');
                } else toast.error(data.message || '❌ Невірний код');
            }
        } catch (error) {
            console.error("🔥 СПРАВЖНЯ МЕРЕЖЕВА ПОМИЛКА:", error);
            toast.error(`Збій з'єднання: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowAuth(false)}>
            <div className="fade-in-up modal-pop" style={{ width: '100%', maxWidth: '420px', background: '#0a0a0f', border: `1px solid ${accent}`, borderRadius: '24px', padding: '35px', position: 'relative', boxShadow: `0 20px 60px rgba(0,0,0,0.9)` }} onClick={e => e.stopPropagation()}>
                
                <X onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer', color: '#888', transition: '0.3s' }} className="menu-hover" size={24} />
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `${accent}22`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                        {mode === 'verify-2fa' ? <ShieldAlert size={30} color={accent} /> : <Lock size={30} color={accent} />}
                    </div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>
                        {mode === 'login' ? 'ВХІД' : 
                         mode === 'register' ? 'РЕЄСТРАЦІЯ' : 
                         mode === 'verify' ? 'ПІДТВЕРДЖЕННЯ' : 
                         mode === 'forgot' ? 'ВІДНОВЛЕННЯ' : 
                         mode === 'verify-2fa' ? 'ЗАХИСТ 2FA' : 'НОВИЙ ПАРОЛЬ'}
                    </h2>
                    {mode === 'verify-2fa' && <div style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>Введіть 6-значний код, надісланий на {email}</div>}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#888" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '14px 15px 14px 45px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'register') && (
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#888" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input required type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '14px 15px 14px 45px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                    )}

                    {mode === 'register' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} color="#888" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="tel" placeholder="Телефон (необов'язково)" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '14px 15px 14px 45px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setRole('client')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: role === 'client' ? `${accent}22` : '#111', border: `1px solid ${role === 'client' ? accent : 'rgba(255,255,255,0.1)'}`, color: role === 'client' ? accent : '#888', cursor: 'pointer', transition: '0.3s' }}>Клієнт</button>
                                <button type="button" onClick={() => setRole('model')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: role === 'model' ? `${accent}22` : '#111', border: `1px solid ${role === 'model' ? accent : 'rgba(255,255,255,0.1)'}`, color: role === 'model' ? accent : '#888', cursor: 'pointer', transition: '0.3s' }}>Модель</button>
                            </div>
                        </>
                    )}

                    {(mode === 'verify' || mode === 'verify-2fa') && (
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#888" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input required type="text" placeholder={mode === 'verify-2fa' ? "6-значний код" : "Код з Email"} value={otp} onChange={e => setOtp(e.target.value)} style={{ width: '100%', padding: '14px 15px 14px 45px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none', letterSpacing: '2px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} maxLength={6} />
                        </div>
                    )}

                    {mode === 'reset' && (
                        <>
                            <input required type="text" placeholder="Код з Email" value={resetCode} onChange={e => setResetCode(e.target.value)} style={{ width: '100%', padding: '14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none', textAlign: 'center', letterSpacing: '2px' }} />
                            <input required type="password" placeholder="Новий пароль" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                        </>
                    )}

                    {mode === 'login' && (
                        <div style={{ textAlign: 'right' }}>
                            <span onClick={() => setMode('forgot')} style={{ color: accent, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }} className="menu-hover">Забули пароль?</span>
                        </div>
                    )}

                    {mode === 'verify-2fa' && (
                         <div style={{ textAlign: 'center' }}>
                             <span onClick={() => setMode('login')} style={{ color: '#888', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }} className="menu-hover">Повернутись до логіну</span>
                         </div>
                    )}

                    <button disabled={loading} type="submit" style={{ width: '100%', padding: '15px', background: accent, border: 'none', color: '#000', borderRadius: '12px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', letterSpacing: '1px', marginTop: '10px' }} className="menu-hover">
                        {loading ? 'ОБРОБКА...' : 
                         mode === 'login' ? 'УВІЙТИ' : 
                         mode === 'register' ? 'ЗАРЕЄСТРУВАТИСЯ' : 
                         (mode === 'verify' || mode === 'verify-2fa') ? 'ПІДТВЕРДИТИ КОД' : 
                         mode === 'forgot' ? 'ВІДНОВИТИ ПАРОЛЬ' : 'ЗМІНИТИ ПАРОЛЬ'}
                    </button>
                    
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '13px' }}>
                    {(mode === 'login' || mode === 'verify-2fa') ? (
                        <>Немає акаунта? <span onClick={() => setMode('register')} style={{ color: accent, cursor: 'pointer', fontWeight: 'bold' }}>Створити</span></>
                    ) : (
                        <>Вже є акаунт? <span onClick={() => setMode('login')} style={{ color: accent, cursor: 'pointer', fontWeight: 'bold' }}>Увійти</span></>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AuthModal;