import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Phone, ShieldAlert, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { C, R, shadow, overlay, modalBox, btnPrimary, input, closeBtn } from '../styles/ds';

const Field = ({ icon: Icon, ...props }) => (
    <div style={{ position: 'relative' }}>
        {Icon && <Icon size={16} color={C.textMuted} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />}
        <input {...props} style={{ ...input(), paddingLeft: Icon ? '42px' : '16px', ...props.style }} />
    </div>
);

const TITLES = {
    login: 'Вхід', register: 'Реєстрація', verify: 'Підтвердження',
    forgot: 'Відновлення', 'verify-2fa': 'Двофакторний захист', reset: 'Новий пароль',
};

const AuthModal = ({ accent: _a }) => {
    const setShowAuth = useStore(s => s.setShowAuth);
    const login      = useStore(s => s.login);

    const [mode, setMode]       = useState('login');
    const [loading, setLoading] = useState(false);
    const [email, setEmail]     = useState('');
    const [password, setPw]     = useState('');
    const [phone, setPhone]     = useState('');
    const [role, setRole]       = useState('client');
    const [otp, setOtp]         = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [resetCode, setRC]    = useState('');
    const [newPw, setNewPw]     = useState('');

    const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
    const post = (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {

            if (mode === 'login') {
                const d = await post('/auth/login', { email, password });
                if (d.success && d.require2FA) { toast.success('Введіть код з пошти!', { icon: '🛡️' }); setMode('verify-2fa'); }
                else if (d.success) { toast.success('Вхід успішний!'); const u = d.user || {}; setTimeout(() => login(u.id || u._id, u.role, u.email, d.token, u.twoFactorEnabled || false), 50); }
                else toast.error(d.message || 'Невірна пошта або пароль');
            } else if (mode === 'verify-2fa') {
                const d = await post('/auth/verify-2fa-login', { email, code: otp });
                if (d.success) { const u = d.user || {}; setTimeout(() => login(u.id || u._id, u.role, u.email, d.token, true), 50); }
                else toast.error(d.message || 'Невірний код');
            } else if (mode === 'register') {
                const d = await post('/auth/register-init', { email, password, phone, role });
                if (d.success) { toast.success('Код відправлено на пошту!'); setMode('verify'); }
                else toast.error(d.message || 'Помилка реєстрації');
            } else if (mode === 'verify') {
                const d = await post('/auth/register-verify', { email, otp });
                if (d.success) { const u = d.user || {}; setTimeout(() => login(u.id || u._id, u.role, u.email, d.token, false), 50); }
                else toast.error(d.message || 'Невірний код');
            } else if (mode === 'forgot') {
                const d = await post('/auth/forgot-password', { email });
                if (d.success) { toast.success('Код відправлено!'); setMode('reset'); }
                else toast.error(d.message || 'Помилка');
            } else if (mode === 'reset') {
                const d = await post('/auth/reset-password', { email, code: resetCode, newPassword: newPw });
                if (d.success) { toast.success('Пароль змінено!'); setMode('login'); }
                else toast.error(d.message || 'Невірний код');
            }
        } catch (err) { toast.error('Збій з\'єднання'); }
        finally { setLoading(false); }
    };

    const isCode = mode === 'verify' || mode === 'verify-2fa';

    // Таймер зворотного відліку для повторної відправки коду
    useEffect(() => {
        if (resendTimer <= 0) return;
        const id = setInterval(() => setResendTimer(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    // Запускаємо таймер коли заходимо на екран вводу коду
    useEffect(() => {
        if (isCode) setResendTimer(90);
    }, [isCode]);

    // Повторна відправка коду
    const handleResend = async () => {
        if (resendTimer > 0 || loading) return;
        setLoading(true);
        try {
            const endpoint = mode === 'verify-2fa' ? '/auth/login' : '/auth/register-init';
            const body = mode === 'verify-2fa' ? { email, password } : { email, password, phone, role };
            const d = await post(endpoint, body);
            if (d.success || d.require2FA) { toast.success('Код надіслано повторно!'); setResendTimer(90); }
            else toast.error(d.message || 'Не вдалося надіслати код');
        } catch { toast.error('Збій з\'єднання'); }
        finally { setLoading(false); }
    };

    const fmtTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div style={overlay} onClick={() => setShowAuth(false)}>
            <div className="fade-in-up modal-pop" style={modalBox('420px', { padding: '32px' })} onClick={e => e.stopPropagation()}>

                {/* Close */}
                <button onClick={() => setShowAuth(false)} style={closeBtn}><X size={16} /></button>

                {/* Icon + Title */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${C.accent}18`, border: `1px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        {isCode ? <ShieldAlert size={24} color={C.accent} /> : <Lock size={24} color={C.accent} />}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: C.text }}>{TITLES[mode]}</div>
                    {mode === 'verify-2fa' && <div style={{ color: C.textSub, fontSize: '13px', marginTop: '6px' }}>Код надіслано на {email}</div>}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'reset') && (
                        <Field icon={Mail} required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    )}
                    {(mode === 'login' || mode === 'register') && (
                        <Field icon={Lock} required type="password" placeholder="Пароль" value={password} onChange={e => setPw(e.target.value)} />
                    )}
                    {mode === 'register' && (
                        <>
                            <Field icon={Phone} type="tel" placeholder="Телефон (необов'язково)" value={phone} onChange={e => setPhone(e.target.value)} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['client', 'model'].map(r => (
                                    <button key={r} type="button" onClick={() => setRole(r)} style={{ flex: 1, padding: '11px', borderRadius: R.sm, fontFamily: 'inherit', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.18s', background: role === r ? `${C.accent}22` : C.surface2, border: `1px solid ${role === r ? C.accent : C.border}`, color: role === r ? C.accent : C.textSub }}>
                                        {r === 'client' ? '👤 Клієнт' : '⭐ Модель'}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {isCode && (
                        <input required type="text" placeholder="Введіть код" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{ ...input(), textAlign: 'center', letterSpacing: '6px', fontSize: '22px', fontWeight: '900' }} />
                    )}
                    {mode === 'reset' && (
                        <>
                            <input required type="text" placeholder="Код з Email" value={resetCode} onChange={e => setRC(e.target.value)} style={{ ...input(), textAlign: 'center', letterSpacing: '4px' }} />
                            <Field icon={Lock} required type="password" placeholder="Новий пароль" value={newPw} onChange={e => setNewPw(e.target.value)} />
                        </>
                    )}

                    {mode === 'login' && (
                        <div style={{ textAlign: 'right' }}>
                            <span onClick={() => setMode('forgot')} style={{ color: C.accent, fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>Забули пароль?</span>
                        </div>
                    )}

                    <button disabled={loading} type="submit" style={{ ...btnPrimary(), width: '100%', padding: '14px', marginTop: '4px', opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Обробка...' : mode === 'login' ? 'Увійти' : mode === 'register' ? 'Зареєструватись' : isCode ? 'Підтвердити код' : mode === 'forgot' ? 'Відправити код' : 'Змінити пароль'}
                    </button>

                    {isCode && (
                        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px' }}>
                            {resendTimer > 0 ? (
                                <span style={{ color: C.textSub }}>Надіслати код ще раз через {fmtTimer(resendTimer)}</span>
                            ) : (
                                <span onClick={handleResend} style={{ color: C.accent, cursor: 'pointer', fontWeight: '700' }}>Відправити код ще раз</span>
                            )}
                        </div>
                    )}
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', color: C.textSub, fontSize: '13px' }}>
                    {(mode === 'login' || mode === 'verify-2fa') ? (
                        <>Немає акаунта?{' '}<span onClick={() => setMode('register')} style={{ color: C.accent, cursor: 'pointer', fontWeight: '700' }}>Створити</span></>
                    ) : (
                        <span onClick={() => setMode('login')} style={{ color: C.textSub, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowLeft size={13} /> Назад до входу
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;