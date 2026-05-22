import React from 'react';
import { ShieldCheck, CheckCircle2, Heart, MessageCircle, Rocket, Crown, Gem } from 'lucide-react'; 
import useStore from '../store/useStore';

const CatalogGrid = ({ currentModels, setSelectedModel, setContactSelectionModel, t, currentLang, accent, favorites = [], handleToggleFavorite }) => {
    
    const { userUniqueId, user, onlineUsers } = useStore();
    const myId = user?._id || user?.id || userUniqueId;

    const getFetishTranslation = (fKey) => {
        const categories = t[currentLang]?.fetishes || {};
        for (let cat in categories) {
            if (categories[cat].items && categories[cat].items[fKey]) {
                return categories[cat].items[fKey];
            }
        }
        return fKey;
    };

    // 🟢 БРОНЕБІЙНА ПЕРЕВІРКА ОНЛАЙНУ ЗА ЧАСОМ
    const checkIfOnline = (lastActiveDate) => {
        if (!lastActiveDate) return false;
        const lastActiveTime = new Date(lastActiveDate).getTime();
        const currentTime = new Date().getTime();
        
        if (isNaN(lastActiveTime)) return false;

        const diff = currentTime - lastActiveTime;
        const tenMinutesInMs = 10 * 60 * 1000;
        
        // Якщо є розсинхрон годинників (сервер поспішає)
        if (diff < 0) {
            return Math.abs(diff) < tenMinutesInMs;
        }

        return diff < tenMinutesInMs;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {currentModels.map(m => {
                const isFav = favorites?.some(fav => fav.id === m.id); 
                
                // Надійне отримання ID власника
                const ownerId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                const isOwner = Boolean(myId && ownerId && String(myId) === ownerId);
                
         // 🟢 ЛОГІКА ОНЛАЙНУ ТІЛЬКИ ДЛЯ КАРТОК (ЗАТРИМКА 10 ХВ)
                let displayOnline = false;

                if (ownerId && ownerId !== 'undefined' && ownerId !== 'null') {
                    const socketData = onlineUsers[ownerId];
                    
                    if (socketData && socketData.status === 'online') {
                        // 1. Людина прямо зараз на сайті і вкладка відкрита
                        displayOnline = true;
                    } 
                    else if (socketData && socketData.status === 'offline') {
                        // 2. Людина згорнула вкладку або вийшла. 
                        // Чат вже бачить її як offline, але ДЛЯ КАРТОЧОК ми перевіряємо, чи пройшло 10 хв.
                        const timeToCheck = socketData.lastSeen;
                        if (timeToCheck) {
                            displayOnline = checkIfOnline(timeToCheck);
                        } else {
                            displayOnline = false;
                        }
                    } 
                    else {
                        // 3. Інформації в сокетах ще немає (щойно завантажили сторінку)
                        // Беремо останню активність з бази даних
                        const userObj = isOwner ? user : (typeof m.userId === 'object' ? m.userId : null);
                        const timeToCheck = userObj?.lastActive || m.lastActive;
                        
                        if (timeToCheck) {
                            displayOnline = checkIfOnline(timeToCheck);
                        }
                    }
                }
                
                // 🟢 ЛОГІКА ДОВІРИ
                let displayTrust = 100;
                const populatedUser = typeof m.userId === 'object' ? m.userId : null;
                const backendTrust = populatedUser?.trustScore ?? populatedUser?.trustPercentage;
                const storeTrust = user?.trustScore ?? user?.trustPercentage;
                const profileTrust = m.trustScore ?? m.trustPercentage;

                if (backendTrust != null) displayTrust = backendTrust;
                else if (isOwner && storeTrust != null) displayTrust = storeTrust;
                else if (profileTrust != null) displayTrust = profileTrust;
                
                let trustColor = '#4caf50';
                if (displayTrust < 70) trustColor = '#ffb300';
                if (displayTrust < 40) trustColor = '#ff4444';

                let cardStyle = { border: '1px solid rgba(255,255,255,0.05)', shadow: '0 10px 30px rgba(0,0,0,0.5)' };
                if (m.vLevel === 3) cardStyle = { border: '2px solid #00ffff', shadow: '0 0 20px rgba(0, 255, 255, 0.2)' };
                else if (m.vLevel === 2) cardStyle = { border: '2px solid #ffd700', shadow: '0 0 20px rgba(255, 215, 0, 0.15)' };
                else if (m.vLevel === 1) cardStyle = { border: '1px solid #aaa', shadow: '0 0 15px rgba(170, 170, 170, 0.1)' };
                else if (m.bumpedAt) cardStyle = { border: '1px solid #ff9800', shadow: '0 0 15px rgba(255, 152, 0, 0.2)' };

                return (
                    <div key={m.id || m._id || Math.random()} className="model-card" style={{ backgroundColor: '#0a0a0f', borderRadius: '20px', overflow: 'hidden', border: cardStyle.border, position: 'relative', transition: 'all 0.3s ease', boxShadow: cardStyle.shadow }}>
                        
                        {m.bumpedAt && !m.vLevel && (
                            <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#ff9800', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(255, 152, 0, 0.4)' }}>
                                <Rocket size={14} /> В ТОПІ
                            </div>
                        )}

                        {m.vLevel === 3 && <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#00ffff', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0, 255, 255, 0.4)' }}><Gem size={14} /> ДІАМАНТ</div>}
                        {m.vLevel === 2 && <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#ffd700', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(255, 215, 0, 0.4)' }}><Crown size={14} /> ЗОЛОТО</div>}

                        {handleToggleFavorite && !isOwner && (
                            <div 
                                onClick={(e) => handleToggleFavorite(m, e)} 
                                style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '50%', zIndex: 10, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s' }}
                                className="menu-hover"
                            >
                                <Heart size={20} color={isFav ? accent : 'white'} fill={isFav ? accent : 'none'} style={{ transition: 'all 0.3s', transform: isFav ? 'scale(1.1)' : 'scale(1)' }} />
                            </div>
                        )}

                        <div onClick={() => setSelectedModel(m)} style={{ position: 'relative', height: '380px', overflow: 'hidden', background: '#111', cursor: 'pointer' }}>
                            {m.photos && m.photos.length > 0 ? (
                                <img src={m.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', transition: 'transform 0.7s ease' }} alt={m.name} className="card-img" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>NO PHOTO</div>
                            )}
                            
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,1) 0%, rgba(5,5,8,0.4) 50%, transparent 100%)', pointerEvents: 'none' }}></div>
                            
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ color: 'white', fontSize: '24px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{m.name}</span>
                                            {m.vLevel > 0 && <CheckCircle2 size={18} color={m.vLevel === 3 ? '#00ffff' : (m.vLevel === 2 ? '#ffd700' : '#4CAF50')} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}/>}
                                        </div>
                                        
                                        <div style={{ color: '#ddd', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ 
                                                display: 'inline-block', 
                                                width: '8px', 
                                                height: '8px', 
                                                background: displayOnline ? '#4CAF50' : '#666', 
                                                borderRadius: '50%', 
                                                boxShadow: displayOnline ? '0 0 8px #4CAF50' : 'none',
                                                transition: 'background-color 0.3s ease'
                                            }}></span>
                                            {displayOnline ? (t[currentLang]?.onlineStatus || "Онлайн") : (t[currentLang]?.offlineStatus || "Офлайн")} 
                                            <span style={{color: '#888'}}>•</span> {m.age} {t[currentLang]?.age || "років"}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: accent, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{m.priceFrom} <span style={{fontSize: '12px', color: '#ccc'}}>UAH</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '20px', background: '#0a0a0f' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', minHeight: '52px' }}>
                                {m.fetishes?.slice(0, 4).map((f, i) => (
                                    <span key={i} style={{ fontSize: '11px', color: '#aaa', background: '#15151a', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: '500' }}>
                                        {getFetishTranslation(f)}
                                    </span>
                                ))}
                                {m.fetishes?.length > 4 && <span style={{ fontSize: '11px', color: accent, background: `${accent}15`, padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>+{m.fetishes.length - 4}</span>}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                {isOwner ? (
                                    <div style={{ padding: '14px', background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', fontWeight: 'bold', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <ShieldCheck size={18} /> Ваша анкета
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setContactSelectionModel(m); }} 
                                        style={{ padding: '14px', background: `linear-gradient(45deg, ${accent}, #ff4081)`, border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 15px ${accent}44`, transition: 'all 0.3s' }} 
                                        className="menu-hover"
                                    >
                                        <MessageCircle size={18} /> {t[currentLang]?.write || "Почати чат"}
                                    </button>
                                )}

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    background: `${trustColor}15`, 
                                    padding: '0 15px', 
                                    borderRadius: '12px', 
                                    border: `1px solid ${trustColor}33`, 
                                    cursor: 'help' 
                                }} title={t[currentLang]?.trustScore}>
                                    <ShieldCheck size={18} color={trustColor} style={{ marginRight: '5px' }} />
                                    <span style={{ fontSize: '13px', color: trustColor, fontWeight: 'bold' }}>{displayTrust}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CatalogGrid;