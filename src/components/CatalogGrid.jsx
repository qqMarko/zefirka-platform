import React from 'react';
import { ShieldCheck, CheckCircle2, Heart, MessageCircle, Rocket, Crown, Gem, Star } from 'lucide-react';
import useStore from '../store/useStore';

/* ─────────────────────────────────────────────────────────────────
   CSS-анімації для VIP-рамок (ін'єктуються один раз)
───────────────────────────────────────────────────────────────── */
const VIP_STYLES = `
  /* ── DIAMOND: rainbow rotate ── */
  @keyframes diamondSpin {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes diamondGlow {
    0%, 100% { box-shadow: 0 0 18px 3px rgba(0,255,255,.55), 0 0 40px 6px rgba(180,0,255,.25); }
    33%       { box-shadow: 0 0 18px 3px rgba(255,0,200,.55), 0 0 40px 6px rgba(0,255,200,.25); }
    66%       { box-shadow: 0 0 18px 3px rgba(80,0,255,.55),  0 0 40px 6px rgba(0,200,255,.25); }
  }
  .border-diamond {
    background: linear-gradient(135deg, #00ffff, #ff00cc, #7b00ff, #00ffff, #ff00cc);
    background-size: 400% 400%;
    animation: diamondSpin 4s linear infinite, diamondGlow 4s ease-in-out infinite;
    padding: 2.5px;
    border-radius: 22px;
  }

  /* ── PREMIUM: gold shimmer ── */
  @keyframes goldShimmer {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes goldGlow {
    0%, 100% { box-shadow: 0 0 16px 2px rgba(255,200,0,.5), 0 0 35px 4px rgba(255,140,0,.2); }
    50%       { box-shadow: 0 0 24px 4px rgba(255,220,0,.7), 0 0 50px 8px rgba(255,160,0,.35); }
  }
  .border-premium {
    background: linear-gradient(135deg, #ffd700, #ff8c00, #ffe066, #ffd700);
    background-size: 300% 300%;
    animation: goldShimmer 3s ease infinite, goldGlow 2.5s ease-in-out infinite;
    padding: 2px;
    border-radius: 22px;
  }

  /* ── START: rose-purple pulse ── */
  @keyframes startGlow {
    0%, 100% { box-shadow: 0 0 12px 1px rgba(255,0,127,.35), 0 0 28px 3px rgba(120,0,200,.15); }
    50%       { box-shadow: 0 0 18px 2px rgba(255,0,127,.6),  0 0 38px 5px rgba(150,0,220,.3);  }
  }
  .border-start {
    background: linear-gradient(135deg, #ff007f, #9c27b0, #ff4081, #7b1fa2);
    animation: startGlow 3s ease-in-out infinite;
    padding: 1.5px;
    border-radius: 22px;
  }

  /* ── BUMP: fire orange pulse ── */
  @keyframes fireGlow {
    0%, 100% { box-shadow: 0 0 12px 2px rgba(255,100,0,.5),  0 0 25px 3px rgba(255,50,0,.2); }
    50%       { box-shadow: 0 0 20px 4px rgba(255,150,0,.75), 0 0 40px 6px rgba(255,80,0,.4); }
  }
  @keyframes rocketBounce {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-3px); }
  }
  .border-bump {
    background: linear-gradient(135deg, #ff6600, #ff9800, #ffcc00, #ff6600);
    animation: fireGlow 1.8s ease-in-out infinite;
    padding: 1.5px;
    border-radius: 22px;
  }
  .badge-rocket { animation: rocketBounce 1.2s ease-in-out infinite; }

  /* ── PREMIUM badge shine ── */
  @keyframes badgeShine {
    0%   { left: -60%; }
    100% { left: 130%; }
  }
  .badge-premium-shine::after {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
    transform: skewX(-15deg);
    animation: badgeShine 2.5s ease-in-out infinite;
  }
  .badge-premium-shine { position: relative; overflow: hidden; }

  /* ── DIAMOND badge RGB text ── */
  @keyframes rgbText {
    0%   { filter: hue-rotate(0deg);   }
    100% { filter: hue-rotate(360deg); }
  }
  .badge-diamond-text { animation: rgbText 3s linear infinite; }

  /* Hover lift */
  .model-card-wrap { transition: transform .3s cubic-bezier(.175,.885,.32,1.275); }
  .model-card-wrap:hover { transform: translateY(-6px); }
`;

