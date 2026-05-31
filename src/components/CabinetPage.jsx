import React from 'react';
import { BarChart2, ShieldCheck, Wallet, MessageCircle, Plus, Rocket, Gem, Crown, AlertCircle, CheckCircle2, Trash2, Edit3, Heart, Sparkles, Clock, Lock, Zap } from 'lucide-react';
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

const CabinetPage = ({ userRole, balance, userUniqueId, myModels, favorites, myChats, user, setShowStats, setShowVerifyPromo, setShowWalletModal, setPreviousPage, navigate, openCreate, openEdit, promptDelete, promptBump, setSelectedModel, setContactSelectionModel, handleToggleFavorite, t, currentLang, accent, setShowVipModal, setShowLoungeModal, trustScore = 100 }) => {
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

                {/* ── ДОВІРА (TrustScore) — тільки на мобілці (на ПК є в хедері) ── */}
                {(() => {
                    const s = trustScore ?? 100;
                    const col = s >= 80 ? '#4caf50' : s >= 50 ? '#ffc107' : '#ff4444';
                    const bg  = s >= 80 ? 'rgba(76,175,80,0.08)' : s >= 50 ? 'rgba(255,193,7,0.08)' : 'rgba(255,68,68,0.08)';
                    return (
                        <div className="zef-cabinet-trust" style={{ display: 'none', alignItems: 'center', gap: '12px', background: bg, border: `1px solid ${col}40`, padding: '14px 18px', borderRadius: R.sm, minWidth: '150px' }}>
                            <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                                <svg width="44" height="44" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15" fill="none" stroke={col} strokeWidth="3" strokeLinecap="round"
                                        strokeDasharray={`${(s / 100) * 94.2} 94.2`} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: col }}>{s}%</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.6px' }}>{t[currentLang]?.trustScore || 'Довіра'}</div>
                                <div style={{ fontSize: '13px', color: col, fontWeight: '800', marginTop: '2px' }}>
                                    {s >= 80 ? 'Високий рівень' : s >= 50 ? 'Середній' : 'Низький'}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {userRole === 'model' && (() => {
                    const v = myModels?.[0]?.verification || 'none';
                    if (v === 'video') return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', padding: '14px 16px', borderRadius: R.sm }}>
                            <CheckCircle2 size={28} color="#FFD700" />
                            <div>
                                <div style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.6px' }}>Статус</div>
                                <div style={{ fontSize: '13px', color: '#FFD700', fontWeight: '800', marginTop: '2px' }}>🥇 Верифіковано (відео)</div>
                            </div>
                        </div>
                    );
                    if (v === 'photo') return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.3)', padding: '14px 16px', borderRadius: R.sm }}>
                            <CheckCircle2 size={28} color="#C0C0C0" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.6px' }}>Статус</div>
                                <div style={{ fontSize: '13px', color: '#C0C0C0', fontWeight: '800', marginTop: '2px' }}>🥈 Верифіковано (фото)</div>
                            </div>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowVerifyPromo(true); }} style={{ ...btnPrimary({ background: 'linear-gradient(135deg, #FFD700, #DAA520)', color: '#000', boxShadow: '0 4px 14px rgba(255,215,0,0.3)', padding: '10px 16px', fontSize: '13px' }) }}>
                                <ShieldCheck size={15} /> Покращити до 🥇
                            </button>
                        </div>
                    );
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', padding: '14px 16px', borderRadius: R.sm }}>
                            <div>
                                <div style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.6px' }}>{t[currentLang]?.accStatus || 'Статус'}</div>
                                <div style={{ fontSize: '13px', color: C.danger, fontWeight: '800', marginTop: '2px' }}>{t[currentLang]?.unverified || 'Не верифіковано'}</div>
                            </div>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowVerifyPromo(true); }} style={{ ...btnPrimary({ background: 'linear-gradient(135deg, #ff4444, #cc2222)', boxShadow: '0 4px 14px rgba(255,68,68,0.3)', padding: '10px 16px', fontSize: '13px' }) }}>
                                <ShieldCheck size={15} /> {t[currentLang]?.verifyNowBtn || 'Верифікувати'}
                            </button>
                        </div>
                    );
                })()}

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
                // ══════════════════════════════════════════════
                // КЛІЄНТСЬКИЙ КАБІНЕТ
                // ══════════════════════════════════════════════
                <ClientCabinet
                    user={user} navigate={navigate} accent={accent}
                    favorites={favorites} setSelectedModel={setSelectedModel}
                    setContactSelectionModel={setContactSelectionModel}
                    handleToggleFavorite={handleToggleFavorite}
                    setShowVipModal={setShowVipModal} setShowLoungeModal={setShowLoungeModal}
                    t={t} currentLang={currentLang}
                />
            )}
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
// КЛІЄНТСЬКИЙ КАБІНЕТ — окремий компонент
// ─────────────────────────────────────────────────────────────
const VIP_META = {
    concierge:      { label: 'CONCIERGE', color: '#ff007f', bg: 'rgba(255,0,127,0.08)',  border: 'rgba(255,0,127,0.25)',  icon: <Sparkles    size={18} color="#ff007f" /> },
    priority_chat:  { label: 'PRIORITY',  color: '#ffc107', bg: 'rgba(255,193,7,0.08)',  border: 'rgba(255,193,7,0.25)',  icon: <Zap         size={18} color="#ffc107" /> },
    premium_client: { label: 'GUEST',     color: '#4caf50', bg: 'rgba(76,175,80,0.08)',  border: 'rgba(76,175,80,0.25)', icon: <ShieldCheck  size={18} color="#4caf50" /> },
};

