import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ShieldCheck, Send, Heart, Target, Crown, CalendarDays, Star, AlertTriangle, Sparkles } from 'lucide-react';
import useStore from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';
import { C, R, closeBtn, section, btnPrimary, btnGhost } from '../styles/ds';
import useSmoothScroll from '../hooks/useSmoothScroll';
import { toast } from 'react-hot-toast';

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
    const handleInternalChatClick = () => { openPrivateChat(model); onClose(); };

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
        if (e.touches.length === 2)
            lastTouchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };
    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && lastTouchDist.current) {
            const dist  = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const delta = dist - lastTouchDist.current;
            setZoom(p => Math.min(4, Math.max(1, p + delta * 0.01)));
            lastTouchDist.current = dist;
        }
    };
    const handleTouchEnd = () => { lastTouchDist.current = null; };

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
                        style={{ position: 'relative', width: '100%', aspectRatio: '3/4', maxHeight: '560px', background: '#0a0a0f', overflow: 'hidden', cursor: 'zoom-in' }}
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
                            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.12)', pointerEvents: 'none', letterSpacing: '0.3px' }}>
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

                    {/* ── Lightbox ── */}
                    {lightboxOpen && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeLightbox}>
                            <button onClick={closeLightbox} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', zIndex: 10, backdropFilter: 'blur(8px)' }}>✕</button>

                            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                {model.photos.length > 1 && (
                                    <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '700', backdropFilter: 'blur(8px)' }}>
                                        {lightboxIndex + 1} / {model.photos.length}
                                    </div>
                                )}
                                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '700', backdropFilter: 'blur(8px)' }}>
                                    {Math.round(zoom * 100)}%
                                </div>
                            </div>

                            {/* Zoom controls */}
                            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
                                <button onClick={e => { e.stopPropagation(); setZoom(p => Math.max(1, +(p - 0.5).toFixed(1))); if (zoom <= 1.5) setOffset({ x: 0, y: 0 }); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>−</button>
                                <button onClick={e => { e.stopPropagation(); setZoom(1); setOffset({ x: 0, y: 0 }); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '0 16px', height: '44px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(8px)' }}>
                                    {T('resetZoom', 'СКИНУТИ')}
                                </button>
                                <button onClick={e => { e.stopPropagation(); setZoom(p => Math.min(4, +(p + 0.5).toFixed(1))); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>+</button>
                            </div>

                            {/* Prev/Next arrows */}
                            {model.photos.length > 1 && (
                                <>
                                    <button onClick={e => { e.stopPropagation(); lightboxPrev(e); }} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '52px', height: '52px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '22px', backdropFilter: 'blur(8px)' }}>‹</button>
                                    <button onClick={e => { e.stopPropagation(); lightboxNext(e); }} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '52px', height: '52px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '22px', backdropFilter: 'blur(8px)' }}>›</button>
                                </>
                            )}

                            {/* Photo itself */}
                            <div
                                ref={lightboxImgRef}
                                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
                                onClick={e => e.stopPropagation()}
                                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                            >
                                <img
                                    src={model.photos[lightboxIndex]} alt={model.name} draggable={false}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`, transition: dragStart ? 'none' : 'transform 0.15s ease', userSelect: 'none', borderRadius: zoom === 1 ? '8px' : '0' }}
                                />
                            </div>

                            {/* Thumbnails */}
                            {model.photos.length > 1 && (
                                <div style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10, padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', backdropFilter: 'blur(8px)' }} onClick={e => e.stopPropagation()}>
                                    {model.photos.map((photo, i) => (
                                        <div key={i} onClick={() => { setLightboxIndex(i); setZoom(1); setOffset({ x: 0, y: 0 }); }}
                                            style={{ width: i === lightboxIndex ? '52px' : '44px', height: i === lightboxIndex ? '52px' : '44px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === lightboxIndex ? accent : 'transparent'}`, transition: '0.2s', flexShrink: 0, opacity: i === lightboxIndex ? 1 : 0.55 }}
                                        >
                                            <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Main info ── */}
                    <div style={{ padding: '24px 24px 150px 24px', position: 'relative', zIndex: 20 }}>

                        {/* Name + status */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{model.name}</h1>
                                {model.vLevel > 0 && <CheckCircle2 size={22} color="#10b981" />}
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
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>{T('myPrefs', 'Мої переваги')}</h3>
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
                        <div style={{ borderTop: '1px solid #27272a', paddingTop: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>{T('reviewsTitle', 'Відгуки клієнтів')}</h3>
                                <span style={{ color: '#71717a', fontSize: '14px', fontWeight: '600' }}>{T('reviewsTotal', 'Всього')}: {localTotal}</span>
                            </div>

                            {/* Average rating */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#141417', padding: '16px', borderRadius: '16px', border: '1px solid #232326', marginBottom: '24px' }}>
                                <div style={{ fontSize: '38px', fontWeight: '900', color: '#f59e0b', lineHeight: 1, letterSpacing: '-1px' }}>
                                    {localAvg > 0 ? localAvg.toFixed(1) : '0.0'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                                        {[1,2,3,4,5].map(s => <Star key={s} size={15} color={s <= Math.round(localAvg) ? '#f59e0b' : '#27272a'} fill={s <= Math.round(localAvg) ? '#f59e0b' : 'none'} />)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#71717a', fontWeight: '600' }}>{T('reviewsRating', 'Загальна оцінка на основі відгуків')}</div>
                                </div>
                            </div>

                            {/* Write review */}
                            {!isOwner && (
                                <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                                        {[1,2,3,4,5].map(s => (
                                            <Star key={s} size={24} onClick={() => setRating(s)} color={s <= rating ? '#f59e0b' : '#3f3f46'} fill={s <= rating ? '#f59e0b' : 'none'} style={{ cursor: 'pointer', transition: '0.2s' }} />
                                        ))}
                                    </div>
                                    <textarea
                                        value={reviewText} onChange={e => setReviewText(e.target.value)}
                                        placeholder={T('reviewPlaceholder', 'Поділіться досвідом співпраці...')}
                                        style={{ width: '100%', background: '#09090b', border: '1px solid #232326', color: '#fff', padding: '12px', borderRadius: '12px', minHeight: '80px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' }}
                                        className="focus-accent-border"
                                    />
                                    <button onClick={submitReview} disabled={isSubmittingReview} style={{ width: '100%', padding: '14px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '12px', fontWeight: '800', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontSize: '14px', transition: '0.2s' }}>
                                        {isSubmittingReview ? T('reviewProcessing', 'ОБРОБКА...') : T('reviewSubmit', 'ЗАЛИШИТИ ВІДГУК')}
                                    </button>
                                </div>
                            )}

                            {/* Review list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {localReviews.length > 0 ? (
                                    localReviews.filter(r => isOwner || r.status !== 'pending').map((review, i) => (
                                        <div key={i} style={{ background: '#141417', borderRadius: '16px', padding: '16px', border: '1px solid #232326', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{review.clientName}</div>
                                                    {review.status === 'pending' && (
                                                        <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
                                                            {T('reviewPending', 'НА ПЕРЕВІРЦІ')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ color: '#52525b', fontSize: '12px' }}>{new Date(review.date).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                                {[1,2,3,4,5].map(s => <Star key={s} size={14} color={s <= review.rating ? '#f59e0b' : '#27272a'} fill={s <= review.rating ? '#f59e0b' : 'none'} />)}
                                            </div>
                                            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{review.text}</p>
                                            {isOwner && user?.vipPackage === 'diamond' && (
                                                <button onClick={() => handleDeleteReview(review._id)} className="hover-scale"
                                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
                                                    🗑 {T('reviewDelete', 'Видалити')}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '20px' }}>
                                        {T('reviewEmptyText', 'Ще немає відгуків. Будьте першим!')}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Bottom CTA ── */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px 24px', background: 'linear-gradient(0deg, #09090b 80%, rgba(9,9,11,0) 100%)', zIndex: 100 }}>
                    {isOwner ? (
                        <div style={{ ...section(), padding: '16px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: C.textSub, fontSize: '14px', fontWeight: '700' }}>
                            <ShieldCheck size={20} color="#71717a" /> {T('thisIsYourCard', 'ЦЕ ВАША АНКЕТА')}
                        </div>
                    ) : !showContacts ? (
                        <button onClick={() => setShowContacts(true)} style={{ width: '100%', padding: '18px', background: accent, border: 'none', borderRadius: '16px', color: '#000', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: `0 10px 30px ${accent}66` }} className="hover-scale">
                            <Sparkles size={20} /> {T('initChat', 'ІНІЦІЮВАТИ СПІЛКУВАННЯ')}
                        </button>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: availableSocials.length === 0 ? '1fr' : '1fr 1fr', gap: '12px', animation: 'fadeInUp 0.3s ease' }}>
                            <button onClick={handleInternalChatClick} style={{ padding: '14px', background: C.surface2, border: `1px solid ${accent}44`, borderRadius: R.sm, color: C.text, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontFamily: 'inherit', transition: 'border-color 0.18s' }}>
                                <ShieldCheck size={24} color={accent} />
                                <div style={{ fontSize: '13px', fontWeight: '700' }}>{T('internalChat', 'Внутрішній Чат')}</div>
                            </button>
                            {availableSocials.length > 0 ? (
                                availableSocials.map(network => {
                                    const netData = contactNetworks.find(n => n.id === network) || contactNetworks[0];
                                    return (
                                        <button key={network} onClick={() => handleSocialClick(network)} style={{ padding: '14px', background: '#141417', border: `1px solid ${netData.color}`, borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' }} className="hover-scale">
                                            <Send size={24} color={netData.color} />
                                            <div style={{ fontSize: '13px', fontWeight: '700' }}>{network}</div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px dashed #3f3f46', borderRadius: '14px', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
                                    {T('noSocials', 'Соцмережі не вказані')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Warning modal ── */}
            {showWarningModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setShowWarningModal(false)}>
                    <div onClick={e => e.stopPropagation()} className="fade-in-up" style={{ background: C.surface, borderRadius: R.xl, border: `1px solid ${C.border}`, padding: '28px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.9)', width: '90%', maxWidth: '400px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: R.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                            <AlertTriangle size={30} color="#ef4444" />
                        </div>
                        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '15px' }}>{T('warningTitle', 'ПОПЕРЕДЖЕННЯ')}</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            {T('warningText1', 'Переходячи в')} <b>{selectedSocial}</b>, {T('warningText2', 'ви залишаєте безпечну зону нашої платформи.')}<br /><br />
                            <b style={{ color: '#ef4444' }}>{T('warningNotResponsible', 'Ми не несемо відповідальності')}</b> {T('warningNotResponsibleText', 'за будь-які фінансові операції або домовленості поза цим сайтом.')}<br /><br />
                            <b style={{ color: '#10b981' }}>{T('warningRecommend', 'Рекомендуємо')}:</b> {T('warningRecommendText', 'для вашої безпеки ведіть листування у нашому')} <b>{T('internalChat', 'Внутрішньому Чаті')}</b>.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={handleInternalChatClick} style={{ ...btnPrimary(), width: '100%', padding: '13px' }}>
                                {T('warnGoToSite', 'НАПИСАТИ В ЧАТІ САЙТУ')}
                            </button>
                            <button onClick={confirmSocialRedirect} style={{ ...btnGhost(), width: '100%', padding: '13px' }}>
                                {`${T('warnGoAnyway', 'ВСЕ ОДНО ПЕРЕЙТИ В')} ${selectedSocial}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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