/* ─────────────────────────────────────────────────────────────────
   Конфіг рамки / бейджа для кожного статусу
───────────────────────────────────────────────────────────────── */
function getCardConfig(m) {
    const now = Date.now();
    const isBumped = m.bumpedAt && m.bumpExpiresAt && new Date(m.bumpExpiresAt) > now;

    if (m.vLevel === 3) return {
        wrapClass: 'border-diamond model-card-wrap',
        innerBg: 'linear-gradient(180deg, #05050d 0%, #0a0a14 100%)',
        badge: (
            <div className="badge-diamond-text" style={{
                position: 'absolute', top: 14, left: 14, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg,#001a1a,#003333)',
                border: '1px solid rgba(0,255,255,.5)',
                padding: '6px 13px', borderRadius: 10,
                fontSize: 11, fontWeight: 900, letterSpacing: '1px',
                color: '#00ffff',
                boxShadow: '0 2px 12px rgba(0,255,255,.4), inset 0 1px 0 rgba(0,255,255,.2)',
            }}>
                <Gem size={13} /> DIAMOND
            </div>
        ),
    };

    if (m.vLevel === 2) return {
        wrapClass: 'border-premium model-card-wrap',
        innerBg: 'linear-gradient(180deg, #0a0800 0%, #0d0a00 100%)',
        badge: (
            <div className="badge-premium-shine" style={{
                position: 'absolute', top: 14, left: 14, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #3d2600, #5c3800)',
                border: '1px solid rgba(255,200,0,.6)',
                padding: '6px 13px', borderRadius: 10,
                fontSize: 11, fontWeight: 900, letterSpacing: '1px',
                color: '#ffd700',
                boxShadow: '0 2px 12px rgba(255,180,0,.45), inset 0 1px 0 rgba(255,230,0,.2)',
            }}>
                <Crown size={13} /> PREMIUM
            </div>
        ),
    };

    if (m.vLevel === 1) return {
        wrapClass: 'border-start model-card-wrap',
        innerBg: 'linear-gradient(180deg, #0d0009 0%, #0a0010 100%)',
        badge: (
            <div style={{
                position: 'absolute', top: 14, left: 14, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #2d0020, #1a0030)',
                border: '1px solid rgba(255,0,127,.5)',
                padding: '6px 13px', borderRadius: 10,
                fontSize: 11, fontWeight: 900, letterSpacing: '1px',
                color: '#ff69b4',
                boxShadow: '0 2px 12px rgba(255,0,127,.35), inset 0 1px 0 rgba(255,100,180,.15)',
            }}>
                <Star size={13} /> START
            </div>
        ),
    };

    if (isBumped) return {
        wrapClass: 'border-bump model-card-wrap',
        innerBg: 'linear-gradient(180deg, #0d0600 0%, #0a0500 100%)',
        badge: (
            <div className="badge-rocket" style={{
                position: 'absolute', top: 14, left: 14, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #3d1a00, #5c2800)',
                border: '1px solid rgba(255,140,0,.6)',
                padding: '6px 13px', borderRadius: 10,
                fontSize: 11, fontWeight: 900, letterSpacing: '1px',
                color: '#ff9800',
                boxShadow: '0 2px 14px rgba(255,120,0,.5), inset 0 1px 0 rgba(255,200,0,.2)',
            }}>
                <Rocket size={13} /> В ТОПІ
            </div>
        ),
    };

    // Звичайна безкоштовна анкета
    return {
        wrapClass: 'model-card-wrap',
        innerBg: '#0a0a0f',
        border: '1px solid rgba(255,255,255,0.06)',
        badge: null,
        vipColor: null,
        bottomBg: '#0a0a0f',
        tagBorder: 'rgba(255,255,255,0.07)',
        tagColor: '#888',
    };
}

