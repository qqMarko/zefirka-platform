import React, { useState } from 'react';
import { X, Shield, Bell, Monitor, LogOut, ChevronRight, ChevronLeft, Lock, Smartphone, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import { toast } from 'react-hot-toast';

const SettingsModal = ({ setShowSettingsModal, t, currentLang, accent, handleLogout }) => {
    const [activeTab, setActiveTab] = useState('main'); 
    
    const { pushEnabled, togglePushEnabled, userUniqueId, user } = useStore();

    // 🚀 СТАТУС EMAIL СПОВІЩЕНЬ ЗІ STORE
    const [emailNotif, setEmailNotif] = useState(user?.emailNotifications !== false); // За замовчуванням true, якщо не вказано false

    // 🚀 СТАТУС 2FA
    const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);

    const handleToggle2FA = async () => {
        const newStatus = !twoFactor;
        setTwoFactor(newStatus); 
        const loadingToast = toast.loading('Оновлення налаштувань...');

        try {
            // 🚀 ДИНАМІЧНИЙ IP
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/auth/toggle-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, enabled: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`2FA ${newStatus ? 'увімкнено' : 'вимкнено'}!`, { id: loadingToast });
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

    // 🚀 НОВА ФУНКЦІЯ: ЗБЕРЕЖЕННЯ EMAIL СПОВІЩЕНЬ
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
                toast.success(`Розсилку ${newStatus ? 'увімкнено' : 'вимкнено'}!`, { id: loadingToast });
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
            // 🚀 ДИНАМІЧНИЙ IP ТУТ ТЕЖ!
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
                <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16} color={accent}/> Зміна пароля</h3>
                
                <form onSubmit={handlePasswordChange}>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input required type={showOld ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Поточний пароль" style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#050508', border: '1px solid #222', color: 'white', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        <div onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input required type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новий пароль" style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#050508', border: '1px solid #222', color: 'white', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        <div onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                        <input required type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Повторіть новий пароль" style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#050508', border: '1px solid #222', color: 'white', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        <div onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#888' }} className="menu-hover">
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>
                    
                    <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '12px', background: accent, border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer' }} className="menu-hover">
                        {isSaving ? 'ЗБЕРЕЖЕННЯ...' : 'Зберегти пароль'}
                    </button>
                </form>
            </div>
            
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Двофакторна автентифікація (2FA)</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Додатковий захист вашого акаунту</div>
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
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} color="#ffc107"/> Email сповіщення</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Отримувати листи про нові повідомлення</div>
                </div>
                {/* 🚀 ОЖИВЛЕНИЙ ТУМБЛЕР EMAIL СПОВІЩЕНЬ */}
                <div onClick={handleToggleEmail} style={{ width: '44px', height: '24px', background: emailNotif ? '#ffc107' : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: emailNotif ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
            
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={16} color="#ffc107"/> Push-сповіщення</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Сповіщення в браузері та дзвіночок</div>
                </div>
                <div onClick={togglePushEnabled} style={{ width: '44px', height: '24px', background: pushEnabled ? '#ffc107' : '#333', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '4px', left: pushEnabled ? '24px' : '4px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                </div>
            </div>
        </div>
    );

    const renderSessions = () => (
        <div className="fade-in-up">
            <div style={{ background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.2)', padding: '20px', borderRadius: '12px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Monitor size={28} color="#00ffff" />
                        <div>
                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Windows • Chrome</div>
                            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Івано-Франківськ, Україна</div>
                        </div>
                    </div>
                    <div style={{ color: '#00ffff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0, 255, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>Поточна</div>
                </div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '15px' }}>IP: 176.104.55.12 • Активно зараз</div>
            </div>

            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Smartphone size={28} color="#888" />
                        <div>
                            <div style={{ color: '#ccc', fontWeight: 'bold', fontSize: '14px' }}>iPhone 13 • Safari</div>
                            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Львів, Україна</div>
                        </div>
                    </div>
                </div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '15px' }}>IP: 46.211.34.8 • Був у мережі: Вчора, 14:30</div>
            </div>

            <button style={{ width: '100%', padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', fontWeight: 'bold', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.3s' }} className="menu-hover">
                <AlertTriangle size={18} /> Завершити всі інші сеанси
            </button>
        </div>
    );

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