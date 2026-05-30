import React, { useEffect, useState } from 'react';
import { X, Crown, Diamond, Star, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';

const BASE_URL_MEDIA = () => {
    const envApi = import.meta.env.VITE_API_URL || '';
    return envApi ? envApi.replace(/\/api\/?$/, '') : `http://${window.location.hostname}:5000`;
};

const getPhotoSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL_MEDIA()}${url}`;
};

// Рівень VIP моделі → стиль картки
const TIER_STYLE = {
    3: { label: 'DIAMOND', color: '#00ffff', glow: 'rgba(0,255,255,0.25)', border: 'rgba(0,255,255,0.4)', icon: <Diamond size={14} color="#00ffff" /> },
    2: { label: 'PREMIUM', color: '#ffd700', glow: 'rgba(255,215,0,0.25)', border: 'rgba(255,215,0,0.4)', icon: <Crown size={14} color="#ffd700" /> },
};

const ModelCard = ({ model, onOpen }) => {
    const tier = TIER_STYLE[model.vLevel] || TIER_STYLE[2];
    const photo = getPhotoSrc(model.photos?.[0]);

    return (
        <div
            onClick={() => onOpen(model)}
            style={{
                position: 'relative', borderRadius: '20px', overflow: 'hidden',
                background: '#0a0a12', cursor: 'pointer',
                border: `1px solid ${tier.border}`,
                boxShadow: `0 0 30px ${tier.glow}`,
                transition: 'transform 0.25s, box-shadow 0.25s',
                aspectRatio: '3/4',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${tier.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 0 30px ${tier.glow}`; }}
        >
            {/* ФОТО */}
            {photo
                ? <img src={photo} alt={model.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Crown size={40} color="#333" /></div>
            }

            {/* ГРАДІЄНТ ЗНИЗУ */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)' }} />

            {/* VIP БЕЙДЖ (зверху) */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.7)', border: `1px solid ${tier.border}`, borderRadius: '8px', padding: '4px 10px', backdropFilter: 'blur(4px)' }}>
                {tier.icon}
                <span style={{ fontSize: '10px', fontWeight: '900', color: tier.color, letterSpacing: '0.5px' }}>{tier.label}</span>
            </div>

            {/* ВЕРИФІКАЦІЯ */}
            {model.verification !== 'none' && (
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <CheckCircle2 size={20} color={model.verification === 'video' ? '#FFD700' : '#C0C0C0'} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                </div>
            )}

            {/* ІНФО ЗНИЗУ */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '17px', fontWeight: '900', color: '#fff' }}>{model.name}</span>
                    {model.age && <span style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>{model.age}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: tier.color, fontWeight: '700' }}>
                        від {model.priceFrom?.toLocaleString()} ₴
                    </span>
                    {model.totalReviews > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} color="#ffc107" fill="#ffc107" />
                            <span style={{ fontSize: '12px', color: '#ffc107', fontWeight: '700' }}>
                                {model.averageRating?.toFixed(1)} ({model.totalReviews})
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const VipLoungeModal = ({ onClose, setSelectedModel, setContactSelectionModel }) => {
    const { loadLounge, userRole, user } = useStore();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noAccess, setNoAccess] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await loadLounge();
            if (data === null) {
                setNoAccess(true);
            } else {
                setModels(data);
            }
            setLoading(false);
        })();
    }, [loadLounge]);

    const handleOpenModel = (model) => {
        setSelectedModel(model);
        // не закриваємо лаунж — модалка профілю відкривається поверх
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', flexDirection: 'column' }}>
            {/* OVERLAY */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 2, 8, 0.97)', backdropFilter: 'blur(20px)' }} onClick={onClose} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '30px clamp(16px, 4vw, 50px) 40px' }}>

                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexShrink: 0 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,0,127,0.12)', border: '1px solid rgba(255,0,127,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Crown size={24} color="#ff007f" />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                                VIP Лаунж
                            </h1>
                            <div style={{ background: 'rgba(255,0,127,0.1)', border: '1px solid rgba(255,0,127,0.35)', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: '900', color: '#ff007f', letterSpacing: '1px' }}>
                                CONCIERGE
                            </div>
                        </div>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: '500' }}>
                            Ексклюзивні анкети топ-моделей DIAMOND та PREMIUM — тільки для членів клубу
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        className="menu-hover"
                    >
                        <X size={20} color="#888" />
                    </button>
                </div>

                {/* РОЗДІЛОВА ЛІНІЯ */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,0,127,0.4), rgba(0,255,255,0.4), transparent)', marginBottom: '36px', flexShrink: 0 }} />

                {/* КОНТЕНТ */}
                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
                            <Loader2 size={40} color="#ff007f" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ color: '#666', fontSize: '14px', fontWeight: '600', letterSpacing: '1px' }}>ЗАВАНТАЖЕННЯ...</span>
                        </div>
                    ) : noAccess ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', gap: '20px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,0,127,0.08)', border: '1px solid rgba(255,0,127,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Lock size={36} color="#ff007f" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: '900', color: 'white' }}>Закрито для вас</h3>
                                <p style={{ margin: 0, color: '#666', fontSize: '14px', maxWidth: '400px', lineHeight: '1.6' }}>
                                    VIP Лаунж доступний клієнтам зі статусом <span style={{ color: '#ff007f', fontWeight: '800' }}>CONCIERGE</span> та моделям зі статусом <span style={{ color: '#00ffff', fontWeight: '800' }}>DIAMOND</span> / <span style={{ color: '#ffd700', fontWeight: '800' }}>PREMIUM</span>.
                                </p>
                            </div>
                        </div>
                    ) : models.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', color: '#444', fontSize: '14px', fontWeight: '600' }}>
                            Поки що немає моделей у лаунжі
                        </div>
                    ) : (
                        <>
                            {/* DIAMOND секція */}
                            {models.filter(m => m.vLevel === 3).length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <Diamond size={18} color="#00ffff" />
                                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#00ffff', letterSpacing: '2px', textTransform: 'uppercase' }}>Diamond</span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(0,255,255,0.15)' }} />
                                        <span style={{ fontSize: '11px', color: '#555', fontWeight: '600' }}>{models.filter(m => m.vLevel === 3).length} анкет</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                        {models.filter(m => m.vLevel === 3).map(m => (
                                            <ModelCard key={m.id || m._id} model={m} onOpen={handleOpenModel} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PREMIUM секція */}
                            {models.filter(m => m.vLevel === 2).length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <Crown size={18} color="#ffd700" />
                                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#ffd700', letterSpacing: '2px', textTransform: 'uppercase' }}>Premium</span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,215,0,0.15)' }} />
                                        <span style={{ fontSize: '11px', color: '#555', fontWeight: '600' }}>{models.filter(m => m.vLevel === 2).length} анкет</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                        {models.filter(m => m.vLevel === 2).map(m => (
                                            <ModelCard key={m.id || m._id} model={m} onOpen={handleOpenModel} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VipLoungeModal;