function getTierColors(m) {
    const now = Date.now();
    const isBumped = m.bumpedAt && m.bumpExpiresAt && new Date(m.bumpExpiresAt) > now;
    if (m.vLevel === 3) return { main: '#00ffff', glow: 'rgba(0,255,255,0.12)', bottomBg: 'linear-gradient(180deg,#030e0e,#050a10)', tagBg: 'rgba(0,255,255,0.07)', tagBorder: 'rgba(0,255,255,0.2)', tagColor: '#7fffff', btn: 'linear-gradient(135deg,#00c8c8,#0070ff)', btnColor: '#000' };
    if (m.vLevel === 2) return { main: '#ffd700', glow: 'rgba(255,200,0,0.12)', bottomBg: 'linear-gradient(180deg,#0e0b00,#0a0800)', tagBg: 'rgba(255,200,0,0.07)', tagBorder: 'rgba(255,200,0,0.2)', tagColor: '#e8c000', btn: 'linear-gradient(135deg,#ffd700,#ff8c00)', btnColor: '#000' };
    if (m.vLevel === 1) return { main: '#ff69b4', glow: 'rgba(255,0,127,0.12)', bottomBg: 'linear-gradient(180deg,#0e0008,#0a0010)', tagBg: 'rgba(255,0,127,0.07)', tagBorder: 'rgba(255,0,127,0.2)', tagColor: '#ff80c0', btn: 'linear-gradient(135deg,#ff007f,#9c27b0)', btnColor: '#fff' };
    if (isBumped) return { main: '#ff9800', glow: 'rgba(255,120,0,0.12)', bottomBg: 'linear-gradient(180deg,#0e0600,#0a0500)', tagBg: 'rgba(255,120,0,0.07)', tagBorder: 'rgba(255,120,0,0.2)', tagColor: '#ffaa44', btn: 'linear-gradient(135deg,#ff6600,#ffcc00)', btnColor: '#000' };
    return { main: null, glow: null, bottomBg: '#0a0a0f', tagBg: 'rgba(255,255,255,0.04)', tagBorder: 'rgba(255,255,255,0.07)', tagColor: '#888', btn: null, btnColor: '#fff' };
}