function getRemainingTime(expiresAt) {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days} дн ${hours} год`;
    return `${hours} год`;
}

const ClientCabinet = ({ user, navigate, accent, favorites, setSelectedModel, setContactSelectionModel, handleToggleFavorite, setShowVipModal, setShowLoungeModal, t, currentLang }) => {
    const pkg = String(user?.vipPackage || '').toLowerCase();
    const isVipActive = user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();
    const vipMeta = VIP_META[pkg];
    const hasActiveVip = vipMeta && isVipActive;
    const timeLeft = getRemainingTime(user?.vipExpiresAt);
    const hasLounge = pkg === 'concierge' && isVipActive;
    const hasFavAccess = ['premium_client', 'priority_chat', 'concierge'].includes(pkg) && isVipActive;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── VIP СТАТУС ── */}
            {hasActiveVip ? (
                <div style={{ ...section(), padding: '20px 24px', border: `1px solid ${vipMeta.border}`, background: vipMeta.bg, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: vipMeta.bg, border: `1px solid ${vipMeta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {vipMeta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: vipMeta.color }}>{vipMeta.label}</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', background: vipMeta.bg, border: `1px solid ${vipMeta.border}`, color: vipMeta.color, padding: '2px 8px', borderRadius: '5px' }}>АКТИВНИЙ</span>
                        </div>
                        {timeLeft && (
                            <div style={{ fontSize: '12px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Clock size={11} /> Діє ще: <span style={{ color: C.text, fontWeight: '700' }}>{timeLeft}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowVipModal && setShowVipModal(true)} style={{ ...btnGhost(), fontSize: '12px', padding: '8px 14px', flexShrink: 0 }}>
                        Продовжити
                    </button>
                </div>
            ) : (
                <div style={{ ...section(), padding: '20px 24px', border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Crown size={22} color={C.textMuted} />
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: C.text, marginBottom: '3px' }}>Без преміум статусу</div>
                        <div style={{ fontSize: '12px', color: C.textMuted }}>Додайте анкети в обране, отримайте пріоритет в чаті та арбітраж</div>
                    </div>
                    <button onClick={() => setShowVipModal && setShowVipModal(true)} style={{ ...btnPrimary(), fontSize: '12px', padding: '10px 16px', flexShrink: 0 }}>
                        <Crown size={14} /> Активувати
                    </button>
                </div>
            )}

            {/* ── ЛАУНЖ (тільки CONCIERGE) ── */}
            {hasLounge && (
                <div
                    onClick={() => setShowLoungeModal && setShowLoungeModal(true)}
                    style={{ padding: '18px 24px', background: 'rgba(255,0,127,0.04)', border: '1px solid rgba(255,0,127,0.2)', borderRadius: R.md, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,0,127,0.45)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,0,127,0.2)'}
                >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,0,127,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Crown size={22} color="#ff007f" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#ff007f' }}>VIP Лаунж</span>
                            <span style={{ fontSize: '9px', fontWeight: '900', color: '#ff007f', background: 'rgba(255,0,127,0.1)', border: '1px solid rgba(255,0,127,0.3)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.5px' }}>CLUB</span>
                        </div>
                        <div style={{ fontSize: '12px', color: C.textMuted }}>Ексклюзивні анкети DIAMOND та PREMIUM моделей — відкрити →</div>
                    </div>
                </div>
            )}

            {/* ── ОБРАНІ ── */}
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: C.text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={16} color={C.accent} fill={C.accent} /> Вибрані анкети
                    {favorites.length > 0 && <span style={{ fontSize: '12px', background: C.accent, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{favorites.length}</span>}
                </h2>

                {!hasFavAccess ? (
                    <div style={{ ...section(), textAlign: 'center', padding: '50px 24px', border: `1px dashed ${C.border}` }}>
                        <Lock size={32} color={C.textMuted} style={{ marginBottom: '12px' }} />
                        <div style={{ color: C.textSub, fontWeight: '700', marginBottom: '6px' }}>Обрані доступні від статусу GUEST</div>
                        <div style={{ color: C.textMuted, fontSize: '13px', marginBottom: '16px' }}>Активуйте преміум щоб зберігати анкети</div>
                        <button onClick={() => setShowVipModal && setShowVipModal(true)} style={{ ...btnPrimary(), margin: '0 auto', fontSize: '13px' }}>
                            <Crown size={14} /> Активувати GUEST — 499 ₴/міс
                        </button>
                    </div>
                ) : favorites.length === 0 ? (
                    <div style={{ ...section(), textAlign: 'center', padding: '50px 24px', border: `1px dashed ${C.border}` }}>
                        <Heart size={32} color={C.textMuted} style={{ marginBottom: '12px' }} />
                        <div style={{ color: C.textSub, marginBottom: '16px' }}>Список вибраних порожній</div>
                        <button onClick={() => navigate('/')} style={{ ...btnPrimary(), margin: '0 auto' }}>До каталогу</button>
                    </div>
                ) : (
                    <CatalogGrid
                        currentModels={favorites} setSelectedModel={setSelectedModel}
                        setContactSelectionModel={setContactSelectionModel}
                        t={t} currentLang={currentLang} accent={accent}
                        favorites={favorites} handleToggleFavorite={handleToggleFavorite}
                    />
                )}
            </div>
        </div>
    );
};

export default CabinetPage;