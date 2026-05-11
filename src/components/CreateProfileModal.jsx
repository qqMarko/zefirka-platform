import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Camera, CheckCircle2, Plus, CheckSquare, Square, User, Sparkles, MessageCircle, Image, Eye, ChevronRight, ChevronLeft, Check, Send, Clock } from 'lucide-react'; 
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';
import imageCompression from 'browser-image-compression'; 
import * as nsfwjs from 'nsfwjs'; 
import useSmoothScroll from '../hooks/useSmoothScroll';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
const MAX_PHOTOS = 5;

const CreateProfileModal = () => {
    const { currentLang, setShowCreateModal, editingModel, loadCatalog, userUniqueId, token: storeToken } = useStore();
    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const fetishesScrollRef = useRef(null); // 🟢 Реф для внутрішнього скролу послуг

    useSmoothScroll(scrollContainerRef, 0.05, 0.8);

    const [step, setStep] = useState(1);
    const [showModerationScreen, setShowModerationScreen] = useState(false);

    const [formData, setFormData] = useState({
        name: '', title: '', desc: '', age: '', height: '', weight: '', 
        priceFrom: '', priceTo: '', contact: '', 
        contactTypes: ['Telegram'], 
        hairColor: 'blonde', bodyType: 'slim', gender: 'w', fetishes: []
    });

    const [photos, setPhotos] = useState([]);
    const [isCheckingPhoto, setIsCheckingPhoto] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [nsfwModel, setNsfwModel] = useState(null);

    const genderKeys = ["w", "m", "c", "l", "g", "t"];
    const bodyKeys = ["slim", "athletic", "curvy", "thick"];
    const hairKeys = ["blonde", "brunette", "brown", "red", "color"];

    const contactNetworks = [
        { id: 'Telegram', color: '#24A1DE' },
        { id: 'WhatsApp', color: '#25D366' },
        { id: 'Viber', color: '#7360F2' }
    ];

    const currentToken = storeToken || localStorage.getItem('zefirka_token') || localStorage.getItem('token');

    // 🟢 Блокуємо "перехоплення" скролу головним хуком, коли мишка над послугами
    useEffect(() => {
        const el = fetishesScrollRef.current;
        if (!el) return;
        
        // Зупиняємо спливання події (event bubbling) до батьківського контейнера
        const preventScrollHijack = (e) => e.stopPropagation();
        
        el.addEventListener('wheel', preventScrollHijack, { passive: true });
        return () => el.removeEventListener('wheel', preventScrollHijack);
    }, [step]); // step важливий, бо елемент з'являється тільки на 3 кроці

    useEffect(() => {
        try {
            nsfwjs.load().then(model => setNsfwModel(model)).catch(err => console.log("AI Load Warn:", err));
        } catch (e) {
            console.warn("NSFWJS не встановлено.");
        }
    }, []);

    useEffect(() => {
        if (editingModel) {
            setFormData({
                name: editingModel.name || '', title: editingModel.title || '', desc: editingModel.bio || editingModel.desc || '',
                age: editingModel.age || '', height: editingModel.height || '', weight: editingModel.weight || '',
                priceFrom: editingModel.priceFrom || '', priceTo: editingModel.priceTo || '', contact: editingModel.contact || '', 
                contactTypes: editingModel.contactTypes || (editingModel.contactType ? [editingModel.contactType] : ['Telegram']),
                hairColor: editingModel.hairColor || 'blonde', bodyType: editingModel.bodyType || 'slim',
                gender: editingModel.gender === 'Хлопець' ? 'm' : (editingModel.gender === 'Дівчина' ? 'w' : editingModel.gender) || 'w', 
                fetishes: editingModel.fetishes || []
            });
            if (editingModel.photos) {
                setPhotos(editingModel.photos.map(url => ({ file: null, preview: url, isUploaded: true })));
            }
        }
    }, [editingModel]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const toggleContactType = (id) => {
        setFormData(prev => {
            const types = prev.contactTypes.includes(id) 
                ? prev.contactTypes.filter(t => t !== id) 
                : [...prev.contactTypes, id];
            if (types.length === 0) return prev;
            return { ...prev, contactTypes: types };
        });
    };

    const handleBlurClamp = (field, min, max) => {
        let val = parseFloat(String(formData[field]).replace(',', '.'));
        if (isNaN(val)) return;
        if (val < min) val = min;
        if (val > max) val = max;
        handleChange(field, val.toString());
    };

    const handleBlurHeight = () => {
        let val = parseFloat(String(formData.height).replace(',', '.'));
        if (isNaN(val)) return;
        if (val < 3) { if (val < 1.3) val = 1.3; if (val > 2.5) val = 2.5; } 
        else { if (val < 130) val = 130; if (val > 250) val = 250; }
        handleChange('height', val.toString().replace('.', ','));
    };

    const safeT = t[currentLang] || {};
    const safeFetishes = safeT.fetishes || {};
    const allFetishesKeys = Object.values(safeFetishes).flatMap(cat => Object.keys(cat.items || {}));
    const isAllFetishesSelected = allFetishesKeys.length > 0 && formData.fetishes.length === allFetishesKeys.length;

    const handleSelectAllFetishes = () => handleChange('fetishes', isAllFetishesSelected ? [] : allFetishesKeys); 
    const toggleFetish = (fKey) => setFormData(prev => ({ ...prev, fetishes: prev.fetishes.includes(fKey) ? prev.fetishes.filter(i => i !== fKey) : [...prev.fetishes, fKey] }));

    const handlePhotoUpload = async (e) => {
        let files = Array.from(e.target.files);
        if (files.length === 0) return; 

        const allowedRemaining = MAX_PHOTOS - photos.length;
        if (files.length > allowedRemaining) {
            toast.error(`⚠️ Максимальний ліміт: ${MAX_PHOTOS} фото! Зайві відкинуто.`, { duration: 4000 });
            files = files.slice(0, allowedRemaining); 
            if (files.length === 0) { e.target.value = ''; return; }
        }
        
        setPhotoError(''); setIsCheckingPhoto(true);
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: false };

        for (const file of files) {
            try {
                if (nsfwModel) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    await new Promise(resolve => { img.onload = resolve; });
                    const predictions = await nsfwModel.classify(img);
                    const isPorn = predictions.some(p => (p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy') && p.probability > 0.65);
                    if (isPorn) { toast.error(`🔞 Фото відхилено ШІ (NSFW)!`, { duration: 5000 }); continue; }
                }
                const compressedBlob = await imageCompression(file, options);
                const properFile = new File([compressedBlob], file.name || `photo_${Date.now()}.jpg`, { type: compressedBlob.type || 'image/jpeg', lastModified: Date.now() });
                setPhotos(prev => [...prev, { file: properFile, preview: URL.createObjectURL(properFile), isUploaded: false }]);
            } catch (error) { console.error("Помилка обробки фото:", error); }
        }
        setIsCheckingPhoto(false); e.target.value = ''; 
    };

    const handlePublish = async () => {
        if (!formData.name || !formData.age || photos.length === 0) return toast.error('Заповніть ім\'я, вік та додайте хоча б 1 фото!');
        
        if (!currentToken) return toast.error('Помилка доступу: Відсутній токен авторизації. Перезавантажте сторінку.');

        setIsPublishing(true);
        const loadingToast = toast.loading('Завантаження фото...');

        try {
            const uploadedUrls = [];
            for (const photoObj of photos) {
                if (photoObj.isUploaded) uploadedUrls.push(photoObj.preview);
                else {
                    const uploadResult = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${API_URL}/upload`, true);
                        xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
                        xhr.onload = () => { if (xhr.status === 200) resolve(JSON.parse(xhr.responseText)); else reject(new Error(`Помилка: ${xhr.status}`)); };
                        xhr.onerror = () => reject(new Error('Мережева помилка'));
                        const uploadData = new FormData();
                        uploadData.append('photo', photoObj.file, photoObj.file.name || `photo_${Date.now()}.jpg`);
                        xhr.send(uploadData);
                    });
                    const finalUrl = uploadResult.url || uploadResult.imageUrl || uploadResult.secure_url || uploadResult.path;
                    if (uploadResult.success && finalUrl) uploadedUrls.push(finalUrl); else throw new Error('Бекенд не віддав посилання!');
                }
            }

            toast.loading('Збереження анкети...', { id: loadingToast });
            const finalProfileData = {
                userId: userUniqueId, name: formData.name, title: formData.title, 
                age: parseInt(formData.age) || 18, 
                priceFrom: parseInt(formData.priceFrom) || 500,
                priceTo: formData.priceTo ? parseInt(formData.priceTo) : null,
                gender: formData.gender, bodyType: formData.bodyType, hairColor: formData.hairColor, fetishes: formData.fetishes, 
                contactType: formData.contactTypes[0], 
                contactTypes: formData.contactTypes, 
                contact: formData.contact, bio: formData.desc || formData.title, photos: uploadedUrls 
            };
            
            const response = await fetch(editingModel ? `${API_URL}/profiles/${editingModel.id}` : `${API_URL}/profiles`, {
                method: editingModel ? 'PUT' : 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}` 
                }, 
                body: JSON.stringify(finalProfileData),
            });

            const result = await response.json();
            if (result.success) { 
                toast.dismiss(loadingToast);
                setShowModerationScreen(true);
            } 
            else toast.error('❌ Помилка: ' + result.message, { id: loadingToast });
        } catch (error) { toast.error(`❌ Помилка: ${error.message}`, { id: loadingToast }); } 
        finally { setIsPublishing(false); }
    };

    const genderSuffix = formData.gender === 'm' ? '_m' : (formData.gender === 'c' ? '_c' : '');
    const formBodyTypes = safeT[`bodyTypes${genderSuffix}`] || safeT.bodyTypes || {};
    const formHairColors = safeT[`hairColors${genderSuffix}`] || safeT.hairColors || {};

    const inputClass = {
        width: '100%', padding: '16px 22px', backgroundColor: 'rgba(255, 255, 255, 0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 20px rgba(0,0,0,0.2)', 
        borderRadius: '16px', color: '#fff', fontSize: '15px', outline: 'none', 
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        appearance: 'none', WebkitAppearance: 'none', backdropFilter: 'blur(12px)', WebkitFontSmoothing: 'antialiased',
        fontFamily: 'inherit'
    };

    const labelStyle = { display: 'block', fontSize: '12px', color: '#a0a0a5', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' };

    const renderPill = (active, label, onClick, key) => (
        <div key={key} onClick={onClick} style={{ 
            padding: '12px 22px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', 
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', background: active ? `linear-gradient(135deg, ${accent}, #ff4081)` : 'rgba(255,255,255,0.04)', 
            color: active ? 'white' : '#888', boxShadow: active ? `0 8px 25px ${accent}55, inset 0 0 0 1px rgba(255,255,255,0.2)` : 'inset 0 0 0 1px rgba(255,255,255,0.05)'
        }}>
            {label}
        </div>
    );

    const renderStepIndicators = () => {
        const stepsData = [ { id: 1, label: 'Дані', icon: <Sparkles size={18} /> }, { id: 2, label: 'Основа', icon: <User size={18} /> }, { id: 3, label: 'Медіа', icon: <Image size={18} /> }, { id: 4, label: 'Фінал', icon: <Eye size={18} /> } ];
        const activeLineWidth = `calc((100% - 48px) * ${(step - 1) / 3})`;

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '45px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '24px', right: '24px', height: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 1, transform: 'translateY(-50%)', borderRadius: '2px' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '24px', width: activeLineWidth, height: '2px', background: `linear-gradient(90deg, ${accent}, #ff4081)`, zIndex: 2, transition: 'width 0.5s ease', transform: 'translateY(-50%)', borderRadius: '2px', boxShadow: `0 0 15px ${accent}` }}></div>
                
                {stepsData.map(s => {
                    const isActive = step === s.id;
                    const isPassed = step > s.id;
                    return (
                        <div key={s.id} onClick={() => setStep(s.id)} style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="menu-hover">
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive || isPassed ? `linear-gradient(135deg, ${accent}, #ff4081)` : '#14141a', color: isActive || isPassed ? 'white' : '#666', boxShadow: isActive || isPassed ? `0 8px 25px ${accent}66, inset 0 0 0 1px rgba(255,255,255,0.3)` : 'inset 0 0 0 1px rgba(255,255,255,0.1)', transition: 'all 0.4s ease' }}>
                                {isPassed ? <Check size={22} /> : s.icon}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: isActive ? 'white' : (isPassed ? accent : '#666'), textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s' }}>{s.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const displayPriceText = formData.priceTo ? `${formData.priceFrom} - ${formData.priceTo}` : (formData.priceFrom || "500");

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 8, 0.90)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', zIndex: 3999 }}></div>

            <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: (step === 4 || showModerationScreen) ? '550px' : '750px', 
                    maxHeight: '90vh', 
                    background: 'radial-gradient(120% 120% at 50% -20%, #1a1a24 0%, #0a0a0f 100%)', 
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.1), 0 40px 100px rgba(0,0,0,0.9)`, 
                    borderRadius: '36px', 
                    position: 'relative', 
                    transition: 'max-width 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    overflow: 'hidden', 
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    
                    {!showModerationScreen && (
                        <X onClick={() => setShowCreateModal(false)} className="menu-hover" style={{ position: 'absolute', top: 25, right: 25, cursor: 'pointer', color: '#aaa', zIndex: 50, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '8px', backdropFilter: 'blur(10px)' }} size={36} />
                    )}

                    <div ref={scrollContainerRef} data-lenis-prevent="true" className="custom-scrollbar" style={{ 
                        overflowY: 'auto', 
                        padding: '45px', 
                        width: '100%',
                        flex: 1
                    }}>
                        
                        {showModerationScreen ? (
                            <div className="step-animated" style={{ textAlign: 'center', padding: '20px 10px' }}>
                                <div style={{ width: '90px', height: '90px', background: `linear-gradient(135deg, ${accent}22, #ff408122)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', boxShadow: `inset 0 0 0 1px ${accent}44, 0 0 40px ${accent}33` }}>
                                    <Clock size={44} color={accent} style={{ filter: `drop-shadow(0 0 10px ${accent}88)` }} />
                                </div>
                                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginBottom: '20px', letterSpacing: '1px' }}>АНКЕТУ ВІДПРАВЛЕНО!</h2>
                                <p style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.7', marginBottom: '40px' }}>
                                    Ваша анкета успішно завантажена та наразі знаходиться на модерації.<br/><br/>
                                    Зазвичай перевірка адміністратором займає <b style={{color: 'white'}}>від 10 до 20 хвилин</b>. Після цього вона з'явиться в каталозі.
                                </p>
                                <button onClick={() => { setShowCreateModal(false); loadCatalog(); }} style={{ width: '100%', padding: '18px', background: `linear-gradient(135deg, ${accent}, #ff4081)`, border: 'none', borderRadius: '18px', color: 'white', fontSize: '15px', fontWeight: '900', cursor: 'pointer', boxShadow: `0 10px 30px ${accent}66, inset 0 0 0 1px rgba(255,255,255,0.2)`, transition: 'all 0.3s' }} className="menu-hover">
                                    ЗРОЗУМІЛО, ДЯКУЮ
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '0px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                        {editingModel ? 'РЕДАГУВАННЯ АНКЕТИ' : 'СТВОРЕННЯ АНКЕТИ'}
                                    </h2>
                                </div>

                                {renderStepIndicators()}

                                <div style={{ minHeight: '400px', position: 'relative' }}>
                                    
                                    {step === 1 && (
                                        <div className="step-animated" style={{ display: 'grid', gap: '35px' }}>
                                            <div>
                                                <label style={labelStyle}>{safeT.orientation}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                                    {genderKeys.map(k => renderPill(formData.gender === k, safeT.genders && safeT.genders[k] ? safeT.genders[k] : k, () => handleChange('gender', k), k))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                                                <div>
                                                    <label style={labelStyle}>{safeT.age}</label>
                                                    <input type="number" placeholder="18" value={formData.age} onChange={e => handleChange('age', e.target.value.slice(0, 2))} onBlur={() => handleBlurClamp('age', 18, 99)} style={inputClass} className="premium-input" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>{safeT.height}</label>
                                                    <input type="text" placeholder="1.70" value={formData.height} onChange={e => handleChange('height', e.target.value)} onBlur={handleBlurHeight} style={inputClass} className="premium-input" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>{safeT.weight} (кг)</label>
                                                    <input type="number" placeholder="55" value={formData.weight} onChange={e => handleChange('weight', e.target.value.slice(0, 3))} onBlur={() => handleBlurClamp('weight', 35, 150)} style={inputClass} className="premium-input" />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={labelStyle}>{safeT.bodyTitle}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                                    {bodyKeys.map(k => renderPill(formData.bodyType === k, formBodyTypes[k] || k, () => handleChange('bodyType', k), k))}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={labelStyle}>{safeT.hairTitle}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                                    {hairKeys.map(k => renderPill(formData.hairColor === k, formHairColors[k] || k, () => handleChange('hairColor', k), k))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="step-animated" style={{ display: 'grid', gap: '30px' }}>
                                            <div>
                                                <label style={labelStyle}>{safeT.yourNamePlaceholder}</label>
                                                <input placeholder="Наприклад: Мія" value={formData.name} onChange={e => handleChange('name', e.target.value)} style={inputClass} className="premium-input" />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>{safeT.title}</label>
                                                <input placeholder="Короткий заголовок (напр: Твоя ідеальна компаньйонка)" value={formData.title} onChange={e => handleChange('title', e.target.value)} style={inputClass} className="premium-input" />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>{safeT.desc}</label>
                                                <textarea placeholder="Розкажіть про себе детальніше. Чим ви особливі?" value={formData.desc} onChange={e => handleChange('desc', e.target.value)} style={{ ...inputClass, height: '150px', resize: 'none', lineHeight: '1.6' }} className="premium-input" />
                                            </div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', alignItems: 'end' }}>
                                                <div>
                                                    <label style={labelStyle}>Прайс за послуги (від і до)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: accent, fontWeight: '900', fontSize: '14px', zIndex: 5, pointerEvents: 'none' }}>₴</span>
                                                            <input type="number" placeholder="Від 500" value={formData.priceFrom} onChange={e => handleChange('priceFrom', e.target.value)} style={{ ...inputClass, fontSize: '16px', fontWeight: '900', letterSpacing: '1px', paddingRight: '35px' }} className="premium-input" />
                                                        </div>
                                                        <span style={{ color: '#888', fontWeight: '900' }}>-</span>
                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: accent, fontWeight: '900', fontSize: '14px', zIndex: 5, pointerEvents: 'none' }}>₴</span>
                                                            <input type="number" placeholder="До 1200" value={formData.priceTo} onChange={e => handleChange('priceTo', e.target.value)} style={{ ...inputClass, fontSize: '16px', fontWeight: '900', letterSpacing: '1px', paddingRight: '35px' }} className="premium-input" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Особистий зв'язок (Можна кілька)</label>
                                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '20px', display: 'flex', gap: '6px', marginBottom: '15px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
                                                        {contactNetworks.map(net => {
                                                            const isActive = formData.contactTypes.includes(net.id);
                                                            return (
                                                                <button key={net.id} onClick={(e) => { e.preventDefault(); toggleContactType(net.id); }} style={{ flex: 1, padding: '12px 6px', background: isActive ? net.color : 'transparent', color: isActive ? 'white' : '#888', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: isActive ? `0 8px 20px ${net.color}66` : 'none' }}>
                                                                    {net.id}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                    <input placeholder="Номер телефону або юзернейм" value={formData.contact} onChange={e => handleChange('contact', e.target.value)} style={inputClass} className="premium-input" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="step-animated" style={{ display: 'grid', gap: '30px' }}>
                                            <div style={{ background: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px', textAlign: 'center' }}>
                                                <Image color={accent} size={36} style={{ margin: '0 auto 10px' }}/>
                                                <div style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Фотографії ({photos.length}/{MAX_PHOTOS})</div>
                                                <div style={{ color: '#888', fontSize: '13px', marginBottom: '25px', lineHeight: '1.5' }}>Додайте до {MAX_PHOTOS} найкращих фото. NSFW матеріали відхиляються ШІ.</div>
                                                
                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {photos.map((p, i) => ( 
                                                        <div key={i} style={{ width: '80px', height: '110px', borderRadius: '14px', position: 'relative', overflow: 'hidden', boxShadow: `0 10px 25px rgba(0,0,0,0.5), inset 0 0 0 2px ${accent}` }}>
                                                            <img src={p.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="upload" />
                                                            <div onClick={() => setPhotos(photos.filter((_, index) => index !== i))} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,0,0,0.8)', backdropFilter: 'blur(8px)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <X size={14} color="white"/>
                                                            </div>
                                                        </div> 
                                                    ))}
                                                    {photos.length < MAX_PHOTOS && ( 
                                                        <div onClick={() => !isCheckingPhoto && fileInputRef.current.click()} style={{ width: '80px', height: '110px', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCheckingPhoto ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.02)', transition: '0.3s' }} className="menu-hover">
                                                            {isCheckingPhoto ? <div style={{ width: '24px', height: '24px', border: `3px solid transparent`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> : <Plus size={32} color="#666"/>}
                                                        </div> 
                                                    )}
                                                    <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handlePhotoUpload} />
                                                </div>
                                                {photoError && <div style={{ color: '#ff4444', fontSize: '13px', marginTop: '20px', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '10px' }}>{photoError}</div>}
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                    <label style={{ fontSize: '18px', color: 'white', fontWeight: '900', letterSpacing: '1px' }}>ПОСЛУГИ</label>
                                                    <div onClick={handleSelectAllFetishes} className="menu-hover" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: isAllFetishesSelected ? `linear-gradient(135deg, ${accent}, #ff4081)` : 'rgba(255,255,255,0.05)', borderRadius: '12px', transition: '0.3s', boxShadow: isAllFetishesSelected ? `0 5px 15px ${accent}44` : 'none' }}>
                                                        {isAllFetishesSelected ? <CheckSquare size={16} color="white" /> : <Square size={16} color="#888" />}
                                                        <span style={{ fontSize: '13px', fontWeight: '800', color: isAllFetishesSelected ? 'white' : '#aaa' }}>{isAllFetishesSelected ? 'Зняти всі' : 'Вибрати всі'}</span>
                                                    </div>
                                                </div>

                                                {/* 🟢 Додаємо ref на внутрішній скрол */}
                                                <div ref={fetishesScrollRef} style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '15px' }} className="custom-scrollbar">
                                                    {safeFetishes && Object.entries(safeFetishes).map(([catKey, category]) => (
                                                        <div key={catKey} style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '20px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)' }}>
                                                            <div style={{ fontSize: '13px', color: accent, marginBottom: '15px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>{category.title}</div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                                {Object.entries(category.items || {}).map(([itemKey, itemLabel]) => {
                                                                    const isSel = formData.fetishes.includes(itemKey);
                                                                    return (
                                                                        <div key={itemKey} onClick={() => toggleFetish(itemKey)} style={{ cursor: 'pointer', background: isSel ? `linear-gradient(135deg, ${accent}, #ff4081)` : 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '12px', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', fontSize: '13px', fontWeight: '800', color: isSel ? 'white' : '#aaa', boxShadow: isSel ? `0 5px 15px ${accent}44` : 'none' }} className="menu-hover">
                                                                            {itemLabel}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 4 && (
                                        <div className="step-animated" style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#050508', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '28px', overflow: 'hidden', position: 'relative', boxShadow: `0 30px 60px rgba(0,0,0,0.8)` }}>
                                                <div style={{ height: '420px', width: '100%', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                                    {photos.length > 0 ? ( <img src={photos[0].preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" /> ) : ( 
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1a1a24 0%, #050508 100%)' }}>
                                                            <Camera size={64} color="#333" />
                                                        </div> 
                                                    )}
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(5,5,8,1) 0%, rgba(5,5,8,0.6) 50%, transparent 100%)' }}></div>
                                                    
                                                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 10 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                            <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
                                                                {formData.name || 'Ім\'я'}
                                                            </div>
                                                            <span style={{ fontSize: '24px', fontWeight: '900', color: 'white', textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>{formData.age || "18"}</span>
                                                            <CheckCircle2 size={24} color="#4CAF50" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}/>
                                                        </div>
                                                        <div style={{ fontSize: '16px', color: accent, fontWeight: '800', textShadow: '0 2px 10px rgba(0,0,0,0.9)', letterSpacing: '0.5px' }}>
                                                            {formData.title || 'Короткий заголовок'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ padding: '20px 25px 30px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                        <span style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', color: '#ccc' }}>📍 {safeT.onlineOnly || "Тільки онлайн"}</span>
                                                        <span style={{ fontSize: '26px', fontWeight: '900', color: 'white' }}>{displayPriceText} <span style={{ fontSize: '18px', color: accent }}>₴</span></span>
                                                    </div>

                                                    {formData.desc && (
                                                        <div style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '25px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {formData.desc}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {formData.contactTypes.map(type => {
                                                            const netData = contactNetworks.find(n => n.id === type) || contactNetworks[0];
                                                            return (
                                                                <button key={type} style={{ width: '100%', padding: '16px', background: netData.color, borderRadius: '16px', color: 'white', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px', letterSpacing: '1px', boxShadow: `0 10px 25px ${netData.color}66`, border: 'none', pointerEvents: 'none' }}>
                                                                    <Send size={18} /> НАПИСАТИ ({type})
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
                                    <button onClick={() => step > 1 ? setStep(step - 1) : setShowCreateModal(false)} style={{ padding: '18px 35px', background: 'rgba(255,255,255,0.02)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', borderRadius: '18px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }} className="menu-hover">
                                        {step > 1 ? <><ChevronLeft size={20} /> НАЗАД</> : 'СКАСУВАТИ'}
                                    </button>
                                    
                                    {step < 4 ? (
                                        <button onClick={() => setStep(step + 1)} style={{ padding: '18px 50px', background: `linear-gradient(135deg, ${accent}, #ff4081)`, border: 'none', borderRadius: '18px', color: 'white', fontSize: '15px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 10px 30px ${accent}66, inset 0 0 0 1px rgba(255,255,255,0.2)`, transition: 'all 0.3s' }} className="menu-hover">
                                            ДАЛІ <ChevronRight size={20} />
                                        </button>
                                    ) : (
                                        <button onClick={handlePublish} disabled={isCheckingPhoto || isPublishing} style={{ padding: '18px 50px', background: (isCheckingPhoto || isPublishing) ? '#222' : `linear-gradient(135deg, ${accent}, #ff4081)`, border: 'none', borderRadius: '18px', color: (isCheckingPhoto || isPublishing) ? '#666' : 'white', fontSize: '15px', fontWeight: '900', letterSpacing: '1px', cursor: (isCheckingPhoto || isPublishing) ? 'not-allowed' : 'pointer', boxShadow: (isCheckingPhoto || isPublishing) ? 'none' : `0 10px 30px ${accent}66, inset 0 0 0 1px rgba(255,255,255,0.2)`, transition: 'all 0.3s' }} className="menu-hover">
                                            {isPublishing ? 'ОБРОБКА...' : (editingModel ? 'ЗБЕРЕГТИ' : 'ОПУБЛІКУВАТИ')}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
                .premium-input:focus {
                    box-shadow: inset 0 0 0 1px ${accent}, 0 5px 20px rgba(0,0,0,0.5) !important;
                    background-color: rgba(255,255,255,0.05) !important;
                }
                @keyframes slideUpFadeSmooth {
                    0% { opacity: 0; transform: translateY(15px) scale(0.98); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .step-animated {
                    animation: slideUpFadeSmooth 0.4s ease forwards;
                }
            `}} />
        </>
    );
};

export default CreateProfileModal;