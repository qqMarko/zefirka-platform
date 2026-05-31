import React, { useState, useRef } from 'react';
import { 
    User, Plus, ShieldCheck, AlertTriangle, Bell, 
    LogOut, Settings, Wallet, Crown, MessageCircle, Copy, Lock,
    Trash2, BellOff, CheckCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';

// ── Утиліта: відносний час ───────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'щойно';
    if (m < 60) return `${m} хв тому`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} год тому`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d} дн тому`;
    return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

// ── Тип сповіщення → колір + іконка ────────────────────────────
function getNotifStyle(text = '') {
    const t = text.toLowerCase();
    if (t.includes('💎') || t.includes('diamond'))                        return { color: '#00ffff', bg: 'rgba(0,255,255,0.07)',   icon: '💎' };
    if (t.includes('👑') || t.includes('premium'))                        return { color: '#ffd700', bg: 'rgba(255,215,0,0.07)',   icon: '👑' };
    if (t.includes('⭐') || t.includes('start'))                          return { color: '#ff69b4', bg: 'rgba(255,0,127,0.07)',   icon: '⭐' };
    if (t.includes('🎁') || t.includes('знижк'))                          return { color: '#a855f7', bg: 'rgba(168,85,247,0.07)',  icon: '🎁' };
    if (t.includes('🚀') || t.includes('підня'))                          return { color: '#ff9800', bg: 'rgba(255,152,0,0.07)',   icon: '🚀' };
    if (t.includes('💳') || t.includes('балан') || t.includes('поповн')) return { color: '#4caf50', bg: 'rgba(76,175,80,0.07)',   icon: '💳' };
    if (t.includes('✅') || t.includes('схвал') || t.includes('опублік')) return { color: '#4caf50', bg: 'rgba(76,175,80,0.07)',   icon: '✅' };
    if (t.includes('🛑') || t.includes('блок') || t.includes('бан'))      return { color: '#ff4444', bg: 'rgba(255,68,68,0.07)',   icon: '🛑' };
    if (t.includes('⚠️') || t.includes('закінч') || t.includes('термін')) return { color: '#ffb300', bg: 'rgba(255,179,0,0.07)',   icon: '⚠️' };
    if (t.includes('💸') || t.includes('штраф'))                          return { color: '#ff4444', bg: 'rgba(255,68,68,0.07)',   icon: '💸' };
    if (t.includes('📢'))                                                  return { color: '#e91e63', bg: 'rgba(233,30,99,0.07)',   icon: '📢' };
    return { color: '#888', bg: 'rgba(255,255,255,0.04)', icon: '🔔' };
}

