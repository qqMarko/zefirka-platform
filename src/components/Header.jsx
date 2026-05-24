import React, { useState } from 'react';
import { 
    User, Plus, ShieldCheck, AlertTriangle, Bell, 
    UserCircle, LogOut, Settings, Wallet, Crown, MessageCircle, Copy, Lock 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore'; // 🔥 ДОДАНО: Підключаємо глобальний стан для перевірки VIP

// --- КОМПОНЕНТ БАТАРЕЇ ДОВІРИ ---
const TrustBattery = ({ score, t, currentLang }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const getColor = (s) => {
        if (s >= 80) return { main: '#4caf50', bg: 'rgba(76, 175, 80, 0.15)', glow: 'rgba(76, 175, 80, 0.4)' };
        if (s >= 50) return { main: '#ffc107', bg: 'rgba(255, 193, 7, 0.15)', glow: 'rgba(255, 193, 7, 0.4)' };
        return { main: '#ff4444', bg: 'rgba(255, 68, 68, 0.15)', glow: 'rgba(255, 68, 68, 0.4)' };
    };
    
    const colors = getColor(score);
    const isPulsing = score < 30;
    
    return (
        <div 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)} 
            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '5px' }}
        >
            <div 
                style={{ 
                    position: 'relative', width: '36px', height: '36px', borderRadius: '50%', 
                    background: '#111', border: `2px solid ${colors.bg}`, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${colors.glow}`, 
                    animation: isPulsing ? 'pulseAlert 1.5s infinite' : 'none', transition: 'all 0.3s ease' 
                }} 
                className="menu-hover"
            >
                <svg width="32" height="32" viewBox="0 0 36 36" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={colors.main} strokeWidth="3" strokeDasharray={`${score}, 100`} style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                </svg>
                {score >= 50 ? <ShieldCheck size={16} color={colors.main} style={{ zIndex: 2 }} /> : <AlertTriangle size={16} color={colors.main} style={{ zIndex: 2 }} />}
            </div>
            
            {isHovered && (
                <div className="fade-in-up" style={{ position: 'absolute', top: 'calc(100% + 15px)', right: '-10px', background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(10px)', border: `1px solid ${colors.main}55`, borderRadius: '16px', padding: '20px', width: '220px', zIndex: 10000, boxShadow: `0 15px 40px rgba(0,0,0,0.9), 0 0 20px ${colors.glow}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'absolute', top: '-6px', right: '22px', width: '12px', height: '12px', background: 'rgba(10, 10, 15, 0.95)', borderTop: `1px solid ${colors.main}55`, borderLeft: `1px solid ${colors.main}55`, transform: 'rotate(45deg)' }}></div>
                    <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{t[currentLang]?.trustScore || 'Рейтинг Довіри'}</div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: colors.main, lineHeight: '1', textShadow: `0 0 15px ${colors.glow}` }}>{score}%</div>
                    <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.4', marginTop: '5px' }}>{t[currentLang]?.trustSystemDesc || 'Показник вашої надійності на платформі'}</div>
                    <div style={{ width: '100%', height: '4px', background: '#222', borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}><div style={{ width: `${score}%`, height: '100%', background: colors.main, transition: 'width 1s ease-out' }}></div></div>
                </div>
            )}
        </div>
    );
};

