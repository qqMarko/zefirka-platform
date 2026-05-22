import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ShieldCheck, Send, Heart, Target, Crown, CalendarDays, Star, AlertTriangle, Sparkles } from 'lucide-react'; 
import useStore from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';
import useSmoothScroll from '../hooks/useSmoothScroll';
import { toast } from 'react-hot-toast';

const ModelProfileModal = ({ model, onClose, openPrivateChat, favorites = [], handleToggleFavorite }) => {
    const { currentLang, userUniqueId, user, onlineUsers } = useStore();
    const [photoIndex, setPhotoIndex] = useState(0);
    const [showContacts, setShowContacts] = useState(false);
    
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [selectedSocial, setSelectedSocial] = useState(null);

    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [localReviews, setLocalReviews] = useState(model?.reviews || []);
    const [localAvg, setLocalAvg] = useState(model?.averageRating || 0);
    const [localTotal, setLocalTotal] = useState(model?.totalReviews || 0);

    const scrollRef = useRef(null);
    useSmoothScroll(scrollRef);

    const myId = user?._id || user?.id || userUniqueId;
    const ownerId = model?.userId?._id || model?.userId;

    const isOwner = Boolean(
        model?.isMine || 
        (myId && ownerId && String(myId) === String(ownerId))
    );

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        if (model?.id && !isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            fetch(`${BASE_URL}/profiles/${model.id}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view' }), keepalive: true }).catch(e => console.log(e));
        }
    }, [model?.id, isOwner]);

    const contactNetworks = [
        { id: 'Telegram', color: '#24A1DE' },
        { id: 'WhatsApp', color: '#25D366' },
        { id: 'Viber', color: '#7360F2' }
    ];

    const handleSocialClick = (network) => {
        setSelectedSocial(network);
        setShowWarningModal(true);
    };

    const confirmSocialRedirect = () => {
        if (!isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            fetch(`${BASE_URL}/profiles/${model.id}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'click' }), keepalive: true }).catch(e => console.log(e));
        }
        setShowWarningModal(false);
        alert(`Перехід у ${selectedSocial}: ${model.contact || "не вказано"}`); 
    };

    const handleInternalChatClick = () => {
        openPrivateChat(model); 
        onClose();
    };

    // 🟢 Форматування зросту через крапку (наприклад, 1.75)
    const formatHeight = (h) => {
        if (!h) return "—";
        const clean = String(h).replace(',', '.').trim();
        const num = parseFloat(clean);
        if (isNaN(num)) return h;
        if (num > 3) return (num / 100).toFixed(2);
        return num.toFixed(2);
    };

    const submitReview = async () => {
        if (!reviewText.trim()) { toast.error('Напишіть коментар до відгуку!'); return; }
        setIsSubmittingReview(true);
        const loadingToast = toast.loading('Публікація...');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/profiles/${model.id}/reviews`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: myId, rating, text: reviewText })
            });
            const data = await res.json();

            if (data.success) {
                if (data.isPending) {
                    toast.success('🛡️ Відгук відправлено на перевірку адміністратору!', { id: loadingToast, duration: 5000 });
                } else {
                    toast.success('✅ Відгук опубліковано!', { id: loadingToast });
                    setLocalReviews([data.review, ...localReviews]); 
                    setLocalAvg(data.averageRating);
                    setLocalTotal(data.totalReviews);
                }
                setReviewText('');
            } else { toast.error(`❌ ${data.message}`, { id: loadingToast }); }
        } catch (error) { toast.error('Помилка сервера', { id: loadingToast }); } 
        finally { setIsSubmittingReview(false); }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("🗑 Ви впевнені, що хочете назавжди видалити цей відгук?")) return;
        const loadingToast = toast.loading('Видалення...');
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/profiles/${model.id}/reviews/${reviewId}`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: myId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('🗑️ Відгук успішно видалено!', { id: loadingToast });
                setLocalReviews(localReviews.filter(r => r._id !== reviewId));
                setLocalAvg(data.averageRating);
                setLocalTotal(data.totalReviews);
            } else { toast.error(data.message || 'Помилка видалення', { id: loadingToast }); }
        } catch (err) { toast.error('Мережева помилка', { id: loadingToast }); }
    };
    
    const nextPhoto = (e) => { e.stopPropagation(); if (model?.photos?.length > 0) setPhotoIndex((prev) => (prev + 1) % model.photos.length); };
    const prevPhoto = (e) => { e.stopPropagation(); if (model?.photos?.length > 0) setPhotoIndex((prev) => (prev - 1 + model.photos.length) % model.photos.length); };

    if (!model) return null;
    const isFav = favorites?.some(fav => fav.id === model.id); 
    const modelFetishes = model.fetishes || [];
    const getFetishTranslation = (fKey) => {
        const categories = t[currentLang]?.fetishes || {};
        for (let cat in categories) { if (categories[cat].items && categories[cat].items[fKey]) return categories[cat].items[fKey]; }
        return fKey;
    };

    let displayTrust = 100;
    const populatedUser = typeof model?.userId === 'object' ? model.userId : null;
    const backendTrust = populatedUser?.trustScore ?? populatedUser?.trustPercentage;
    const storeTrust = user?.trustScore ?? user?.trustPercentage;
    const profileTrust = model?.trustScore ?? model?.trustPercentage;

    if (backendTrust != null) displayTrust = backendTrust;
    else if (isOwner && storeTrust != null) displayTrust = storeTrust;
    else if (profileTrust != null) displayTrust = profileTrust;

    let trustColor = '#10b981'; 
    if (displayTrust < 70) trustColor = '#f59e0b'; 
    if (displayTrust < 40) trustColor = '#ef4444'; 

    // 🟢 ФУНКЦІЯ ПЕРЕВІРКИ 10 ХВИЛИН (як у каталозі)
    const checkIfOnline = (lastActiveTime) => {
        if (!lastActiveTime) return false;
        const now = new Date();
        const activeDate = new Date(lastActiveTime);
        const tenMinutesInMs = 10 * 60 * 1000;
        return (now - activeDate) < tenMinutesInMs;
    };

    // 🟢 ОБЧИСЛЕННЯ ОНЛАЙН СТАТУСУ З ЗАДРИМКОЮ
    let isModelOnline = false;

    if (ownerId && ownerId !== 'undefined' && ownerId !== 'null') {
        const socketData = onlineUsers?.[ownerId];
        
        if (socketData && socketData.status === 'online') {
            isModelOnline = true;
        } 
        else if (socketData && socketData.status === 'offline') {
            const timeToCheck = socketData.lastSeen;
            if (timeToCheck) {
                isModelOnline = checkIfOnline(timeToCheck);
            }
        } 
        else {
            const userObj = typeof model?.userId === 'object' ? model.userId : null;
            const timeToCheck = userObj?.lastActive || model?.lastActive;
            
            if (timeToCheck) {
                isModelOnline = checkIfOnline(timeToCheck);
            }
        }
    }

    const availableSocials = model.contactTypes && model.contactTypes.length > 0 
        ? model.contactTypes 
        : (model.contactType ? [model.contactType] : []);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }} onClick={onClose}>
            
            <div onClick={(e) => e.stopPropagation()} className="fade-in-up" style={{ width: '100%', maxWidth: '550px', height: '100%', maxHeight: '92vh', background: '#09090b', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,1)', border: '1px solid #27272a' }}>
                
                <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', zIndex: 100 }}>
                    <button onClose={onClose} onClick={onClose} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s' }} className="hover-scale">
                        <X size={20} color="white" />
                    </button>
                    {handleToggleFavorite && !isOwner && (
                        <button onClick={(e) => handleToggleFavorite(model, e)} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s' }} className="hover-scale">
                            <Heart size={20} color={isFav ? accent : 'white'} fill={isFav ? accent : 'none'} style={{ transition: '0.3s', transform: isFav ? 'scale(1.1)' : 'scale(1)' }} />
                        </button>
                    )}
                </div>

                <div ref={scrollRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                    
                    {/* 🟢 КРОК 1: СТАБІЛЬНИЙ БЛОК ФОТО БЕЗ ВТРАТИ ЯКОСТІ ТА РОЗТЯГУВАННЯ */}
                    <div style={{ position: 'relative', width: '100%', height: '420px', background: '#000', overflow: 'hidden' }}>
                        {model.photos && model.photos.length > 0 ? (
                            <img src={model.photos[photoIndex]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} alt={model.name} />
                        ) : ( 
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', fontSize: '14px', letterSpacing: '2px' }}>NO MEDIA</div> 
                        )}
                        
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '35%', background: 'linear-gradient(to top, #09090b 0%, transparent 100%)', pointerEvents: 'none' }}></div>

                        {model.photos?.length > 1 && (
                            <>
                                <div onClick={prevPhoto} style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'w-resize', zIndex: 10 }}></div>
                                <div onClick={nextPhoto} style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'e-resize', zIndex: 10 }}></div>
                                
                                <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 20 }}>
                                    {model.photos.map((_, i) => (
                                        <div key={i} onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }} style={{ width: i === photoIndex ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === photoIndex ? accent : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: '0.3s' }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ padding: '24px 24px 150px 24px', position: 'relative', zIndex: 20 }}>
                        
                        {/* 🟢 КРОК 2: ЖИРНИЙ, ВИДИМИЙ КОРОТКИЙ ЗАГОЛОВОК */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{model.name}</h1>
                                {model.vLevel > 0 && <CheckCircle2 size={22} color="#10b981" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ color: accent, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    {model.title || t[currentLang]?.genders?.[model.gender] || "Модель"}
                                </span>
                               <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', fontSize: '13px', fontWeight: '500' }}>
                                {/* 🟢 ДИНАМІЧНИЙ КОЛІР КРАПКИ ТА ТЕКСТУ */}
                                <div style={{ 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    background: isModelOnline ? '#10b981' : '#71717a', 
                                    boxShadow: isModelOnline ? '0 0 8px #10b981' : 'none' 
                                }}></div> 
                                {isModelOnline ? 'Online' : 'Offline'}
                               </span>
                            </div>
                        </div>

                        {/* ВЕРХНЯ СІТКА: ЦІНА ТА ДОВІРА */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Ціна вірту</div>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>{model.priceFrom} <span style={{ fontSize: '13px', color: '#52525b' }}>₴</span></div>
                            </div>
                            <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ShieldCheck size={12} color={trustColor}/> Довіра</div>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: trustColor }}>{displayTrust}%</div>
                            </div>
                        </div>

                        {/* 🟢 КРОК 3: ПРЕМІУМ-СТРУКТУРА ПАРАМЕТРІВ АНКЕТИ */}
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Характеристики</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#141417', padding: '16px', borderRadius: '16px', border: '1px solid #232326', marginBottom: '12px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CalendarDays size={13}/> Вік</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{model.age} років</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #27272a', borderRight: '1px solid #27272a' }}>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Target size={13}/> Зріст</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{formatHeight(model.height)} м</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Crown size={13}/> Вага</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{model.weight ? `${model.weight} кг` : "—"}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                            <div style={{ background: '#141417', padding: '12px 16px', borderRadius: '14px', border: '1px solid #232326', fontSize: '13px', color: '#d4d4d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717a', fontWeight: '600' }}>Фігура:</span>
                                <span style={{ fontWeight: '700', color: '#fff' }}>{t[currentLang]?.bodyTypes?.[model.bodyType] || model.bodyType || "—"}</span>
                            </div>
                            <div style={{ background: '#141417', padding: '12px 16px', borderRadius: '14px', border: '1px solid #232326', fontSize: '13px', color: '#d4d4d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717a', fontWeight: '600' }}>Волосся:</span>
                                <span style={{ fontWeight: '700', color: '#fff' }}>{t[currentLang]?.hairColors?.[model.hairColor] || model.hairColor || "—"}</span>
                            </div>
                        </div>

                        {/* ОПИС ПРО МЕНЕ */}
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>Про мене</h3>
                            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-line', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid #1c1c1f' }}>
                                {model.bio || model.desc || 'Опис готується до публікації...'}
                            </p>
                        </div>

                        {/* ПЕРЕВАГИ / ФЕТИШІ */}
                        {modelFetishes.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>Мої переваги</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {modelFetishes.map(f => (
                                        <span key={f} style={{ background: '#141417', border: '1px solid #232326', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', color: '#e4e4e7', fontWeight: '500' }}>
                                            {getFetishTranslation(f)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 🟢 КРОК 4: РЕЙТИНГ ПЕРЕНЕСЕНО СЮДИ, ДО ВІДГУКІВ */}
                        <div style={{ borderTop: '1px solid #27272a', paddingTop: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                                    Відгуки клієнтів
                                </h3>
                                <span style={{ color: '#71717a', fontSize: '14px', fontWeight: '600' }}>Всього: {localTotal}</span>
                            </div>

                            {/* Нова преміум-плашка загального рейтингу */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#141417', padding: '16px', borderRadius: '16px', border: '1px solid #232326', marginBottom: '24px' }}>
                                <div style={{ fontSize: '38px', fontWeight: '900', color: '#f59e0b', lineHeight: 1, letterSpacing: '-1px' }}>
                                    {localAvg > 0 ? localAvg.toFixed(1) : '0.0'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={15} color={star <= Math.round(localAvg) ? "#f59e0b" : "#27272a"} fill={star <= Math.round(localAvg) ? "#f59e0b" : "none"} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#71717a', fontWeight: '600' }}>Загальна оцінка на основі відгуків</div>
                                </div>
                            </div>

                            {!isOwner && (
                                <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={24} onClick={() => setRating(star)} color={star <= rating ? "#f59e0b" : "#3f3f46"} fill={star <= rating ? "#f59e0b" : "none"} style={{ cursor: 'pointer', transition: '0.2s' }} />
                                        ))}
                                    </div>
                                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Поділіться досвідом співпраці..." style={{ width: '100%', background: '#09090b', border: '1px solid #232326', color: '#fff', padding: '12px', borderRadius: '12px', minHeight: '80px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' }} className="focus-accent-border"/>
                                    <button onClick={submitReview} disabled={isSubmittingReview} style={{ width: '100%', padding: '14px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '12px', fontWeight: '800', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontSize: '14px', transition: '0.2s' }}>
                                        {isSubmittingReview ? 'ОБРОБКА...' : 'ЗАЛИШИТИ ВІДГУК'}
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {localReviews.length > 0 ? (
                                    localReviews.filter(r => isOwner || r.status !== 'pending').map((review, i) => (
                                        <div key={i} style={{ background: '#141417', borderRadius: '16px', padding: '16px', border: '1px solid #232326', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{review.clientName}</div>
                                                    {review.status === 'pending' && (
                                                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
                                                            НА ПЕРЕВІРЦІ
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ color: '#52525b', fontSize: '12px' }}>
                                                    {new Date(review.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} size={14} color={star <= review.rating ? "#f59e0b" : "#27272a"} fill={star <= review.rating ? "#f59e0b" : "none"} />
                                                ))}
                                            </div>
                                            
                                            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                                                {review.text}
                                            </p>

                                            {isOwner && user?.vipPackage === 'diamond' && (
                                                <button 
                                                    onClick={() => handleDeleteReview(review._id)}
                                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                                                    className="hover-scale"
                                                >
                                                    🗑 Видалити
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '20px' }}>
                                        Ще немає відгуків. Будьте першим!
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px 24px 24px', background: 'linear-gradient(0deg, #09090b 80%, rgba(9,9,11,0) 100%)', zIndex: 100 }}>
                    {isOwner ? (
                        <div style={{ width: '100%', padding: '18px', background: '#141417', border: '1px solid #232326', borderRadius: '16px', color: '#a1a1aa', fontSize: '15px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={20} color="#71717a" /> ЦЕ ВАША АНКЕТА
                        </div>
                    ) : !showContacts ? (
                        <button onClick={() => setShowContacts(true)} style={{ width: '100%', padding: '18px', background: accent, border: 'none', borderRadius: '16px', color: '#000', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: `0 10px 30px ${accent}66` }} className="hover-scale">
                            <Sparkles size={20} /> ІНІЦІЮВАТИ СПІЛКУВАННЯ
                        </button>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: availableSocials.length === 0 ? '1fr' : '1fr 1fr', gap: '12px', animation: 'fadeInUp 0.3s ease' }}>
                            <button onClick={handleInternalChatClick} style={{ padding: '14px', background: '#141417', border: `1px solid ${accent}`, borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' }} className="hover-scale">
                                <ShieldCheck size={24} color={accent}/> 
                                <div style={{fontSize: '13px', fontWeight: '700'}}>Внутрішній Чат</div>
                            </button>
                            
                            {availableSocials.length > 0 ? (
                                availableSocials.map(network => {
                                    const netData = contactNetworks.find(n => n.id === network) || contactNetworks[0];
                                    return (
                                        <button key={network} onClick={() => handleSocialClick(network)} style={{ padding: '14px', background: '#141417', border: `1px solid ${netData.color}`, borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' }} className="hover-scale">
                                            <Send size={24} color={netData.color}/> 
                                            <div style={{fontSize: '13px', fontWeight: '700'}}>{network}</div>
                                        </button>
                                    )
                                })
                            ) : (
                                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: `1px dashed #3f3f46`, borderRadius: '14px', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
                                    Соцмережі не вказані
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* МОДАЛЬНЕ ВІКНО ПОПЕРЕДЖЕННЯ ПРО ПЕРЕХІД */}
            {showWarningModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setShowWarningModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="fade-in-up" style={{ width: '90%', maxWidth: '400px', background: '#141417', borderRadius: '24px', border: '1px solid #232326', padding: '30px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertTriangle size={30} color="#ef4444" />
                        </div>
                        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '15px' }}>ПОПЕРЕДЖЕННЯ</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Переходячи в <b>{selectedSocial}</b>, ви залишаєте безпечну зону нашої платформи. <br/><br/>
                            <b style={{ color: '#ef4444' }}>Ми не несемо відповідальності</b> за будь-які фінансові операції або домовленості поза цим сайтом.<br/><br/>
                            <b style={{ color: '#10b981' }}>Рекомендуємо:</b> для вашої безпеки ведіть листування у нашому <b>Внутрішньому Чаті</b>.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={handleInternalChatClick} style={{ width: '100%', padding: '14px', background: accent, border: 'none', borderRadius: '12px', color: '#000', fontSize: '14px', fontWeight: '900', cursor: 'pointer' }}>
                                НАПИСАТИ В ЧАТІ САЙТУ
                            </button>
                            <button onClick={confirmSocialRedirect} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #3f3f46', borderRadius: '12px', color: '#a1a1aa', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                                ВСЕ ОДНО ПЕРЕЙТИ В {selectedSocial}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .hover-scale:hover { transform: scale(1.02); }
                .focus-accent-border:focus { border-color: ${accent} !important; box-shadow: 0 0 10px ${accent}33; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #232326; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ModelProfileModal;