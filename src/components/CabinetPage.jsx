import React from 'react';
import { BarChart2, ShieldCheck, Wallet, MessageCircle, Plus, Rocket, Gem, Crown, AlertCircle, CheckCircle2, Trash2, Edit3, Heart } from 'lucide-react';
import CatalogGrid from '../components/CatalogGrid';
import { useMegaphone } from '../context/MegaphoneContext';
import { C, R, section, btnPrimary, btnGhost } from '../styles/ds';

const BUMP_BASE = 150;
const TIER = {
    3: { label: 'DIAMOND', color: '#00ffff', border: '2px solid #00ffff44' },
    2: { label: 'PREMIUM', color: '#ffd700', border: '2px solid #ffd70044' },
    1: { label: 'START',   color: '#aaaaaa', border: '1px solid #aaaaaa44' },
    0: { label: '',        color: '',        border: `1px solid ${C.border}` },
};

const CabinetPage = ({ userRole, balance, userUniqueId, myModels, favorites, myChats, user, setShowStats, setShowVerifyPromo, setShowWalletModal, setPreviousPage, navigate, openCreate, openEdit, promptDelete, promptBump, setSelectedModel, setContactSelectionModel, handleToggleFavorite, t, currentLang, accent }) => {
    const meg = useMegaphone();
    const discPct = meg.isActive ? (meg.bumpDiscountPercent || 0) : 0;
    const bumpPrice = discPct > 0 ? Math.floor(BUMP_BASE - BUMP_BASE * discPct / 100) : BUMP_BASE;
    const bumpLabel = user?.freeBumps > 0 ? 'Підняти (безкоштовно)' : discPct > 0 ? `Підняти (${bumpPrice}₴ -${discPct}%)` : `Підняти (${BUMP_BASE}₴)`;

    return (
        <main className="fade-in-up">
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${C.border}` }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: C.text, margin: 0, letterSpacing: '-0.5px' }}>{t[currentLang]?.cabinet || 'Кабінет'}</h1>
                {userRole === 'model' && (
                    <button onClick={() => setShowStats(true)} style={{ ...btnGhost(), fontSize: '13px', padding: '10px 16px' }}>
                        <BarChart2 size={15} color={C.accent} />
                        <span className="hide-mobile-text">{t[currentLang]?.stats || 'Аналітика'}</span>
                    </button>
                )}
            </div>

            {/* ── STATS STRIP ── */}
            <div className="cabinet-stats-container" style={{ ...section(), display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'center', flexWrap: 'wrap', padding: '20px 24px' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{t[currentLang]?.balanceText || 'Баланс'}</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: C.accent }}>{(balance || 0).toFixed(2)} <span style={{ fontSize: '14px', color: C.textSub, fontWeight: '500' }}>UAH</span></div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: C.textMuted }}>{t[currentLang]?.yourId || 'Ваш ID'}: <span style={{ color: C.text, fontWeight: '700' }}>ID{userUniqueId}</span></div>
                </div>

                {userRole === 'model' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', padding: '14px 16px', borderRadius: R.sm }}>
                        <div>
                            <div style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.6px' }}>{t[currentLang]?.accStatus || 'Статус'}</div>
                            <div style={{ fontSize: '13px', color: C.danger, fontWeight: '800', marginTop: '2px' }}>{t[currentLang]?.unverified || 'Не верифіковано'}</div>
                        </div>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowVerifyPromo(true); }} style={{ ...btnPrimary({ background: 'linear-gradient(135deg, #ff4444, #cc2222)', boxShadow: '0 4px 14px rgba(255,68,68,0.3)', padding: '10px 16px', fontSize: '13px' }) }}>
                            <ShieldCheck size={15} /> {t[currentLang]?.verifyNowBtn || 'Верифікувати'}
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowWalletModal(true)} style={{ ...btnPrimary(), padding: '12px 20px', fontSize: '13px' }} className="cabinet-action-btn">
                        <Wallet size={16} /> {t[currentLang]?.topUpBtn || 'Поповнити'}
                    </button>
                    <button onClick={() => { setPreviousPage(location.pathname); navigate('/messages'); }} style={{ ...btnGhost(), padding: '12px 20px', fontSize: '13px' }} className="cabinet-action-btn">
                        <MessageCircle size={16} color={C.accent} />
                        <span className="hide-mobile-text">{t[currentLang]?.myMessagesBtn || 'Повідомлення'}</span>
                        {myChats.length > 0 && <span style={{ background: C.accent, color: '#fff', fontSize: '10px', padding: '2px 7px', borderRadius: '10px' }}>{myChats.length}</span>}
                    </button>
                </div>
            </div>

            {/* ── CONTENT ── */}
            {userRole === 'model' ? (
                myModels.length === 0 ? (
                    <div style={{ ...section(), textAlign: 'center', padding: '80px 24px', border: `1px dashed ${C.border}` }}>
                        <div style={{ color: C.textSub, letterSpacing: '1px', marginBottom: '20px' }}>{t[currentLang]?.noAds || 'У вас ще немає анкет'}</div>
                        <button onClick={openCreate} style={{ ...btnPrimary(), margin: '0 auto' }}>{t[currentLang]?.createFirst || 'Створити анкету'}</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {/* Add card */}
                        <div onClick={openCreate} style={{ height: '520px', border: `1px dashed ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMuted, transition: '0.2s', borderRadius: R.md }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                            <Plus size={32} style={{ marginBottom: '10px' }} />
                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{t[currentLang]?.create || 'Нова анкета'}</span>
                        </div>

                        {myModels.map(m => {
                            const tier = TIER[m.vLevel] || TIER[0];
                            return (
                                <div key={m.id} style={{ background: C.surface, border: m.bumpedAt ? '1px solid rgba(255,152,0,0.4)' : tier.border, borderRadius: R.md, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: '0.2s', opacity: m.isApproved ? 1 : 0.65, position: 'relative' }}>
                                    {/* Badges */}
                                    {m.bumpedAt && !m.vLevel && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ff9800', color: '#000', padding: '4px 10px', borderRadius: R.xs, fontSize: '10px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}><Rocket size={11} /> В ТОПІ</div>}
                                    {m.vLevel === 3 && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#00ffff', color: '#000', padding: '4px 10px', borderRadius: R.xs, fontSize: '10px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}><Gem size={11} /> DIAMOND</div>}
                                    {m.vLevel === 2 && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ffd700', color: '#000', padding: '4px 10px', borderRadius: R.xs, fontSize: '10px', fontWeight: '900', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}><Crown size={11} /> PREMIUM</div>}
                                    {!m.isApproved && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,68,68,0.85)', color: '#fff', padding: '4px 10px', borderRadius: R.xs, fontSize: '10px', fontWeight: '700', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(6px)' }}><AlertCircle size={11} /> Модерація</div>}

                                    {/* Photo */}
                                    <div style={{ height: '320px', background: C.surface2, overflow: 'hidden', flexShrink: 0 }}>
                                        {m.photos?.[0] ? <img src={m.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} alt="" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: '12px' }}>Немає фото</div>}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '800', color: C.text }}>{m.title || m.name}</span>
                                            {m.verification === 'video' && <CheckCircle2 size={14} color="#FFD700" />}
                                            {m.verification === 'photo' && <CheckCircle2 size={14} color="#C0C0C0" />}
                                        </div>
                                        <div style={{ color: C.textSub, fontSize: '12px' }}>📍 {t[currentLang]?.onlineOnly || 'Онлайн'} · {m.priceFrom} UAH · {m.age}р.</div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                                            <button onClick={e => { e.stopPropagation(); if (!m.isApproved) return; promptBump(m.id); }} style={{ flex: 2, padding: '9px', background: 'rgba(255,152,0,0.1)', border: `1px solid ${m.isApproved ? 'rgba(255,152,0,0.4)' : C.border}`, color: m.isApproved ? '#ff9800' : C.textMuted, fontWeight: '700', cursor: m.isApproved ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', fontFamily: 'inherit', borderRadius: R.xs, transition: '0.18s' }}>
                                                <Rocket size={12} /> {bumpLabel}
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); openEdit(m); }} style={{ flex: 1, padding: '9px', background: C.surface2, border: `1px solid ${C.border}`, color: C.textSub, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', fontFamily: 'inherit', borderRadius: R.xs, transition: '0.18s' }}>
                                                <Edit3 size={12} /> Редаг.
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); promptDelete(m.id); }} style={{ padding: '9px 12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: C.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', borderRadius: R.xs, transition: '0.18s' }}>
                                                <Trash2 size={13} />
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
                    <div style={{ ...section(), textAlign: 'center', padding: '80px 24px', border: `1px dashed ${C.border}` }}>
                        <Heart size={40} color={C.textMuted} style={{ marginBottom: '14px' }} />
                        <div style={{ color: C.textSub, marginBottom: '16px' }}>{t[currentLang]?.noFavs || 'Список вибраних порожній'}</div>
                        <button onClick={() => navigate('/')} style={{ ...btnPrimary(), margin: '0 auto' }}>{t[currentLang]?.goToCatalog || 'До каталогу'}</button>
                    </div>
                ) : (
                    <>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: C.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Heart size={18} color={C.accent} fill={C.accent} /> {t[currentLang]?.yourFavorites || 'Вибрані'}
                        </h2>
                        <CatalogGrid currentModels={favorites} setSelectedModel={setSelectedModel} setContactSelectionModel={setContactSelectionModel} t={t} currentLang={currentLang} accent={accent} favorites={favorites} handleToggleFavorite={handleToggleFavorite} />
                    </>
                )
            )}
        </main>
    );
};

export default CabinetPage;