/* ─────────────────────────────────────────────────────────────────
   Компонент
───────────────────────────────────────────────────────────────── */
const CatalogGrid = ({
    currentModels, setSelectedModel, setContactSelectionModel,
    t, currentLang, accent,
    favorites = [], handleToggleFavorite,
}) => {
    const { userUniqueId, user, onlineUsers } = useStore();
    const myId = user?._id || user?.id || userUniqueId;

    const getFetishTranslation = (fKey) => {
        const categories = t[currentLang]?.fetishes || {};
        for (let cat in categories) {
            if (categories[cat].items?.[fKey]) return categories[cat].items[fKey];
        }
        return fKey;
    };

    const checkIfOnline = (lastActiveDate) => {
        if (!lastActiveDate) return false;
        const diff = Date.now() - new Date(lastActiveDate).getTime();
        if (isNaN(diff)) return false;
        return Math.abs(diff) < 10 * 60 * 1000;
    };

    return (
        <>
            {/* Глобальні стилі рамок — рендеримось один раз */}
            <style>{VIP_STYLES}</style>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                {currentModels.map(m => {
                    const isFav    = favorites?.some(fav => fav.id === m.id);
                    const ownerId  = m.userId?._id ? String(m.userId._id) : String(m.userId);
                    const isOwner  = Boolean(myId && ownerId && String(myId) === ownerId);
                    const cfg      = getCardConfig(m);
                    const tc       = getTierColors(m);

                    /* ── Онлайн-статус ─────────────────────────── */
                    let displayOnline = false;
                    if (ownerId && ownerId !== 'undefined') {
                        const sd = onlineUsers[ownerId];
                        if (sd?.status === 'online') {
                            displayOnline = true;
                        } else if (sd?.status === 'offline') {
                            displayOnline = checkIfOnline(sd.lastSeen);
                        } else {
                            const userObj  = isOwner ? user : (typeof m.userId === 'object' ? m.userId : null);
                            displayOnline  = checkIfOnline(userObj?.lastActive || m.lastActive);
                        }
                    }

                    /* ── Рейтинг довіри ────────────────────────── */
                    const populatedUser = typeof m.userId === 'object' ? m.userId : null;
                    let displayTrust    = populatedUser?.trustScore ?? populatedUser?.trustPercentage
                                       ?? (isOwner ? (user?.trustScore ?? user?.trustPercentage) : null)
                                       ?? m.trustScore ?? m.trustPercentage ?? 100;
                    let trustColor = '#4caf50';
                    if (displayTrust < 70) trustColor = '#ffb300';
                    if (displayTrust < 40) trustColor = '#ff4444';

                    /* ── Колір checkmark ───────────────────────── */
                    const checkColor = m.vLevel === 3 ? '#00ffff'
                                     : m.vLevel === 2 ? '#ffd700'
                                     : m.vLevel === 1 ? '#ff69b4'
                                     : accent;

                    /* ── Рамка/обгортка ────────────────────────── */
                    const isVip    = m.vLevel > 0;
                    const now      = Date.now();
                    const isBumped = m.bumpedAt && m.bumpExpiresAt && new Date(m.bumpExpiresAt) > now;

                    /* Якщо є VIP або бамп — gradient-border trick */
                    const needsGradBorder = isVip || isBumped;

                    const CardInner = (
                        <div style={{
                            backgroundColor: cfg.innerBg || '#0a0a0f',
                            borderRadius: needsGradBorder ? 20 : 20,
                            overflow: 'hidden',
                            border: cfg.border || 'none',
                            position: 'relative',
                            height: '100%',
                        }}>
                            {/* Бейдж VIP / бамп */}
                            {cfg.badge}

                            {/* Кнопка обраного */}
                            {handleToggleFavorite && !isOwner && (
                                <div
                                    onClick={(e) => handleToggleFavorite(m, e)}
                                    style={{
                                        position: 'absolute', top: 14, right: 14, zIndex: 10,
                                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: 10, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: '0.3s',
                                    }}
                                    className="menu-hover"
                                >
                                    <Heart size={20} color={isFav ? accent : 'white'} fill={isFav ? accent : 'none'} style={{ transition: 'all .3s', transform: isFav ? 'scale(1.1)' : 'scale(1)' }} />
                                </div>
                            )}

                            {/* Фото */}
                            <div
                                onClick={() => setSelectedModel(m)}
                                style={{ position: 'relative', height: 380, overflow: 'hidden', background: '#111', cursor: 'pointer' }}
                            >
                                {m.photos?.length > 0 ? (
                                    <img
                                        src={m.photos[0]}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', transition: 'transform .7s ease' }}
                                        alt={m.name}
                                        className="card-img"
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>NO PHOTO</div>
                                )}

                                {/* Gradient overlay */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,1) 0%, rgba(5,5,8,0.4) 50%, transparent 100%)', pointerEvents: 'none' }} />

                                {/* Ім'я + онлайн + ціна */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ color: 'white', fontSize: 24, fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,.8)' }}>{m.name}</span>
                                                {m.vLevel > 0 && <CheckCircle2 size={18} color={checkColor} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }} />}
                                            </div>
                                            <div style={{ color: '#ddd', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{
                                                    display: 'inline-block', width: 8, height: 8,
                                                    background: displayOnline ? '#4CAF50' : '#666',
                                                    borderRadius: '50%',
                                                    boxShadow: displayOnline ? '0 0 8px #4CAF50' : 'none',
                                                    transition: 'background-color .3s',
                                                }} />
                                                {displayOnline ? (t[currentLang]?.onlineStatus || 'Онлайн') : (t[currentLang]?.offlineStatus || 'Офлайн')}
                                                <span style={{ color: '#888' }}>•</span>
                                                {m.age} {t[currentLang]?.age || 'років'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: accent, textShadow: '0 2px 10px rgba(0,0,0,.8)' }}>
                                                {m.priceFrom} <span style={{ fontSize: 12, color: '#ccc' }}>UAH</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Теги + кнопки */}
                            <div style={{
                                padding: '16px 18px 18px',
                                background: tc.bottomBg,
                                borderTop: tc.main ? `1px solid ${tc.main}1a` : '1px solid rgba(255,255,255,0.04)',
                            }}>
                                {/* Теги */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, minHeight: 50 }}>
                                    {m.fetishes?.slice(0, 4).map((f, i) => (
                                        <span key={i} style={{
                                            fontSize: 11, fontWeight: 600,
                                            color: tc.tagColor,
                                            background: tc.tagBg,
                                            padding: '5px 11px',
                                            borderRadius: 8,
                                            border: `1px solid ${tc.tagBorder}`,
                                            letterSpacing: '0.2px',
                                        }}>
                                            {getFetishTranslation(f)}
                                        </span>
                                    ))}
                                    {m.fetishes?.length > 4 && (
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: tc.main || accent,
                                            background: `${tc.main || accent}12`,
                                            padding: '5px 10px',
                                            borderRadius: 8,
                                            border: `1px solid ${tc.main || accent}30`,
                                        }}>
                                            +{m.fetishes.length - 4}
                                        </span>
                                    )}
                                </div>

                                {/* Кнопка + довіра */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                                    {isOwner ? (
                                        <div style={{
                                            padding: '12px 16px',
                                            background: tc.main ? `${tc.main}0d` : '#18181b',
                                            border: `1px solid ${tc.main ? tc.main + '30' : '#27272a'}`,
                                            color: tc.main || '#a1a1aa',
                                            fontWeight: 700, fontSize: 13,
                                            borderRadius: 12,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        }}>
                                            <ShieldCheck size={16} /> Ваша анкета
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setContactSelectionModel(m); }}
                                            style={{
                                                padding: '12px 16px',
                                                background: tc.btn || `linear-gradient(45deg, ${accent}, #ff4081)`,
                                                border: 'none',
                                                color: tc.btnColor || 'white',
                                                fontWeight: 800, fontSize: 13,
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                                boxShadow: tc.main ? `0 4px 18px ${tc.main}35` : `0 4px 15px ${accent}44`,
                                                transition: 'all .25s',
                                                letterSpacing: '0.3px',
                                            }}
                                            className="menu-hover"
                                        >
                                            <MessageCircle size={15} /> {t[currentLang]?.write || 'Написати'}
                                        </button>
                                    )}

                                    {/* Рейтинг довіри */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: `${trustColor}10`,
                                        padding: '0 14px',
                                        borderRadius: 12,
                                        border: `1px solid ${trustColor}28`,
                                        gap: 5,
                                        cursor: 'help',
                                        minWidth: 68,
                                    }} title={t[currentLang]?.trustScore}>
                                        <ShieldCheck size={15} color={trustColor} />
                                        <span style={{ fontSize: 13, color: trustColor, fontWeight: 700 }}>{displayTrust}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );

                    /* ── Обгортка: gradient border або звичайна ── */
                    return needsGradBorder ? (
                        <div key={m.id || m._id} className={cfg.wrapClass}>
                            {CardInner}
                        </div>
                    ) : (
                        <div key={m.id || m._id} className={cfg.wrapClass} style={{ borderRadius: 20 }}>
                            {CardInner}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default CatalogGrid;