// ── Компонент дропдауну сповіщень ───────────────────────────────
const NotifDropdown = ({ notifications, accent, onDelete, onClearAll, t, currentLang }) => {
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div
            className="fade-in-up"
            style={{
                position: 'absolute', top: '55px', right: '-40px',
                width: '340px', zIndex: 4000,
                background: 'rgba(5,5,10,0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 0 0.5px rgba(255,255,255,0.04)',
                overflow: 'hidden',
            }}
        >
            {/* Шапка */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={16} color={accent} />
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '0.3px' }}>
                        {t?.[currentLang]?.notifTitle || 'Сповіщення'}
                    </span>
                    {notifications.length > 0 && (
                        <span style={{
                            background: `${accent}22`, color: accent,
                            fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 20,
                            border: `1px solid ${accent}33`,
                        }}>
                            {notifications.length}
                        </span>
                    )}
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={onClearAll}
                        {...{title: t?.[currentLang]?.notifClear || "Очистити"}}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'rgba(255,68,68,0.08)',
                            border: '1px solid rgba(255,68,68,0.2)',
                            color: '#ff6666', fontSize: 11, fontWeight: 700,
                            padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,68,68,0.18)'; e.currentTarget.style.color='#ff4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,68,68,0.08)'; e.currentTarget.style.color='#ff6666'; }}
                    >
                        <Trash2 size={11} /> {t?.[currentLang]?.notifClear || "Очистити"}
                    </button>
                )}
            </div>

            {/* Список */}
            <div
                style={{
                    maxHeight: 380,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth',
                    padding: '8px 10px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${accent}44 transparent`,
                }}
                className="notif-scroll-list"
                onWheel={e => e.stopPropagation()}
            >
                <style>{`
                    .notif-scroll-list::-webkit-scrollbar { width: 4px; }
                    .notif-scroll-list::-webkit-scrollbar-track { background: transparent; }
                    .notif-scroll-list::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; transition: background 0.3s; }
                    .notif-scroll-list:hover::-webkit-scrollbar-thumb { background: ${accent}55; }
                    .notif-scroll-list::-webkit-scrollbar-thumb:hover { background: ${accent}99 !important; }
                    .notif-item-row { transition: background 0.15s, transform 0.15s; }
                    .notif-item-row:hover { transform: translateX(2px); }
                    .notif-del-btn { opacity: 0; transition: opacity 0.15s; }
                    .notif-item-row:hover .notif-del-btn { opacity: 1; }
                `}</style>

                {notifications.length === 0 ? (
                    <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <BellOff size={34} color="#2a2a2a" />
                        <span style={{ color: '#444', fontSize: 13, fontWeight: 600 }}>{t?.[currentLang]?.notifEmpty || 'Сповіщень поки немає'}</span>
                    </div>
                ) : (
                    notifications.map((n) => {
                        const id = n._id || n.id;
                        const ns = getNotifStyle(n.text);
                        return (
                            <div
                                key={id}
                                className="notif-item-row"
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '10px 10px',
                                    marginBottom: 4,
                                    borderRadius: 12,
                                    background: n.isRead ? 'transparent' : ns.bg,
                                    border: n.isRead ? '1px solid transparent' : `1px solid ${ns.color}22`,
                                    position: 'relative',
                                }}
                                onMouseEnter={() => setHoveredId(id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Кольорова ліва смужка (непрочитане) */}
                                {!n.isRead && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 3, height: '60%',
                                        background: ns.color,
                                        borderRadius: '0 3px 3px 0',
                                        boxShadow: `0 0 6px ${ns.color}88`,
                                    }} />
                                )}

                                {/* Іконка */}
                                <div style={{
                                    flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                                    background: ns.bg, border: `1px solid ${ns.color}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 15, marginLeft: n.isRead ? 0 : 6,
                                }}>
                                    {ns.icon}
                                </div>

                                {/* Текст */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 12.5, lineHeight: 1.45, wordBreak: 'break-word',
                                        color: n.isRead ? '#888' : '#ddd',
                                        fontWeight: n.isRead ? 400 : 600,
                                    }}>
                                        {n.text}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: '#555', marginTop: 4, fontWeight: 500 }}>
                                        {timeAgo(n.date)}
                                    </div>
                                </div>

                                {/* Кнопка видалення (з'являється при hover) */}
                                <button
                                    className="notif-del-btn"
                                    onClick={() => onDelete(id)}
                                    title={t?.[currentLang]?.notifDelete || "Видалити"}
                                    style={{
                                        flexShrink: 0,
                                        background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                                        borderRadius: 7, padding: '5px 6px', cursor: 'pointer', color: '#ff6666',
                                        display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,68,68,0.25)'; e.currentTarget.style.color='#ff4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,68,68,0.1)';  e.currentTarget.style.color='#ff6666'; }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Футер */}
            {notifications.length > 0 && (
                <div style={{
                    padding: '10px 18px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <CheckCheck size={13} color="#555" />
                    <span style={{ fontSize: 11, color: '#555' }}>
                        {notifications.filter(n => !n.isRead).length > 0
                            ? `${notifications.filter(n => !n.isRead).length} ${t?.[currentLang]?.notifUnread || 'непрочитаних'}`
                            : (t?.[currentLang]?.notifAllRead || 'Всі прочитані')}
                    </span>
                </div>
            )}
        </div>
    );
};

// --- КОМПОНЕНТ БАТАРЕЇ ДОВІРИ ---
const TrustBattery = ({ score, t, currentLang }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const getColor = (s) => {
        if (s >= 80) return { main: '#4caf50', bg: 'rgba(76,175,80,0.15)', glow: 'rgba(76,175,80,0.5)', pill: 'rgba(76,175,80,0.12)' };
        if (s >= 50) return { main: '#ffc107', bg: 'rgba(255,193,7,0.15)',  glow: 'rgba(255,193,7,0.5)',  pill: 'rgba(255,193,7,0.12)' };
        return       { main: '#ff4444', bg: 'rgba(255,68,68,0.15)',  glow: 'rgba(255,68,68,0.5)',  pill: 'rgba(255,68,68,0.12)' };
    };
    
    const colors = getColor(score);
    const isPulsing = score < 30;
    
    return (
        <div 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)} 
            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
            {/* Compact pill button — isolation:isolate prevents backdrop-filter blur leak */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '5px 11px 5px 6px', borderRadius: '11px',
                background: colors.pill, 
                border: `1px solid ${colors.main}55`,
                boxShadow: `0 0 0 1px ${colors.main}11`,
                animation: isPulsing ? 'pulseAlert 1.5s infinite' : 'none',
                transition: 'background 0.2s ease, border-color 0.2s ease',
                isolation: 'isolate',
                willChange: 'transform',
            }}>
                {/* SVG arc — 36×36 matches viewBox exactly to prevent scaling blur */}
                <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                    <svg
                        width="28" height="28" viewBox="0 0 36 36"
                        style={{ transform: 'rotate(-90deg)', display: 'block', shapeRendering: 'geometricPrecision' }}
                    >
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="14" fill="none"
                            stroke={colors.main} strokeWidth="3.5"
                            strokeDasharray={`${score * 0.879645943}, 100`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s ease-out' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        {score >= 50
                            ? <ShieldCheck size={12} color={colors.main} strokeWidth={2.5} style={{ display: 'block' }} />
                            : <AlertTriangle size={11} color={colors.main} strokeWidth={2.5} style={{ display: 'block' }} />
                        }
                    </div>
                </div>
                <span style={{
                    fontSize: '13px', fontWeight: '900', color: colors.main,
                    letterSpacing: '-0.3px', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>{score}%</span>
            </div>
            
            {/* Tooltip */}
            {isHovered && (
                <div className="fade-in-up" style={{
                    position: 'absolute', top: 'calc(100% + 12px)', right: '-8px',
                    background: 'rgba(8,8,13,0.97)', backdropFilter: 'blur(16px)',
                    border: `1px solid ${colors.main}44`, borderRadius: '16px',
                    padding: '18px', width: '200px', zIndex: 10000,
                    boxShadow: `0 20px 50px rgba(0,0,0,0.95), 0 0 20px ${colors.glow}22`,
                    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ position: 'absolute', top: '-5px', right: '18px', width: '10px', height: '10px', background: 'rgba(8,8,13,0.97)', borderTop: `1px solid ${colors.main}44`, borderLeft: `1px solid ${colors.main}44`, transform: 'rotate(45deg)' }} />
                    <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '800' }}>{t[currentLang]?.trustScore || 'Trust Score'}</div>
                    <div style={{ fontSize: '38px', fontWeight: '900', color: colors.main, lineHeight: '1', textShadow: `0 0 20px ${colors.glow}` }}>{score}<span style={{ fontSize: '18px' }}>%</span></div>
                    <div style={{ fontSize: '11px', color: '#777', lineHeight: '1.5', marginTop: '2px' }}>{t[currentLang]?.trustSystemDesc || 'Показник надійності'}</div>
                    <div style={{ width: '100%', height: '5px', background: '#1a1a1a', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${colors.main}88, ${colors.main})`, transition: 'width 1s ease-out', borderRadius: '3px', boxShadow: `0 0 8px ${colors.main}` }} />
                    </div>
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
    setHasActiveDisputeAlert, setShowSupport, handleLogout, user, hasDisputeAccess,
    setShowLoungeModal
}) => {

    const { deleteNotification, clearAllNotifications } = useStore();

    return (
        <header className="main-header" style={{ flexShrink: 0, position: 'sticky', top: '15px', zIndex: 3000, width: '100%', maxWidth: '1600px', margin: '0 auto 50px auto', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(10px, 3vw, 30px)', boxSizing: 'border-box', background: 'rgba(10, 10, 20, 0.97)', backdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '20px', boxShadow: `0 8px 32px rgba(0,0,0,0.6)` }}>
                    
            <div style={{ flex: 1, display: 'flex', gap: 'clamp(8px, 2vw, 20px)', alignItems: 'center', position: 'relative', zIndex: 3001 }}>
                <div className="premium-burger-wrapper" onClick={() => setIsMenuOpen(true)} style={{ '--burger-accent': accent }}><div className="premium-burger"><div className="line"></div><div className="line"></div><div className="line"></div></div></div>
                {(!isLoggedIn || userRole === 'model') && (<button className="premium-create-btn" onClick={() => isLoggedIn ? openCreate() : setShowAuth(true)}> <Plus size={18} strokeWidth={3} /> <span className="hide-mobile-text">{t[currentLang]?.create}</span></button>)}
            </div>
            
            <div
                style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 3005, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                onClick={() => { navigate('/'); setCatalogPage(1); }}
            >
                <span style={{
                    fontSize: 'clamp(18px, 4vw, 28px)',
                    fontWeight: '900',
                    fontStyle: 'italic',
                    letterSpacing: 'clamp(2px, 1vw, 6px)',
                    textTransform: 'uppercase',
                    fontFamily: 'inherit',
                    background: 'linear-gradient(135deg, #ffffff 0%, #ccccdd 60%, #9999bb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))',
                    transition: 'filter 0.25s ease',
                    display: 'inline-block',
                    className: 'mobile-logo',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'drop-shadow(0 0 14px rgba(255,255,255,0.3))'}
                onMouseLeave={e => e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.15))'}
                >
                    <span style={{ WebkitTextFillColor: accent, filter: `drop-shadow(0 0 6px ${accent}88)` }}>Z</span>EFIRKA
                </span>
            </div>
            
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 3001 }}>
                
                {/* ── LANGUAGE SWITCHER — isolation prevents backdrop-filter blur leak ── */}
                <div className="hide-mobile-text" style={{ isolation: 'isolate' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'rgba(20,20,28,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '3px', marginRight: '4px',
                        isolation: 'isolate',
                    }}>
                        {['UA', 'EN', 'RU'].map(l => (
                            <button key={l} onClick={() => setCurrentLang(l)} style={{
                                cursor: 'pointer', border: 'none', outline: 'none', fontFamily: 'inherit',
                                padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900',
                                letterSpacing: '0.8px', transition: 'background 0.18s ease, color 0.18s ease',
                                background: currentLang === l ? accent : 'transparent',
                                color: currentLang === l ? '#fff' : '#666',
                                boxShadow: currentLang === l ? `0 1px 6px ${accent}44` : 'none',
                                lineHeight: 1,
                                textRendering: 'optimizeLegibility',
                            }}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isLoggedIn && <span className="zef-trust-battery"><TrustBattery score={trustScore} t={t} currentLang={currentLang} /></span>}
                    
                    {/* ── BELL ── */}
                    {isLoggedIn && (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowUserDropdown(false); if(unreadNotifs > 0) markNotificationsAsRead(); }}
                                style={{
                                    position: 'relative', cursor: 'pointer', border: 'none', outline: 'none',
                                    width: '38px', height: '38px', borderRadius: '11px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.18s, border-color 0.18s',
                                    background: unreadNotifs > 0 ? `${accent}22` : 'rgba(20,20,28,0.9)',
                                    borderWidth: '1px', borderStyle: 'solid',
                                    borderColor: unreadNotifs > 0 ? `${accent}66` : 'rgba(255,255,255,0.1)',
                                    boxShadow: unreadNotifs > 0 ? `0 0 12px ${accent}44` : 'none',
                                    isolation: 'isolate',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = unreadNotifs > 0 ? `${accent}33` : 'rgba(35,35,45,0.95)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = unreadNotifs > 0 ? `${accent}22` : 'rgba(20,20,28,0.9)'; }}
                            >
                                <Bell size={16} color={unreadNotifs > 0 ? accent : '#888'} strokeWidth={2.2} style={{ display: 'block', animation: unreadNotifs > 0 ? 'pulseAlert 2s infinite' : 'none' }} />
                                {unreadNotifs > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-5px', right: '-5px',
                                        background: 'linear-gradient(135deg, #ff3b3b, #ff6060)',
                                        color: 'white', fontSize: '9px', fontWeight: '900',
                                        minWidth: '16px', height: '16px', padding: '0 3px',
                                        borderRadius: '8px', border: '2px solid #050508',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        lineHeight: 1, boxShadow: '0 2px 8px rgba(255,50,50,0.6)',
                                    }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
                                )}
                            </button>
                            
                            {showNotifDropdown && (
                                <NotifDropdown
                                    notifications={notifications}
                                    accent={accent}
                                    onDelete={deleteNotification}
                                    onClearAll={clearAllNotifications}
                                    t={t}
                                    currentLang={currentLang}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* ── USER BUTTON ── */}
                <div style={{ position: 'relative', marginLeft: '2px' }}>
                    <button
                        onClick={() => { isLoggedIn ? setShowUserDropdown(!showUserDropdown) : setShowAuth(true); setShowNotifDropdown(false); }}
                        className="mobile-user"
                        style={{
                            cursor: 'pointer', border: 'none', outline: 'none', fontFamily: 'inherit',
                            width: '38px', height: '38px', borderRadius: '11px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.18s, border-color 0.18s',
                            background: isLoggedIn ? `${accent}22` : 'rgba(20,20,28,0.9)',
                            borderWidth: '1px', borderStyle: 'solid',
                            borderColor: isLoggedIn ? `${accent}66` : 'rgba(255,255,255,0.1)',
                            boxShadow: isLoggedIn ? `0 0 12px ${accent}33` : 'none',
                            isolation: 'isolate',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = isLoggedIn ? `${accent}33` : 'rgba(35,35,45,0.95)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isLoggedIn ? `${accent}22` : 'rgba(20,20,28,0.9)'; }}
                    >
                        <User size={16} color={isLoggedIn ? accent : '#888'} strokeWidth={2.2} style={{ display: 'block' }} /></button>
                    
                        {isLoggedIn && showUserDropdown && (
<div className="fade-in-up custom-scrollbar" style={{ position: 'absolute', top: '55px', right: '-10px', width: '290px', maxHeight: '80vh', overflowY: 'auto', background: '#0e0e18', backdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,0.08)`, zIndex: 4000, boxShadow: `0 20px 50px rgba(0,0,0,0.9)`, borderRadius: '20px', padding: '12px' }}>
    
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
                                        
                                        {/* VIP ЛАУНЖ — для CONCIERGE клієнтів і DIAMOND/PREMIUM моделей */}
                                        {(() => {
                                            const pkg = String(user?.vipPackage || '').toLowerCase();
                                            const isVipActive = !user?.vipExpiresAt || new Date(user.vipExpiresAt) > new Date();
                                            const clientHasLounge = userRole === 'client' && pkg === 'concierge' && isVipActive;
                                            const modelHasLounge = userRole === 'model' && ['diamond', 'premium'].includes(pkg) && isVipActive;
                                            if (!clientHasLounge && !modelHasLounge) return null;
                                            return (
                                                <div
                                                    style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: 'rgba(255,0,127,0.06)', border: '1px solid rgba(255,0,127,0.2)', color: '#ff007f', position: 'relative', overflow: 'hidden' }}
                                                    className="dropdown-item-hover"
                                                    onClick={() => { setShowLoungeModal(true); setShowUserDropdown(false); }}
                                                >
                                                    <span style={{ fontSize: '16px' }}>👑</span>
                                                    <span>VIP Лаунж</span>
                                                    <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: '900', color: '#ff007f', background: 'rgba(255,0,127,0.12)', border: '1px solid rgba(255,0,127,0.3)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.5px' }}>CLUB</span>
                                                </div>
                                            );
                                        })()}
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