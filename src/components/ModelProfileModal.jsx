import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ShieldCheck, Send, Heart, Target, Crown, CalendarDays, Star, AlertTriangle, Sparkles } from 'lucide-react';
import useStore from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';
import { C, R, closeBtn, section, btnPrimary, btnGhost } from '../styles/ds';
import useSmoothScroll from '../hooks/useSmoothScroll';
import { toast } from 'react-hot-toast';
import PhotoLightbox from './modelProfile/PhotoLightbox';
import SocialWarningModal from './modelProfile/SocialWarningModal';
import ReviewsBlock from './modelProfile/ReviewsBlock';
import BottomCTA from './modelProfile/BottomCTA';

const ModelProfileModal = ({ model, onClose, openPrivateChat, favorites = [], handleToggleFavorite }) => {
    const { currentLang, userUniqueId, user, onlineUsers } = useStore();
    const [photoIndex, setPhotoIndex] = useState(0);
    const [showContacts, setShowContacts] = useState(false);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [dragStart, setDragStart] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const [showWarningModal, setShowWarningModal] = useState(false);
    const [selectedSocial, setSelectedSocial] = useState(null);

    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [localReviews, setLocalReviews] = useState(model?.reviews || []);
    const [localAvg, setLocalAvg] = useState(model?.averageRating || 0);
    const [localTotal, setLocalTotal] = useState(model?.totalReviews || 0);

    const scrollRef = useRef(null);
    const lightboxImgRef = useRef(null);
    const lastTouchDist = useRef(null);
    const lastTap = useRef(0);
    useSmoothScroll(scrollRef);

    const myId = user?._id || user?.id || userUniqueId;
    const ownerId = model?.userId?._id || model?.userId;
    const isOwner = Boolean(model?.isMine || (myId && ownerId && String(myId) === String(ownerId)));

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        if (model?.id && !isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            fetch(`${BASE_URL}/profiles/${model.id}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ action: 'view' }), keepalive: true
            }).catch(() => {});
        }
    }, [model?.id, isOwner]);

    useEffect(() => {
        const el = lightboxImgRef.current;
        if (!el || !lightboxOpen) return;
        const onWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setZoom(prev => Math.min(4, Math.max(1, parseFloat((prev + delta).toFixed(2)))));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [lightboxOpen]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') lightboxNext();
            if (e.key === 'ArrowLeft') lightboxPrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen, lightboxIndex]);

    const contactNetworks = [
        { id: 'Telegram', color: '#24A1DE' },
        { id: 'WhatsApp', color: '#25D366' },
        { id: 'Viber',    color: '#7360F2' },
    ];

    const handleSocialClick    = (network) => { setSelectedSocial(network); setShowWarningModal(true); };
    const handleInternalChatClick = () => {
        // Перехід = юзер написав моделі через її анкету
        if (!isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            fetch(`${BASE_URL}/profiles/${model.id}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ action: 'click' }), keepalive: true
            }).catch(() => {});
        }
        openPrivateChat(model);
        onClose();
    };

    const confirmSocialRedirect = () => {
        if (!isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            fetch(`${BASE_URL}/profiles/${model.id}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ action: 'click' }), keepalive: true
            }).catch(() => {});
        }
        setShowWarningModal(false);
        alert(`${selectedSocial}: ${model.contact || '—'}`);
    };

    const formatHeight = (h) => {
        if (!h) return '—';
        const num = parseFloat(String(h).replace(',', '.'));
        if (isNaN(num)) return h;
        return num > 3 ? (num / 100).toFixed(2) : num.toFixed(2);
    };

    const submitReview = async () => {
        if (!reviewText.trim()) { toast.error('Напишіть коментар до відгуку!'); return; }
        setIsSubmittingReview(true);
        const loadingToast = toast.loading('Публікація...');
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            const res  = await fetch(`${BASE_URL}/profiles/${model.id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rating, text: reviewText })
            });
            const data = await res.json();
            if (data.success) {
                if (data.isPending) {
                    toast.success('🛡️ Відгук відправлено на перевірку!', { id: loadingToast, duration: 5000 });
                } else {
                    toast.success('✅ Відгук опубліковано!', { id: loadingToast });
                    setLocalReviews([data.review, ...localReviews]);
                    setLocalAvg(data.averageRating);
                    setLocalTotal(data.totalReviews);
                }
                setReviewText('');
            } else {
                toast.error(`❌ ${data.message}`, { id: loadingToast });
            }
        } catch { toast.error('Помилка сервера', { id: loadingToast }); }
        finally   { setIsSubmittingReview(false); }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('🗑 Ви впевнені, що хочете видалити цей відгук?')) return;
        const loadingToast = toast.loading('Видалення...');
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            const res  = await fetch(`${BASE_URL}/profiles/${model.id}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('🗑️ Відгук видалено!', { id: loadingToast });
                setLocalReviews(localReviews.filter(r => r._id !== reviewId));
                setLocalAvg(data.averageRating);
                setLocalTotal(data.totalReviews);
            } else {
                toast.error(data.message || 'Помилка', { id: loadingToast });
            }
        } catch { toast.error('Мережева помилка', { id: loadingToast }); }
    };

    const nextPhoto = (e) => { e.stopPropagation(); if (model?.photos?.length > 0) setPhotoIndex(p => (p + 1) % model.photos.length); };
    const prevPhoto = (e) => { e.stopPropagation(); if (model?.photos?.length > 0) setPhotoIndex(p => (p - 1 + model.photos.length) % model.photos.length); };

    const openLightbox  = (i) => { setLightboxIndex(i); setZoom(1); setOffset({ x: 0, y: 0 }); setLightboxOpen(true); };
    const closeLightbox = ()  => { setLightboxOpen(false); setZoom(1); setOffset({ x: 0, y: 0 }); };
    const lightboxNext  = (e) => { e?.stopPropagation(); setLightboxIndex(p => (p + 1) % model.photos.length); setZoom(1); setOffset({ x: 0, y: 0 }); };
    const lightboxPrev  = (e) => { e?.stopPropagation(); setLightboxIndex(p => (p - 1 + model.photos.length) % model.photos.length); setZoom(1); setOffset({ x: 0, y: 0 }); };

    const handleMouseDown = (e) => { if (zoom > 1) setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); };
    const handleMouseMove = (e) => { if (dragStart && zoom > 1) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
    const handleMouseUp   = ()  => setDragStart(null);

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            lastTouchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTap.current < 300) {
                // Подвійний тап — зум туди/назад
                if (zoom > 1) { setZoom(1); setOffset({ x: 0, y: 0 }); }
                else { setZoom(2.5); }
                lastTap.current = 0;
                return;
            }
            lastTap.current = now;
            if (zoom > 1) setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
        }
    };
    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && lastTouchDist.current) {
            if (e.cancelable) e.preventDefault();
            const dist  = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const delta = dist - lastTouchDist.current;
            setZoom(p => Math.min(4, Math.max(1, +(p + delta * 0.008).toFixed(2))));
            lastTouchDist.current = dist;
        } else if (e.touches.length === 1 && dragStart && zoom > 1) {
            if (e.cancelable) e.preventDefault();
            setOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
        }
    };
    const handleTouchEnd = () => {
        lastTouchDist.current = null;
        setDragStart(null);
        if (zoom <= 1) setOffset({ x: 0, y: 0 });
    };

    if (!model) return null;

    const isFav         = favorites?.some(fav => fav.id === model.id);
    const modelFetishes = model.fetishes || [];

    const getFetishTranslation = (fKey) => {
        const cats = t[currentLang]?.fetishes || {};
        for (const cat in cats) {
            if (cats[cat].items?.[fKey]) return cats[cat].items[fKey];
        }
        return fKey;
    };

    // ── Trust ───────────────────────────────────────────────────────
    let displayTrust = 100;
    const populatedUser = typeof model?.userId === 'object' ? model.userId : null;
    const backendTrust  = populatedUser?.trustScore  ?? populatedUser?.trustPercentage;
    const storeTrust    = user?.trustScore           ?? user?.trustPercentage;
    const profileTrust  = model?.trustScore          ?? model?.trustPercentage;
    if (backendTrust != null)                    displayTrust = backendTrust;
    else if (isOwner && storeTrust != null)      displayTrust = storeTrust;
    else if (profileTrust != null)               displayTrust = profileTrust;
    let trustColor = '#10b981';
    if (displayTrust < 70) trustColor = '#f59e0b';
    if (displayTrust < 40) trustColor = '#ef4444';

    // ── Online status ────────────────────────────────────────────────
    const checkIfOnline = (t) => t && (Date.now() - new Date(t).getTime()) < 10 * 60 * 1000;
    let isModelOnline = false;
    if (ownerId && ownerId !== 'undefined' && ownerId !== 'null') {
        const sd = onlineUsers?.[ownerId];
        if (sd?.status === 'online')        isModelOnline = true;
        else if (sd?.status === 'offline')  isModelOnline = checkIfOnline(sd.lastSeen);
        else {
            const uObj = typeof model?.userId === 'object' ? model.userId : null;
            isModelOnline = checkIfOnline(uObj?.lastActive || model?.lastActive);
        }
    }

    const availableSocials = model.contactTypes?.length > 0 ? model.contactTypes
        : model.contactType ? [model.contactType] : [];

    // ── helpers ──────────────────────────────────────────────────────
    const T = (key, fallback) => t[currentLang]?.[key] || fallback;

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="fade-in-up"
                style={{ width: '100%', maxWidth: '550px', height: '100%', maxHeight: '92vh', background: '#09090b', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,1)', border: '1px solid #27272a' }}
            >
                {/* Top buttons */}
                <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', zIndex: 100 }}>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s' }} className="hover-scale">
                        <X size={20} color="white" />
                    </button>
                    {handleToggleFavorite && !isOwner && (
                        <button onClick={e => handleToggleFavorite(model, e)} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s' }} className="hover-scale">
                            <Heart size={20} color={isFav ? accent : 'white'} fill={isFav ? accent : 'none'} style={{ transition: '0.3s', transform: isFav ? 'scale(1.1)' : 'scale(1)' }} />
                        </button>
                    )}
                </div>

                {/* Scrollable content */}
                <div ref={scrollRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>

                    {/* ── Photos ── */}
                    <div
                        className="zef-profile-photo"
                        style={{ position: 'relative', width: '100%', height: '70vh', maxHeight: '560px', minHeight: '380px', background: '#0a0a0f', overflow: 'hidden', cursor: 'zoom-in' }}
                        onClick={() => model?.photos?.length > 0 && openLightbox(photoIndex)}
                    >
                        {model.photos?.length > 0 ? (
                            <>
                                <img src={model.photos[photoIndex]} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', objectPosition: 'center top', filter: 'blur(24px) brightness(0.25) saturate(1.4)', pointerEvents: 'none' }} />
                                <img src={model.photos[photoIndex]} alt={model.name} style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center top' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to top, #09090b 0%, rgba(9,9,11,0.6) 50%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
                            </>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', fontSize: '14px', letterSpacing: '2px' }}>NO MEDIA</div>
                        )}

                        {/* Zoom badge */}
                        {model.photos?.length > 0 && (
                            <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.12)', pointerEvents: 'none', letterSpacing: '0.3px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>
                                {model.photos.length > 1 ? `${photoIndex + 1} / ${model.photos.length}` : T('zoomLabel', 'Збільшити')}
                            </div>
                        )}

                        {/* Photo navigation */}
                        {model.photos?.length > 1 && (
                            <>
                                <div onClick={e => { e.stopPropagation(); prevPhoto(e); }} style={{ position: 'absolute', top: 0, left: 0, width: '45%', height: '100%', cursor: 'w-resize', zIndex: 10 }} />
                                <div onClick={e => { e.stopPropagation(); nextPhoto(e); }} style={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', cursor: 'e-resize', zIndex: 10 }} />
                                <div style={{ position: 'absolute', bottom: '18px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '5px', zIndex: 20 }}>
                                    {model.photos.map((_, i) => (
                                        <div key={i} onClick={e => { e.stopPropagation(); setPhotoIndex(i); }}
                                            style={{ width: i === photoIndex ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === photoIndex ? accent : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: i === photoIndex ? `0 0 8px ${accent}88` : 'none' }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                                        {/* ── Main info ── */}
                    <div className="zef-profile-content" style={{ padding: '24px 24px 150px 24px', position: 'relative', zIndex: 20 }}>

                        {/* Name + status */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{model.name}</h1>
                                {model.verification === 'video' && (
                                    <span title="Акаунт пройшов відеоверифікацію" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '20px', padding: '3px 10px' }}>
                                        <CheckCircle2 size={15} color="#FFD700" />
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFD700' }}>Відео-верифікація</span>
                                    </span>
                                )}
                                {model.verification === 'photo' && (
                                    <span title="Акаунт пройшов фотоверифікацію" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(192,192,192,0.12)', border: '1px solid rgba(192,192,192,0.4)', borderRadius: '20px', padding: '3px 10px' }}>
                                        <CheckCircle2 size={15} color="#C0C0C0" />
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#C0C0C0' }}>Фото-верифікація</span>
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ color: accent, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    {model.title || t[currentLang]?.genders?.[model.gender] || T('noModel', 'Модель')}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', fontSize: '13px', fontWeight: '500' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isModelOnline ? '#10b981' : '#71717a', boxShadow: isModelOnline ? '0 0 8px #10b981' : 'none' }} />
                                    {isModelOnline ? T('onlineStatus', 'Online') : T('offlineStatus', 'Offline')}
                                </span>
                            </div>
                        </div>

                        {/* Price + Trust */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>{T('priceVirtu', 'Ціна вірту')}</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                                    {T('priceFrom2', 'від')} {model.priceFrom}{model.priceTo ? ` ${T('priceTo2', 'до')} ${model.priceTo}` : ''} <span style={{ fontSize: '13px', color: '#52525b' }}>₴</span>
                                </div>
                            </div>
                            <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <ShieldCheck size={12} color={trustColor} /> {T('trust', 'Довіра')}
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: trustColor }}>{displayTrust}%</div>
                            </div>
                        </div>

                        {/* Characteristics */}
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{T('characteristics', 'Характеристики')}</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#141417', padding: '16px', borderRadius: '16px', border: '1px solid #232326', marginBottom: '12px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CalendarDays size={13} /> {T('ageLabel', 'Вік')}</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{model.age} {T('ageUnit', 'років')}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #27272a', borderRight: '1px solid #27272a' }}>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Target size={13} /> {T('heightLabel', 'Зріст')}</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{formatHeight(model.height)} {T('heightUnit', 'м')}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Crown size={13} /> {T('weightLabel', 'Вага')}</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{model.weight ? `${model.weight} ${T('weightUnit', 'кг')}` : '—'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                            <div style={{ background: '#141417', padding: '12px 16px', borderRadius: '14px', border: '1px solid #232326', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717a', fontWeight: '600' }}>{T('bodyLabel', 'Фігура')}:</span>
                                <span style={{ fontWeight: '700', color: '#fff' }}>{t[currentLang]?.bodyTypes?.[model.bodyType] || model.bodyType || '—'}</span>
                            </div>
                            <div style={{ background: '#141417', padding: '12px 16px', borderRadius: '14px', border: '1px solid #232326', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717a', fontWeight: '600' }}>{T('hairLabel', 'Волосся')}:</span>
                                <span style={{ fontWeight: '700', color: '#fff' }}>{t[currentLang]?.hairColors?.[model.hairColor] || model.hairColor || '—'}</span>
                            </div>
                        </div>

                        {/* About */}
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>{T('aboutMe', 'Про мене')}</h3>
                            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-line', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid #1c1c1f' }}>
                                {model.bio || model.desc || T('descPlaceholder', 'Опис готується до публікації...')}
                            </p>
                        </div>

                        {/* Fetishes */}
                        {modelFetishes.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>{T('myPrefs', 'Послуги які я надаю')}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {modelFetishes.map(f => (
                                        <span key={f} style={{ background: '#141417', border: '1px solid #232326', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', color: '#e4e4e7', fontWeight: '500' }}>
                                            {getFetishTranslation(f)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <ReviewsBlock
                            localReviews={localReviews} localAvg={localAvg} localTotal={localTotal}
                            rating={rating} setRating={setRating}
                            reviewText={reviewText} setReviewText={setReviewText}
                            isSubmittingReview={isSubmittingReview}
                            submitReview={submitReview} handleDeleteReview={handleDeleteReview}
                            isOwner={isOwner} user={user}
                        />

                    </div>
                </div>

                <BottomCTA
                    isOwner={isOwner} showContacts={showContacts} setShowContacts={setShowContacts}
                    availableSocials={availableSocials} contactNetworks={contactNetworks}
                    handleInternalChatClick={handleInternalChatClick} handleSocialClick={handleSocialClick}
                    accent={accent}
                />
            </div>

            {/* ── Lightbox (верхній рівень — перекриває весь екран на мобілці) ── */}
            {lightboxOpen && (
                <PhotoLightbox
                    photos={model.photos}
                    index={lightboxIndex} setIndex={setLightboxIndex}
                    zoom={zoom} setZoom={setZoom}
                    offset={offset} setOffset={setOffset}
                    onClose={closeLightbox}
                    onNext={lightboxNext} onPrev={lightboxPrev}
                    imgRef={lightboxImgRef}
                    dragStart={dragStart}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    accent={accent}
                />
            )}

            {/* ── Warning modal ── */}
            <SocialWarningModal
                open={showWarningModal}
                selectedSocial={selectedSocial}
                onClose={() => setShowWarningModal(false)}
                onGoToInternal={handleInternalChatClick}
                onConfirmRedirect={confirmSocialRedirect}
            />

                        <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
                .hover-scale:hover  { transform: scale(1.02); }
                .focus-accent-border:focus { border-color: ${accent} !important; box-shadow: 0 0 10px ${accent}33; }
                .custom-scrollbar::-webkit-scrollbar       { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #232326; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ModelProfileModal;