const Header = ({
    isMenuOpen, setIsMenuOpen, isLoggedIn, userRole, openCreate, setShowAuth,
    navigate, setCatalogPage, currentLang, setCurrentLang, accent, trustScore, t,
    unreadNotifs, showNotifDropdown, setShowNotifDropdown, markNotificationsAsRead,
    notifications, email, userUniqueId, showUserDropdown, setShowUserDropdown,
    setShowVipModal, setShowWalletModal, setShowSettingsModal, hasActiveDisputeAlert,
    setHasActiveDisputeAlert, setShowSupport, handleLogout, user, hasDisputeAccess
}) => {

    // hasDisputeAccess приходить як пропс з ZefirLanding — вже boolean

    return (
        <header className="main-header" style={{ flexShrink: 0, position: 'sticky', top: '15px', zIndex: 3000, width: '100%', maxWidth: '1600px', margin: '0 auto 50px auto', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(10px, 3vw, 30px)', boxSizing: 'border-box', background: 'rgba(5, 5, 8, 0.95)', backdropFilter: 'blur(12px)', border: `1px solid rgba(233, 30, 99, 0.2)`, borderRadius: '20px', boxShadow: `0 10px 30px -5px rgba(233, 30, 99, 0.25)` }}>
                    
            <div style={{ flex: 1, display: 'flex', gap: 'clamp(8px, 2vw, 20px)', alignItems: 'center', position: 'relative', zIndex: 3001 }}>
                <div className="premium-burger-wrapper" onClick={() => setIsMenuOpen(true)} style={{ '--burger-accent': accent }}><div className="premium-burger"><div className="line"></div><div className="line"></div><div className="line"></div></div></div>
                {(!isLoggedIn || userRole === 'model') && (<button className="premium-create-btn" onClick={() => isLoggedIn ? openCreate() : setShowAuth(true)}> <Plus size={18} strokeWidth={3} /> <span className="hide-mobile-text">{t[currentLang]?.create}</span></button>)}
            </div>
            
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(20px, 4.5vw, 32px)', cursor: 'pointer', zIndex: 3005, whiteSpace: 'nowrap', fontFamily: "inherit", fontStyle: 'italic', fontWeight: '900', letterSpacing: 'clamp(1px, 1vw, 4px)', color: '#fff', textTransform: 'uppercase' }} onClick={() => {navigate('/'); setCatalogPage(1);}} className="logo-glow mobile-logo"> 
                <span style={{ color: accent }}>Z</span>EFIRKA 
            </div>
            
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 3001 }}>
                
                <div className="hide-mobile-text">
                    <div className="header-lang-selector" style={{ display: 'flex', gap: '15px', fontSize: '14px', fontWeight: '600', marginRight: '5px' }}>
                        {['UA', 'EN', 'RU'].map(l => ( <span key={l} onClick={() => setCurrentLang(l)} style={{ cursor: 'pointer', color: currentLang === l ? accent : '#888', transition: 'color 0.2s' }} className="menu-hover">{l}</span> ))}
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
                    {isLoggedIn && <TrustBattery score={trustScore} t={t} currentLang={currentLang} />}
                    
                    {isLoggedIn && (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ cursor: 'pointer', position: 'relative', padding: '2px' }} onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowUserDropdown(false); if(unreadNotifs > 0) markNotificationsAsRead(); }}>
                                <Bell size={24} color={unreadNotifs > 0 ? accent : 'white'} style={{ animation: unreadNotifs > 0 ? 'pulseAlert 2s infinite' : 'none' }} className="menu-hover" />
                                {unreadNotifs > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: '#ff4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px', border: '2px solid #050508' }}>{unreadNotifs}</span>}
                            </div>
                            
                            {showNotifDropdown && (
                                <div className="fade-in-up custom-scrollbar" style={{ position: 'absolute', top: '55px', right: '-40px', width: '320px', maxHeight: '400px', overflowY: 'auto', background: 'rgba(5, 5, 8, 0.98)', backdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,0.1)`, zIndex: 4000, boxShadow: `0 15px 40px rgba(0,0,0,0.9)`, borderRadius: '16px', padding: '10px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', padding: '10px', color: 'white', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Сповіщення</h3>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>Немає нових сповіщень</div>
                                    ) : (
                                        notifications.map((n, i) => (
                                            <div key={i} style={{ padding: '12px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#ccc', lineHeight: '1.4', background: n.isRead ? 'transparent' : `${accent}22`, borderRadius: '8px' }}>
                                                {n.text}
                                                <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>{new Date(n.date).toLocaleString()}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative', marginLeft: '4px' }}>
                    <UserCircle size={30} color={isLoggedIn ? accent : 'white'} onClick={() => { isLoggedIn ? setShowUserDropdown(!showUserDropdown) : setShowAuth(true); setShowNotifDropdown(false); }} className="menu-hover mobile-user" style={{ cursor: 'pointer', strokeWidth: '1.5px' }} />
                    
                        {isLoggedIn && showUserDropdown && (
<div className="fade-in-up custom-scrollbar" style={{ position: 'absolute', top: '55px', right: '-10px', width: '290px', maxHeight: '80vh', overflowY: 'auto', background: 'rgba(5, 5, 8, 0.95)', backdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,0.08)`, zIndex: 4000, boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 5px 15px rgba(233, 30, 99, 0.15)`, borderRadius: '20px', padding: '12px' }}>
    
    {/* ВЕРХНІЙ БЛОК ПРОФІЛЮ */}
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: '800', paddingLeft: '4px' }}>
            {t[currentLang]?.loginAs || 'Особистий кабінет'}
        </div>
        
        <div 
            onClick={() => {navigate('/cabinet'); setShowUserDropdown(false)}}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', 
                padding: '12px', borderRadius: '16px', 
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
            }} 
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)';
                e.currentTarget.style.border = `1px solid rgba(255,255,255,0.15)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            title="Перейти в кабінет"
        >
            <div style={{
                width: '46px', height: '46px', borderRadius: '50%', 
                background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                flexShrink: 0, border: `1px solid ${accent}55`,
                boxShadow: `inset 0 0 10px ${accent}22, 0 0 15px ${accent}11`
            }}>
                <User size={22} color={accent}/>
            </div>
            
<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{
        color: '#fff', fontWeight: '800', fontSize: '15px', 
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', 
        letterSpacing: '0.3px', lineHeight: '1'
    }}>
        {email || 'User'}
    </div>
    
    <div 
        onClick={(e) => {
            e.stopPropagation(); 
            if (userUniqueId) {
                navigator.clipboard.writeText(userUniqueId);
                toast.success('ID скопійовано!', { 
                    style: { background: '#222', color: '#fff', border: `1px solid ${accent}55`, borderRadius: '12px' },
                    iconTheme: { primary: accent, secondary: '#fff' }
                });
            }
        }}
        style={{
            fontSize: '11px', color: '#aaa', fontWeight: '700', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(0,0,0,0.4)', padding: '5px 10px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)', 
            maxWidth: '100%', boxSizing: 'border-box',
            transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            e.currentTarget.style.color = '#aaa';
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
        }}
        title="Скопіювати ID"
    >
        <span style={{ opacity: 0.6, flexShrink: 0 }}>ID:</span> 
        
        <span style={{ 
            color: accent, letterSpacing: '0.5px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
            {userUniqueId}
        </span>
        
        <Copy size={12} style={{ marginLeft: '2px', opacity: 0.8, flexShrink: 0 }} />
    </div>
</div>
            </div>
        </div>
        
                                    <div style={{ display: 'grid', gap: '4px' }}>
                                        <div style={{ padding: '10px 15px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }} className="dropdown-item-hover" onClick={() => {setShowVipModal(true); setShowUserDropdown(false)}}><Crown size={18} color="#ffc107"/> {userRole === 'model' ? (t[currentLang]?.vip || 'VIP статус') : (t[currentLang]?.clientPremium || 'Преміум')}</div>
                                        <div style={{ padding: '10px 15px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }} className="dropdown-item-hover" onClick={() => {setShowWalletModal(true); setShowUserDropdown(false);}}><Wallet size={18}/> {t[currentLang]?.wallet || 'Гаманець'}</div>
                                        <div style={{ padding: '10px 15px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }} className="dropdown-item-hover" onClick={() => {setShowSettingsModal(true); setShowUserDropdown(false);}}><Settings size={18}/> {t[currentLang]?.settings || 'Налаштування'}</div>
                                        
                                        {/* АРБІТРАЖ — доступний тільки з VIP */}
                                        {hasDisputeAccess ? (
                                            <div
                                                style={{ padding: '10px 15px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600', position: 'relative' }}
                                                className="dropdown-item-hover"
                                                onClick={() => { navigate('/disputes'); setShowUserDropdown(false); setHasActiveDisputeAlert(false); }}
                                            >
                                                <AlertTriangle size={18}/>
                                                <span>{t[currentLang]?.dispTab || 'Арбітраж (Спори)'}</span>
                                                {hasActiveDisputeAlert && <span style={{ position: 'absolute', right: '15px', width: '10px', height: '10px', background: '#ff4444', borderRadius: '50%', boxShadow: '0 0 10px #ff4444' }}></span>}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'default', userSelect: 'none', opacity: 0.35, pointerEvents: 'none' }}>
                                                <Lock size={18} color="#666"/>
                                                <span style={{ color: '#555' }}>{t[currentLang]?.dispTab || 'Арбітраж (Спори)'}</span>
                                                <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: '800', color: '#444', background: '#111', border: '1px solid #2a2a2a', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>VIP</span>
                                            </div>
                                        )}
                                        
                                        <div style={{ padding: '10px 15px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }} className="dropdown-item-hover" onClick={() => {setShowSupport(true); setShowUserDropdown(false);}}><MessageCircle size={18}/> {t[currentLang]?.support || 'Підтримка'}</div>
                                    </div>
        
                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ padding: '10px 15px', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }} className="dropdown-item-hover-red" onClick={handleLogout}><LogOut size={18} color="#ff4444"/> {t[currentLang]?.logout || 'Вийти'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
        </header>
    );
};

export default Header;