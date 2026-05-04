import React from 'react';
import { ShieldCheck, CheckCircle2, Heart, MessageCircle, Rocket, Crown, Gem } from 'lucide-react'; 
// 🚀 ДОДАНО ІМПОРТ STORE ДЛЯ ПЕРЕВІРКИ ВЛАСНИКА
import useStore from '../store/useStore';

const CatalogGrid = ({ currentModels, setSelectedModel, setContactSelectionModel, t, currentLang, accent, favorites = [], handleToggleFavorite }) => {
    
    // 🚀 ВИТЯГУЄМО ДАНІ КОРИСТУВАЧА ЗІ STORE
    const { userUniqueId, user } = useStore();
    const myId = user?._id || user?.id || userUniqueId;

    // ФІКС: Логіка перекладу фетишів для карток
    const getFetishTranslation = (fKey) => {
        const categories = t[currentLang]?.fetishes || {};
        for (let cat in categories) {
            if (categories[cat].items && categories[cat].items[fKey]) {
                return categories[cat].items[fKey];
            }
        }
        return fKey;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {currentModels.map(m => {
                const isFav = favorites?.some(fav => fav.id === m.id); 
                
                // 🚀 ПЕРЕВІРКА НА ВЛАСНИКА
                const ownerId = m.userId?._id || m.userId;
                const isOwner = Boolean(m.isMine || (myId && ownerId && String(myId) === String(ownerId)));
                
                // 🟢 ЛОГІКА СВІТІННЯ КАРТКИ ЗАЛЕЖНО ВІД СТАТУСУ
                let cardStyle = { border: '1px solid rgba(255,255,255,0.05)', shadow: '0 10px 30px rgba(0,0,0,0.5)' };
                if (m.vLevel === 3) cardStyle = { border: '2px solid #00ffff', shadow: '0 0 20px rgba(0, 255, 255, 0.2)' };
                else if (m.vLevel === 2) cardStyle = { border: '2px solid #ffd700', shadow: '0 0 20px rgba(255, 215, 0, 0.15)' };
                else if (m.vLevel === 1) cardStyle = { border: '1px solid #aaa', shadow: '0 0 15px rgba(170, 170, 170, 0.1)' };
                else if (m.bumpedAt) cardStyle = { border: '1px solid #ff9800', shadow: '0 0 15px rgba(255, 152, 0, 0.2)' };

                return (
                    <div key={m.id} className="model-card" style={{ backgroundColor: '#0a0a0f', borderRadius: '20px', overflow: 'hidden', border: cardStyle.border, position: 'relative', transition: 'all 0.3s ease', boxShadow: cardStyle.shadow }}>
                        
                        {/* 🚀 БЕЙДЖ "В ТОПІ" ДЛЯ РАЗОВОГО ПІДЙОМУ */}
                        {m.bumpedAt && !m.vLevel && (
                            <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#ff9800', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(255, 152, 0, 0.4)' }}>
                                <Rocket size={14} /> В ТОПІ
                            </div>
                        )}

                        {/* 💎 БЕЙДЖІ ДЛЯ VIP */}
                        {m.vLevel === 3 && <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#00ffff', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0, 255, 255, 0.4)' }}><Gem size={14} /> ДІАМАНТ</div>}
                        {m.vLevel === 2 && <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#ffd700', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(255, 215, 0, 0.4)' }}><Crown size={14} /> ЗОЛОТО</div>}

                        {/* КНОПКА ОБРАНОГО (Прихована для власника) */}
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
                            
                            {/* Градієнтне затемнення знизу фото */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,1) 0%, rgba(5,5,8,0.4) 50%, transparent 100%)', pointerEvents: 'none' }}></div>
                            
                            {/* Інфа на фотографії (Ім'я, Ціна, Вік) */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ color: 'white', fontSize: '24px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{m.name}</span>
                                            {m.vLevel > 0 && <CheckCircle2 size={18} color={m.vLevel === 3 ? '#00ffff' : (m.vLevel === 2 ? '#ffd700' : '#4CAF50')} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}/>}
                                        </div>
                                        <div style={{ color: '#ddd', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4CAF50', borderRadius: '50%', boxShadow: '0 0 8px #4CAF50' }}></span>
                                            {t[currentLang]?.onlineOnly} <span style={{color: '#888'}}>•</span> {m.age} {t[currentLang]?.age}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: accent, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{m.priceFrom} <span style={{fontSize: '12px', color: '#ccc'}}>UAH</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Нижня частина з кнопками */}
                        <div style={{ padding: '20px', background: '#0a0a0f' }}>
                            
                            {/* ФІКС: Виведення правильних назв послуг */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', minHeight: '52px' }}>
                                {m.fetishes?.slice(0, 4).map((f, i) => (
                                    <span key={i} style={{ fontSize: '11px', color: '#aaa', background: '#15151a', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: '500' }}>
                                        {getFetishTranslation(f)}
                                    </span>
                                ))}
                                {m.fetishes?.length > 4 && <span style={{ fontSize: '11px', color: accent, background: `${accent}15`, padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>+{m.fetishes.length - 4}</span>}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                {/* 🚀 ЯКЩО ВЛАСНИК - СІРА КНОПКА, ЯКЩО КЛІЄНТ - РОЖЕВА */}
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

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(76, 175, 80, 0.1)', padding: '0 15px', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.2)', cursor: 'help' }} title={t[currentLang]?.trustScore}>
                                    <ShieldCheck size={18} color="#4caf50" style={{ marginRight: '5px' }} />
                                    <span style={{ fontSize: '13px', color: '#4caf50', fontWeight: 'bold' }}>{m.trustScore || 100}%</span>
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