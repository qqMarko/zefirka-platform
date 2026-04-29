import React from 'react';
import { 
    BarChart2, ShieldCheck, Wallet, MessageCircle, Plus, 
    Rocket, Gem, Crown, AlertCircle, CheckCircle2, Trash2, Edit3, Heart 
} from 'lucide-react';
import CatalogGrid from '../components/CatalogGrid'; // Перевірте, чи правильний шлях до компонента

const CabinetPage = ({
    userRole, balance, userUniqueId, myModels, favorites, myChats, user,
    setShowStats, setShowVerifyPromo, setShowWalletModal, 
    setPreviousPage, navigate, openCreate, openEdit, promptDelete, promptBump,
    setSelectedModel, setContactSelectionModel, handleToggleFavorite,
    t, currentLang, accent
}) => {
    return (
        <main className="fade-in-up">
            <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '42px', margin: 0, letterSpacing: '2px', fontWeight: '900' }}>{t[currentLang]?.cabinet}</h1>
                {userRole === 'model' && (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => setShowStats(true)} style={{ background: 'none', border: `1px solid ${accent}`, color: accent, padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontFamily: 'inherit', borderRadius: '8px', transition: '0.2s' }} className="menu-hover">
                            <BarChart2 size={18}/> <span className="hide-mobile-text">{t[currentLang]?.stats}</span>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="cabinet-stats-container" style={{ display: 'flex', gap: '20px', marginBottom: '40px', background: '#0a0a0f', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', fontWeight: 'bold' }}>{t[currentLang]?.balanceText}</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: accent }}>{balance ? balance.toFixed(2) : '0.00'} <span style={{fontSize: '16px', color: '#fff', fontWeight: '500'}}>UAH</span></div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa', fontWeight: '500' }}>{t[currentLang]?.yourId}: <span style={{color: 'white', fontWeight: 'bold'}}>ID{userUniqueId}</span></div>
                </div>
                
                {userRole === 'model' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>{t[currentLang]?.accStatus}</span><span style={{ fontSize: '14px', color: '#ff4444', fontWeight: 'bold' }}>{t[currentLang]?.unverified}</span></div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVerifyPromo(true); }} style={{ background: accent, border: 'none', color: 'white', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 15px ${accent}44` }} className="menu-hover"><ShieldCheck size={18} /> {t[currentLang]?.verifyNowBtn}</button>
                    </div>
                )}
                
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowWalletModal(true)} style={{ padding: '15px 25px', background: accent, border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 5px 15px ${accent}44` }} className="menu-hover cabinet-action-btn"><Wallet size={18} /> {t[currentLang]?.topUpBtn}</button>
                    <button onClick={() => { setPreviousPage(location.pathname); navigate('/messages'); }} style={{ padding: '15px 25px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} className="menu-hover cabinet-action-btn"><MessageCircle size={18} color={accent} /> <span className="hide-mobile-text">{t[currentLang]?.myMessagesBtn}</span>{myChats.length > 0 && <span style={{ background: accent, color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px' }}>{myChats.length}</span>}</button>
                </div>
            </div>
            
            {userRole === 'model' ? (
                myModels.length === 0 ? (
                    <div style={{ padding: '100px 50px', background: 'rgba(0,0,0,0.8)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', borderRadius: '16px' }}>
                        <p style={{ color: '#aaa', letterSpacing: '2px', marginBottom: '30px', fontWeight: '500' }}>{t[currentLang]?.noAds}</p>
                        <button onClick={openCreate} style={{ background: accent, padding: '15px 40px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px', boxShadow: `0 4px 15px ${accent}44` }}>{t[currentLang]?.createFirst}</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        <div onClick={openCreate} style={{ height: '560px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', transition: '0.3s', borderRadius: '16px' }} className="menu-hover">
                            <Plus size={40} style={{ marginBottom: '15px' }} />
                            <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{t[currentLang]?.create}</span>
                        </div>
                        {myModels.map(m => {
                            let cardStyle = { border: '1px solid rgba(255,255,255,0.05)', shadow: 'none' };
                            if (m.vLevel === 3) cardStyle = { border: '2px solid #00ffff', shadow: '0 0 20px rgba(0, 255, 255, 0.2)' };
                            else if (m.vLevel === 2) cardStyle = { border: '2px solid #ffd700', shadow: '0 0 20px rgba(255, 215, 0, 0.15)' };
                            else if (m.vLevel === 1) cardStyle = { border: '1px solid #aaa', shadow: '0 0 15px rgba(170, 170, 170, 0.1)' };
                            else if (m.bumpedAt) cardStyle = { border: '1px solid #ff9800', shadow: '0 0 15px rgba(255, 152, 0, 0.2)' };

                            return (
                                <div key={m.id} style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: cardStyle.border, boxShadow: cardStyle.shadow, position: 'relative', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', transition: '0.3s', opacity: m.isApproved ? 1 : 0.6 }}>
                                    
                                    {m.bumpedAt && !m.vLevel && (
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#ff9800', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(255, 152, 0, 0.4)' }}>
                                            <Rocket size={14} /> В ТОПІ
                                        </div>
                                    )}

                                    {m.vLevel === 3 && <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#00ffff', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0, 255, 255, 0.4)' }}><Gem size={14} /> ДІАМАНТ</div>}
                                    {m.vLevel === 2 && <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#ffd700', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(255, 215, 0, 0.4)' }}><Crown size={14} /> ЗОЛОТО</div>}

                                    {!m.isApproved && (
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255, 68, 68, 0.9)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(5px)' }}>
                                            <AlertCircle size={14} /> На модерації
                                        </div>
                                    )}

                                    <div style={{ height: '350px', backgroundColor: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        {m.photos && m.photos.length > 0 ? <img src={m.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} alt="Model"/> : <span style={{color:'#1a1a1a', fontSize: '10px'}}>NO_IMAGE_DATA</span>}
                                    </div>

                                    <div style={{ padding: '15px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ fontSize: '20px', fontWeight: 'bold', color: accent }}>{m.title || m.name}</div>{m.vLevel > 0 && <CheckCircle2 size={16} color={m.vLevel === 3 ? '#00ffff' : (m.vLevel === 2 ? '#ffd700' : '#aaa')} />}</div>
                                        <div style={{ color: '#aaa', fontSize: '12px', margin: '10px 0 20px', fontWeight: '500' }}>📍 {t[currentLang]?.onlineOnly} // {m.priceFrom} UAH // {m.age}</div>

                                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (!m.isApproved) {
                                                        alert('Анкета ще на модерації!'); // Або можна передати toast через пропси
                                                        return;
                                                    }
                                                    promptBump(m.id); 
                                                }} 
                                                style={{ flex: 1.5, padding: '10px', background: 'rgba(255, 152, 0, 0.1)', border: `1px solid ${!m.isApproved ? '#555' : '#ff9800'}`, color: !m.isApproved ? '#555' : '#ff9800', fontWeight: 'bold', cursor: !m.isApproved ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontFamily: 'inherit', borderRadius: '8px', transition: '0.2s' }} 
                                                className={!m.isApproved ? "" : "menu-hover"}
                                            >
                                                <Rocket size={14}/> {user?.freeBumps > 0 ? 'Підняти анкету' : 'Підняти (150₴)'}
                                            </button>

                                            <button onClick={(e) => { e.stopPropagation(); openEdit(m); }} style={{ flex: 1, padding: '10px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontFamily: 'inherit', borderRadius: '8px', transition: '0.2s' }} className="menu-hover">
                                                <Edit3 size={14}/> Редаг.
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); promptDelete(m.id); }} style={{ padding: '10px 15px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', transition: '0.2s' }} className="menu-hover">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                favorites.length === 0 ? (
                    <div style={{ padding: '100px 50px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', borderRadius: '16px' }}>
                        <Heart size={48} color="#333" style={{marginBottom: '20px'}} />
                        <p style={{ color: '#aaa', letterSpacing: '2px', fontWeight: '500', marginBottom: '20px' }}>{t[currentLang]?.noFavs}</p>
                        <button onClick={() => navigate('/')} style={{ background: accent, padding: '12px 30px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', transition: '0.3s' }} className="menu-hover">{t[currentLang]?.goToCatalog}</button>
                    </div>
                ) : (
                    <div>
                        <h2 style={{color: 'white', marginBottom: '30px', fontSize: '24px', letterSpacing: '1px', fontWeight: 'bold'}}>
                            <Heart size={20} color={accent} fill={accent} style={{marginRight:'10px', verticalAlign:'text-bottom'}}/> {t[currentLang]?.yourFavorites}
                        </h2>
                        <CatalogGrid 
                            currentModels={favorites} setSelectedModel={setSelectedModel} 
                            setContactSelectionModel={setContactSelectionModel} t={t} 
                            currentLang={currentLang} accent={accent} favorites={favorites} 
                            handleToggleFavorite={handleToggleFavorite} 
                        />
                    </div>
                )
            )}
        </main>
    );
};

export default CabinetPage;