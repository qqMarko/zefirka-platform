import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, Bell, Monitor, LogOut, ChevronRight, ChevronLeft, Lock, Smartphone, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import { toast } from 'react-hot-toast';
import { C, R, overlay, modalBox, closeBtn, section, btnPrimary, btnDanger, btnGhost, input, label, divider } from '../styles/ds';
import useSmoothScroll from '../hooks/useSmoothScroll';

const SettingsModal = ({ setShowSettingsModal, t, currentLang, accent, handleLogout }) => {
    const [activeTab, setActiveTab] = useState('main'); 
    const scrollRef = useRef(null);

    // Smooth scroll — same as site-wide useSmoothScroll hook
    useSmoothScroll(scrollRef, 0.06, 0.9);
    
    const { pushEnabled, togglePushEnabled, userUniqueId, user } = useStore();

    const [emailNotif, setEmailNotif] = useState(user?.emailNotifications !== false);
    const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);

    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    useEffect(() => {
        if (activeTab === 'sessions') {
            fetchSessions();
        }
    }, [activeTab]);

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const token = useStore.getState().token || localStorage.getItem('token') || localStorage.getItem('zefirka_token') || localStorage.getItem('auth_token'); 
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            
            const res = await fetch(`${BASE_URL}/auth/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error("Помилка завантаження сесій:", error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleToggle2FA = async () => {
        const token = useStore.getState().token || localStorage.getItem('zefirka_token');
        if (!token) {
            toast.error('Сесія застаріла. Увійдіть заново.');
            return;
        }
        const newStatus = !twoFactor;
        setTwoFactor(newStatus); 
        const loadingToast = toast.loading('Оновлення налаштувань...');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/toggle-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ enabled: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`2FA ${newStatus ? (t[currentLang]?.enabled || 'увімкнено') : (t[currentLang]?.disabled || 'вимкнено')}!`, { id: loadingToast });
                useStore.getState().setUser({ twoFactorEnabled: newStatus });
                localStorage.setItem('zefirka_2fa', newStatus);
            } else {
                setTwoFactor(!newStatus); 
                toast.error(data.message || 'Помилка оновлення', { id: loadingToast });
            }
        } catch (error) {
            setTwoFactor(!newStatus);
            toast.error('Помилка сервера', { id: loadingToast });
        }
    };

    const handleToggleEmail = async () => {
        const token = useStore.getState().token || localStorage.getItem('zefirka_token');
        if (!token) {
            toast.error('Сесія застаріла. Увійдіть заново.');
            return;
        }
        const newStatus = !emailNotif;
        setEmailNotif(newStatus);
        const loadingToast = toast.loading('Оновлення налаштувань...');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/toggle-email-notif`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ enabled: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`${t[currentLang]?.emailNotif || 'Email'} ${newStatus ? (t[currentLang]?.enabled || 'увімкнено') : (t[currentLang]?.disabled || 'вимкнено')}!`, { id: loadingToast });
                useStore.getState().setUser({ emailNotifications: newStatus });
                localStorage.setItem('zefirka_emailNotif', newStatus);
            } else {
                setEmailNotif(!newStatus);
                toast.error(data.message || 'Помилка оновлення', { id: loadingToast });
            }
        } catch (error) {
            setEmailNotif(!newStatus);
            toast.error('Помилка сервера', { id: loadingToast });
        }
    };

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault(); 
        
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error('Заповніть всі поля');
            return;
        }
        
        if (newPassword !== confirmPassword) { 
            toast.error('Нові паролі не співпадають!'); 
            return; 
        }

        setIsSaving(true);
        const loadingToast = toast.loading('Перевірка та збереження...');

        try {
            const token = useStore.getState().token || localStorage.getItem('zefirka_token');
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch(err) {
                throw new Error("Бекенд не оновлено! Зроби рестарт сервера.");
            }

            if (data.success) {
                toast.success('✅ Ваш пароль успішно змінено!', { id: loadingToast, duration: 5000 });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowOld(false);
                setShowNew(false);
                setShowConfirm(false);
            } else {
                toast.error(data.message || '❌ Невірний поточний пароль', { id: loadingToast, duration: 4000 });
            }
        } catch (error) {
            toast.error(`❌ Помилка: ${error.message}`, { id: loadingToast, duration: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoutAllSessions = async () => {
        const token = useStore.getState().token || localStorage.getItem('token') || localStorage.getItem('zefirka_token') || localStorage.getItem('auth_token');

        if (!token) {
            toast.error('Помилка: Токен не знайдено на клієнті!');
            return;
        }

        const loadingToast = toast.loading('Завершення сеансів...');
        
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/logout-all`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Всі інші сеанси успішно завершено!', { id: loadingToast });
                fetchSessions();
            } else {
                toast.error(data.message || 'Не вдалося завершити сеанси', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Помилка сервера', { id: loadingToast });
        }
    };

    // 🔴 ФУНКЦІЯ ДЛЯ ЗАВЕРШЕННЯ ТІЛЬКИ ОДНОГО СЕАНСУ
    const handleLogoutSingleSession = async (sessionToken) => {
        const currentToken = useStore.getState().token || localStorage.getItem('zefirka_token');
        const loadingToast = toast.loading('Завершення сеансу...');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/logout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ sessionToken }) // Передаємо токен того пристрою, який хочемо "вбити"
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Сеанс завершено!', { id: loadingToast });
                fetchSessions(); // Оновлюємо список
            } else {
                toast.error(data.message || 'Помилка', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Помилка сервера', { id: loadingToast });
        }
    };

    const renderMain = () => (
        <>
            <div style={{ display: 'grid', gap: '10px' }}>
                <div onClick={() => setActiveTab('security')} style={{ padding: '14px 16px', background: C.surface2, borderRadius: R.sm, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: `1px solid ${C.border}`, transition: 'border-color 0.18s' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderMd} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Shield size={18} color={C.accent} />
                        <span style={{ color: C.text, fontWeight: '600', fontSize: '14px' }}>{t[currentLang]?.tabSecurity || 'Безпека'}</span>
                    </div>
                    <ChevronRight size={18} color="#444" />
                </div>

                <div onClick={() => setActiveTab('notifications')} style={{ padding: '14px 16px', background: C.surface2, borderRadius: R.sm, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: `1px solid ${C.border}`, transition: 'border-color 0.18s' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderMd} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Bell size={18} color={C.warning} />
                        <span style={{ color: C.text, fontWeight: '600', fontSize: '14px' }}>{t[currentLang]?.tabNotif || 'Сповіщення'}</span>
                    </div>
                    <ChevronRight size={18} color="#444" />
                </div>

                <div onClick={() => setActiveTab('sessions')} style={{ padding: '14px 16px', background: C.surface2, borderRadius: R.sm, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: `1px solid ${C.border}`, transition: 'border-color 0.18s' }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderMd} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Monitor size={18} color='#00ffff' />
                        <span style={{ color: C.text, fontWeight: '600', fontSize: '14px' }}>{t[currentLang]?.tabSessions || 'Активні сесії'}</span>
                    </div>
                    <ChevronRight size={18} color="#444" />
                </div>
            </div>

            <button onClick={handleLogout} style={{ width: '100%', marginTop: '20px', padding: '13px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: R.sm, color: C.danger, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontFamily: 'inherit', transition: 'background 0.18s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,68,68,0.14)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,68,68,0.08)'}>
                <LogOut size={16} /> {t[currentLang]?.logout || 'Вийти'}
            </button>
        </>
    );

    const renderSecurity = () => (
        <div className="fade-in-up">
            <div style={{ ...section(), marginBottom: '16px' }}>
                <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16} color={accent}/> {t[currentLang]?.changePassword || "Зміна пароля"}</h3>
                
                <form onSubmit={handlePasswordChange}>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input required type={showOld ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={t[currentLang]?.currentPassword || "Поточний пароль"} style={{ ...input(), paddingRight: '42px' }} />
                        <div onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input required type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t[currentLang]?.newPassword || "Новий пароль"} style={{ ...input(), paddingRight: '42px' }} />
                        <div onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                        <input required type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t[currentLang]?.confirmPassword || "Повторіть новий пароль"} style={{ ...input(), paddingRight: '42px' }} />
                        <div onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>
                    
                    <button type="submit" disabled={isSaving} style={{ ...btnPrimary(), width: '100%', marginTop: '4px', opacity: isSaving ? 0.6 : 1 }}>
                        {isSaving ? (t[currentLang]?.savingPassword || 'ЗБЕРЕЖЕННЯ...') : (t[currentLang]?.savePassword || 'Зберегти пароль')}
                    </button>
                </form>
            </div>
            
            <div style={{ ...section(), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>{t[currentLang]?.twoFactor || "Двофакторна автентифікація (2FA)"}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{t[currentLang]?.twoFactorDesc || "Додатковий захист вашого акаунту"}</div>
                </div>
                <div onClick={handleToggle2FA} style={{ width: '44px', height: '24px', flexShrink: 0, boxSizing: 'border-box', background: twoFactor ? accent : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: twoFactor ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="fade-in-up" style={{ display: 'grid', gap: '15px' }}>
            <div style={{ ...section(), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} color="#ffc107"/> {t[currentLang]?.emailNotif || "Email сповіщення"}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{t[currentLang]?.emailNotifDesc || "Отримувати листи про нові повідомлення"}</div>
                </div>
                <div onClick={handleToggleEmail} style={{ width: '44px', height: '24px', flexShrink: 0, boxSizing: 'border-box', background: emailNotif ? '#ffc107' : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: emailNotif ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
            
            <div style={{ ...section(), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={16} color="#ffc107"/> {t[currentLang]?.pushNotif || "Push-сповіщення"}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{t[currentLang]?.pushNotifDesc || "Сповіщення в браузері та дзвіночок"}</div>
                </div>
                <div onClick={togglePushEnabled} style={{ width: '44px', height: '24px', flexShrink: 0, boxSizing: 'border-box', background: pushEnabled ? '#ffc107' : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: pushEnabled ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
        </div>
    );

    const renderSessions = () => {
        const currentToken = useStore.getState().token || localStorage.getItem('token') || localStorage.getItem('zefirka_token') || localStorage.getItem('auth_token');

        return (
            <div className="fade-in-up">
                {loadingSessions ? (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>{t[currentLang]?.loadingDevices || "Завантаження пристроїв..."}</div>
                ) : sessions.length > 0 ? (
                    sessions.map((session) => {
                        const isCurrent = session.token === currentToken;
                        const isMobile = session.device.toLowerCase().includes('android') || session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('mobile');
                        
                        return (
                            <div key={session._id} style={{ background: isCurrent ? 'rgba(0, 255, 255, 0.05)' : '#111', border: `1px solid ${isCurrent ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255,255,255,0.05)'}`, padding: '20px', borderRadius: '12px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {isMobile ? <Smartphone size={28} color={isCurrent ? "#00ffff" : "#888"} /> : <Monitor size={28} color={isCurrent ? "#00ffff" : "#888"} />}
                                        <div>
                                            <div style={{ color: isCurrent ? 'white' : '#ccc', fontWeight: 'bold', fontSize: '14px' }}>{session.device}</div>
                                            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>IP: {session.ip || t[currentLang]?.unknownIp || 'Невідомо'}</div>
                                        </div>
                                    </div>

                                    {/* 🔴 ТУТ ЗМІНА: КНОПКА ВИЙТИ ДЛЯ ІНШИХ СЕАНСІВ */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {isCurrent ? (
                                            <div style={{ color: '#00ffff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0, 255, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{t[currentLang]?.currentSession || "Поточна"}</div>
                                        ) : (
                                            <button 
                                                onClick={() => handleLogoutSingleSession(session.token)}
                                                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.3s' }}
                                                className="menu-hover"
                                            >
                                                <LogOut size={14} /> {t[currentLang]?.logoutSession || "Вийти"}
                                            </button>
                                        )}
                                    </div>
                                    
                                </div>
                                <div style={{ color: '#666', fontSize: '11px', marginTop: '15px' }}>
                                    {isCurrent ? t[currentLang]?.activeNow || 'Активно зараз' : `${t[currentLang]?.lastActive || 'Остання активність:'} ${new Date(session.lastActive || session.createdAt).toLocaleString('uk-UA')}`}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>{t[currentLang]?.noSessionData || "Немає даних про сесії"}</div>
                )}

                {sessions.length > 1 && (
                    <button 
                        onClick={handleLogoutAllSessions} 
                        style={{ width: '100%', padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', fontWeight: 'bold', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.3s' }} 
                        className="menu-hover"
                    >
                        <AlertTriangle size={18} /> {t[currentLang]?.logoutAllSessions || "Завершити всі інші сеанси"}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div style={{ ...overlay, zIndex: 9999 }}>
            <div className="fade-in-up modal-pop" style={{ ...modalBox('500px', { overflow: 'hidden' }) }}>
                
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {activeTab !== 'main' && (
                            <button onClick={() => setActiveTab('main')} style={{ ...closeBtn, position: 'static', marginRight: '4px' }}><ChevronLeft size={16} /></button>
                        )}
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: C.text }}>
                            {activeTab === 'main' ? (t[currentLang]?.settingsTitle || "Налаштування") : 
                             activeTab === 'security' ? (t[currentLang]?.tabSecurity || "Безпека") :
                             activeTab === 'notifications' ? (t[currentLang]?.tabNotif || "Сповіщення") :
                             activeTab === 'sessions' ? (t[currentLang]?.tabSessions || "Активні сесії") : ""}
                        </h2>
                    </div>
                    <button onClick={() => setShowSettingsModal(false)} style={closeBtn}><X size={16} /></button>
                </div>

                <div ref={scrollRef} style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }} className="custom-scrollbar">
                    {activeTab === 'main' && renderMain()}
                    {activeTab === 'security' && renderSecurity()}
                    {activeTab === 'notifications' && renderNotifications()}
                    {activeTab === 'sessions' && renderSessions()}
                </div>


            </div>
        </div>
    );
};

export default SettingsModal;