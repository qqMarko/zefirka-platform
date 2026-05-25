import React, { useState, useEffect } from 'react';
import { X, Shield, Bell, Monitor, LogOut, ChevronRight, ChevronLeft, Lock, Smartphone, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import { toast } from 'react-hot-toast';

const SettingsModal = ({ setShowSettingsModal, t, currentLang, accent, handleLogout }) => {
    const [activeTab, setActiveTab] = useState('main'); 
    
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
        const newStatus = !twoFactor;
        setTwoFactor(newStatus); 
        const loadingToast = toast.loading('Оновлення налаштувань...');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/toggle-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, enabled: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`2FA ${newStatus ? (t[currentLang]?.enabled || 'увімкнено') : (t[currentLang]?.disabled || 'вимкнено')}!`, { id: loadingToast });
                useStore.getState().setUser({ twoFactorEnabled: newStatus });
                localStorage.setItem('zefirka_2fa', newStatus);
            } else {
                setTwoFactor(!newStatus); 
                toast.error('Помилка оновлення', { id: loadingToast });
            }
        } catch (error) {
            setTwoFactor(!newStatus);
            toast.error('Помилка сервера', { id: loadingToast });
        }
    };

    const handleToggleEmail = async () => {
        const newStatus = !emailNotif;
        setEmailNotif(newStatus);
        const loadingToast = toast.loading('Оновлення налаштувань...');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/toggle-email-notif`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, enabled: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`${t[currentLang]?.emailNotif || 'Email'} ${newStatus ? (t[currentLang]?.enabled || 'увімкнено') : (t[currentLang]?.disabled || 'вимкнено')}!`, { id: loadingToast });
                useStore.getState().setUser({ emailNotifications: newStatus });
                localStorage.setItem('zefirka_emailNotif', newStatus);
            } else {
                setEmailNotif(!newStatus);
                toast.error('Помилка оновлення', { id: loadingToast });
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
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, oldPassword, newPassword })
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
                <div onClick={() => setActiveTab('security')} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} className="menu-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Shield size={20} color={accent} />
                        <span style={{ color: 'white', fontWeight: '500' }}>{t[currentLang]?.tabSecurity || "Безпека"}</span>
                    </div>
                    <ChevronRight size={18} color="#444" />
                </div>

                <div onClick={() => setActiveTab('notifications')} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} className="menu-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Bell size={20} color="#ffc107" />
                        <span style={{ color: 'white', fontWeight: '500' }}>{t[currentLang]?.tabNotif || "Сповіщення"}</span>
                    </div>
                    <ChevronRight size={18} color="#444" />
                </div>

                <div onClick={() => setActiveTab('sessions')} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} className="menu-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Monitor size={20} color="#00ffff" />
                        <span style={{ color: 'white', fontWeight: '500' }}>{t[currentLang]?.tabSessions || "Активні сесії"}</span>
                    </div>
                    <ChevronRight size={18} color="#444" />
                </div>
            </div>

            <button 
                onClick={handleLogout}
                style={{ width: '100%', marginTop: '30px', padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                className="menu-hover"
            >
                <LogOut size={18} /> {t[currentLang]?.logout || "Вийти"}
            </button>
        </>
    );

    const renderSecurity = () => (
        <div className="fade-in-up">
            <div style={{ marginBottom: '20px', background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16} color={accent}/> {t[currentLang]?.changePassword || "Зміна пароля"}</h3>
                
                <form onSubmit={handlePasswordChange}>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input required type={showOld ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={t[currentLang]?.currentPassword || "Поточний пароль"} style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#050508', border: '1px solid #222', color: 'white', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        <div onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input required type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t[currentLang]?.newPassword || "Новий пароль"} style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#050508', border: '1px solid #222', color: 'white', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        <div onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                        <input required type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t[currentLang]?.confirmPassword || "Повторіть новий пароль"} style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#050508', border: '1px solid #222', color: 'white', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        <div onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>
                    
                    <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '12px', background: accent, border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer' }} className="menu-hover">
                        {isSaving ? (t[currentLang]?.savingPassword || 'ЗБЕРЕЖЕННЯ...') : (t[currentLang]?.savePassword || 'Зберегти пароль')}
                    </button>
                </form>
            </div>
            
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>{t[currentLang]?.twoFactor || "Двофакторна автентифікація (2FA)"}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{t[currentLang]?.twoFactorDesc || "Додатковий захист вашого акаунту"}</div>
                </div>
                <div onClick={handleToggle2FA} style={{ width: '44px', height: '24px', background: twoFactor ? accent : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: twoFactor ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="fade-in-up" style={{ display: 'grid', gap: '15px' }}>
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} color="#ffc107"/> {t[currentLang]?.emailNotif || "Email сповіщення"}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{t[currentLang]?.emailNotifDesc || "Отримувати листи про нові повідомлення"}</div>
                </div>
                <div onClick={handleToggleEmail} style={{ width: '44px', height: '24px', background: emailNotif ? '#ffc107' : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: emailNotif ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
            
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={16} color="#ffc107"/> {t[currentLang]?.pushNotif || "Push-сповіщення"}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{t[currentLang]?.pushNotifDesc || "Сповіщення в браузері та дзвіночок"}</div>
                </div>
                <div onClick={togglePushEnabled} style={{ width: '44px', height: '24px', background: pushEnabled ? '#ffc107' : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="fade-in-up" style={{ width: '100%', maxWidth: '500px', background: '#0a0a0f', border: `1px solid ${accent}44`, borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: `0 20px 60px rgba(0,0,0,0.9)` }}>
                
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {activeTab !== 'main' && (
                            <div onClick={() => setActiveTab('main')} style={{ background: '#1a1a1a', padding: '5px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="menu-hover">
                                <ChevronLeft size={20} color="white" />
                            </div>
                        )}
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                            {activeTab === 'main' ? (t[currentLang]?.settingsTitle || "Налаштування") : 
                             activeTab === 'security' ? (t[currentLang]?.tabSecurity || "Безпека") :
                             activeTab === 'notifications' ? (t[currentLang]?.tabNotif || "Сповіщення") :
                             activeTab === 'sessions' ? (t[currentLang]?.tabSessions || "Активні сесії") : ""}
                        </h2>
                    </div>
                    <X onClick={() => setShowSettingsModal(false)} style={{ cursor: 'pointer', color: '#888' }} className="menu-hover" />
                </div>

                <div style={{ padding: '25px', maxHeight: '70vh', overflowY: 'auto' }} className="custom-scrollbar">
                    {activeTab === 'main' && renderMain()}
                    {activeTab === 'security' && renderSecurity()}
                    {activeTab === 'notifications' && renderNotifications()}
                    {activeTab === 'sessions' && renderSessions()}
                </div>

                {activeTab === 'main' && (
                    <div onClick={() => setShowSettingsModal(false)} style={{ padding: '15px', textAlign: 'center', color: '#555', fontSize: '12px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.02)' }} className="menu-hover">
                        {t[currentLang]?.close || "Закрити"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;