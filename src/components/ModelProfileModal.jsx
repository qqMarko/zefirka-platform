import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Send, Heart, MapPin, Sparkles, Star, Target, Crown, CalendarDays, Zap, Info } from 'lucide-react'; 
import useStore from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';
import useSmoothScroll from '../hooks/useSmoothScroll';
import { toast } from 'react-hot-toast';

const ModelProfileModal = ({ model, onClose, openPrivateChat, favorites = [], handleToggleFavorite }) => {
    // 🚀 ДОДАВ ВИТЯГУВАННЯ 'user' ЗІ СТОРУ
    const { currentLang, userUniqueId, user } = useStore();
    const [photoIndex, setPhotoIndex] = useState(0);
    const [showContacts, setShowContacts] = useState(false);
    
    // ⭐ Відгуки
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [localReviews, setLocalReviews] = useState(model?.reviews || []);
    const [localAvg, setLocalAvg] = useState(model?.averageRating || 0);
    const [localTotal, setLocalTotal] = useState(model?.totalReviews || 0);

    const scrollRef = useRef(null);
    useSmoothScroll(scrollRef);

    // 🚀 ЗАЛІЗОБЕТОННА ПЕРЕВІРКА НА ВЛАСНИКА
    // 1. Беремо твій ID з профілю, якщо залогінений, або з локальної сесії
    const myId = user?._id || user?.id || userUniqueId;
    // 2. Беремо ID власника анкети (підстраховка, якщо база віддала об'єкт)
    const ownerId = model?.userId?._id || model?.userId;

    const isOwner = Boolean(
        model?.isMine || 
        (myId && ownerId && String(myId) === String(ownerId))
    );

    // (Для нас з тобою: виведемо в консоль F12, щоб переконатись, що вони однакові)
    useEffect(() => {
        console.log("🛡️ ПЕРЕВІРКА ВЛАСНИКА:", { myId, ownerId, isOwner, modelName: model?.name });
    }, [myId, ownerId, isOwner, model]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // 📊 Трекінг
    useEffect(() => {
        if (model?.id && !isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            fetch(`${BASE_URL}/profiles/${model.id}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view' }), keepalive: true }).catch(e => console.log(e));
        }
    }, [model?.id, isOwner]);

    const handleContactClick = (type) => {
        if (!isOwner) {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            fetch(`${BASE_URL}/profiles/${model.id}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'click' }), keepalive: true }).catch(e => console.log(e));
        }

        if (type === 'chat') { openPrivateChat(model); onClose(); }
        else { alert(`Перехід у ${model.contactType || "месенджер"}: ${model.contact || "не вказано"}`); }
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
                // Якщо відгук пішов на перевірку
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

    // 🔥 НОВА ФУНКЦІЯ: ВИДАЛЕННЯ ВІДГУКУ (DIAMOND)
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("🗑 Ви впевнені, що хочете назавжди видалити цей відгук?")) return;
        
        const loadingToast = toast.loading('Видалення...');
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/profiles/${model.id}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: myId })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('🗑️ Відгук успішно видалено!', { id: loadingToast });
                setLocalReviews(localReviews.filter(r => r._id !== reviewId));
                setLocalAvg(data.averageRating);
                setLocalTotal(data.totalReviews);
            } else {
                toast.error(data.message || 'Помилка видалення', { id: loadingToast });
            }
        } catch (err) {
            toast.error('Мережева помилка', { id: loadingToast });
        }
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

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }} onClick={onClose}>
            
            <div onClick={(e) => e.stopPropagation()} className="fade-in-up" style={{ width: '100%', maxWidth: '600px', height: '100%', maxHeight: '90vh', background: '#09090b', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,1)', border: '1px solid #27272a' }}>
                
                {/* 🔒 ПЛАВАЮЧІ КНОПКИ (Над фото) */}
                <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', zIndex: 100 }}>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s' }} className="hover-scale">
                        <X size={20} color="white" />
                    </button>
                    {handleToggleFavorite && !isOwner && (
                        <button onClick={(e) => handleToggleFavorite(model, e)} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s' }} className="hover-scale">
                            <Heart size={20} color={isFav ? accent : 'white'} fill={isFav ? accent : 'none'} style={{ transition: '0.3s', transform: isFav ? 'scale(1.1)' : 'scale(1)' }} />
                        </button>
                    )}
                </div>

                <div ref={scrollRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                    
                    <div style={{ position: 'relative', width: '100%', paddingTop: '125%', background: '#000' }}>
                        {model.photos && model.photos.length > 0 ? (
                            <img src={model.photos[photoIndex]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt={model.name} />
                        ) : ( 
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', fontSize: '14px', letterSpacing: '2px' }}>NO MEDIA</div> 
                        )}
                        
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30%', background: 'linear-gradient(to top, #09090b 0%, transparent 100%)', pointerEvents: 'none' }}></div>

                        {model.photos?.length > 1 && (
                            <>
                                <div onClick={prevPhoto} style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'w-resize', zIndex: 10 }}></div>
                                <div onClick={nextPhoto} style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'e-resize', zIndex: 10 }}></div>
                                
                                <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 20 }}>
                                    {model.photos.map((_, i) => (
                                        <div key={i} onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }} style={{ width: i === photoIndex ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === photoIndex ? accent : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ padding: '24px 24px 120px 24px', position: 'relative', zIndex: 20 }}>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>{model.name}</h1>
                                    {model.vLevel > 0 && <CheckCircle2 size={20} color="#10b981" />}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a1a1aa', fontSize: '14px', fontWeight: '500' }}>
                                <span style={{ color: accent }}>{model.title || t[currentLang]?.genders?.[model.gender] || "Модель"}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div> Online
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Ціна вірту</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{model.priceFrom} <span style={{ fontSize: '12px', color: '#52525b' }}>₴</span></div>
                            </div>
                            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ShieldCheck size={12}/> Довіра</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{model.trustScore || 80}%</div>
                            </div>
                            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Star size={12}/> Рейтинг</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{localAvg > 0 ? localAvg.toFixed(1) : '—'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
                            {[
                                { icon: CalendarDays, val: `${model.age} років` },
                                { icon: Target, val: `${model.height || "—"} см` },
                                { icon: Crown, val: `${model.weight || "—"} кг` },
                                { val: t[currentLang]?.bodyTypes?.[model.bodyType] || model.bodyType || "—" },
                                { val: t[currentLang]?.hairColors?.[model.hairColor] || model.hairColor || "—" }
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'transparent', border: '1px solid #3f3f46', padding: '6px 12px', borderRadius: '20px', color: '#d4d4d8', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {item.icon && <item.icon size={14} color="#71717a" />} {item.val}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Про мене</h3>
                            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                {model.desc || 'Опис готується до публікації...'}
                            </p>
                        </div>

                        {modelFetishes.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Мої переваги</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {modelFetishes.map(f => (
                                        <span key={f} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#e4e4e7' }}>
                                            {getFetishTranslation(f)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div style={{ borderTop: '1px solid #27272a', paddingTop: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Відгуки клієнтів
                                </h3>
                                <span style={{ color: '#71717a', fontSize: '14px', fontWeight: '600' }}>Всього: {localTotal}</span>
                            </div>

                            {!isOwner && (
                                <div style={{ background: '#18181b', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={24} onClick={() => setRating(star)} color={star <= rating ? "#f59e0b" : "#3f3f46"} fill={star <= rating ? "#f59e0b" : "none"} style={{ cursor: 'pointer', transition: '0.2s' }} />
                                        ))}
                                    </div>
                                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Поділіться досвідом (Тільки Premium)..." style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', color: '#fff', padding: '12px', borderRadius: '12px', minHeight: '80px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' }} className="focus-accent-border"/>
                                    <button onClick={submitReview} disabled={isSubmittingReview} style={{ width: '100%', padding: '14px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '12px', fontWeight: '800', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontSize: '14px', transition: '0.2s' }}>
                                        {isSubmittingReview ? 'ОБРОБКА...' : 'ЗАЛИШИТИ ВІДГУК'}
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {localReviews.length > 0 ? (
    localReviews.filter(r => isOwner || r.status !== 'pending').map((review, i) => (
        <div key={i} style={{ background: '#18181b', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '1px solid #27272a', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{review.clientName}</div>
                    
                    {/* Плашка модерації для власника */}
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
                    <Star key={star} size={14} color={star <= review.rating ? "#f59e0b" : "#3f3f46"} fill={star <= review.rating ? "#f59e0b" : "none"} />
                ))}
            </div>
            
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                {review.text}
            </p>

            {/* 🔥 КНОПКА ВИДАЛЕННЯ ДЛЯ DIAMOND */}
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
                        <div style={{ width: '100%', padding: '18px', background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', color: '#a1a1aa', fontSize: '15px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={20} color="#71717a" /> ЦЕ ВАША АНКЕТА
                        </div>
                    ) : !showContacts ? (
                        <button onClick={() => setShowContacts(true)} style={{ width: '100%', padding: '18px', background: accent, border: 'none', borderRadius: '16px', color: '#000', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }} className="hover-scale">
                            <Sparkles size={20} /> ІНІЦІЮВАТИ СПІЛКУВАННЯ
                        </button>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', animation: 'fadeInUp 0.3s ease' }}>
                            <button onClick={() => handleContactClick('chat')} style={{ padding: '14px', background: '#18181b', border: `1px solid ${accent}`, borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' }} className="hover-scale">
                                <ShieldCheck size={24} color={accent}/> 
                                <div style={{fontSize: '13px', fontWeight: '700'}}>Внутрішній Чат</div>
                            </button>
                            <button onClick={() => handleContactClick('messenger')} style={{ padding: '14px', background: '#18181b', border: `1px solid #10b981`, borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' }} className="hover-scale">
                                <Send size={24} color="#10b981"/> 
                                <div style={{fontSize: '13px', fontWeight: '700'}}>{model.contactType || 'Месенджер'}</div>
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .hover-scale:hover { transform: scale(1.02); }
                .focus-accent-border:focus { border-color: ${accent} !important; box-shadow: 0 0 10px ${accent}33; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ModelProfileModal;