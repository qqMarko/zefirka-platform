import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Camera, CheckCircle2, Plus, Eye } from 'lucide-react'; 
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { t } from '../data/translations';
import { accent, styles } from '../styles/theme';
import useSmoothScroll from '../hooks/useSmoothScroll';
import imageCompression from 'browser-image-compression'; 

// 🚀 ДИНАМІЧНИЙ IP БЕКЕНДУ
const API_URL = `http://${window.location.hostname}:5000/api`;

const CreateProfileModal = () => {
    // 🔥 ДОДАЛИ myModels та user
    const { currentLang, setShowCreateModal, editingModel, loadCatalog, userUniqueId, myModels, user } = useStore();

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '', title: '', desc: '', age: '', height: '', weight: '', 
        priceFrom: '', contact: '', contactType: 'Telegram', hairColor: 'blonde', 
        bodyType: 'slim', gender: 'w', fetishes: []
    });

    const [photos, setPhotos] = useState([]);
    const [isCheckingPhoto, setIsCheckingPhoto] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [photoError, setPhotoError] = useState('');

    const genderKeys = ["w", "m", "c", "l", "g", "t"];
    const bodyKeys = ["slim", "athletic", "curvy", "thick"];
    const hairKeys = ["blonde", "brunette", "brown", "red", "color"];

    // 🔥 ФАЗА 1: МАТРИЦЯ ЛІМІТІВ ДЛЯ МОДЕЛЕЙ
    const getLimits = () => {
        const pkg = user?.vipPackage;
        if (pkg === 'diamond') return { maxProfiles: 10, maxPhotos: 50 };
        if (pkg === 'premium') return { maxProfiles: 5, maxPhotos: 15 };
        if (pkg === 'start') return { maxProfiles: 3, maxPhotos: 10 };
        return { maxProfiles: 1, maxPhotos: 5 }; // БЕЗКОШТОВНО
    };
    const limits = getLimits();

    // 🔥 БЛОКУВАННЯ СТВОРЕННЯ НОВОЇ АНКЕТИ
    useEffect(() => {
        // Якщо це НЕ редагування, і ліміт вичерпано - викидаємо з модалки
        if (!editingModel && myModels.length >= limits.maxProfiles) {
            toast.error(`❌ Ліміт анкет (${limits.maxProfiles}) вичерпано! Підвищіть статус.`, { duration: 5000 });
            setShowCreateModal(false);
        }
    }, [myModels, limits.maxProfiles, editingModel, setShowCreateModal]);

    useEffect(() => {
        if (editingModel) {
            setFormData({
                name: editingModel.name || '', 
                title: editingModel.title || '', 
                desc: editingModel.bio || editingModel.desc || '',
                age: editingModel.age || '', 
                height: editingModel.height || '', 
                weight: editingModel.weight || '',
                priceFrom: editingModel.priceFrom || '', 
                contact: editingModel.contact || '', 
                contactType: editingModel.contactType || 'Telegram',
                hairColor: editingModel.hairColor || 'blonde', 
                bodyType: editingModel.bodyType || 'slim',
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

    useSmoothScroll(scrollRef);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleFetish = (fKey) => {
        setFormData(prev => ({
            ...prev, 
            fetishes: prev.fetishes.includes(fKey) 
                ? prev.fetishes.filter(i => i !== fKey) 
                : [...prev.fetishes, fKey]
        }));
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return; 

        // 🔥 ПЕРЕВІРКА ЛІМІТУ ФОТОГРАФІЙ ПРИ ЗАВАНТАЖЕННІ
        if (photos.length + files.length > limits.maxPhotos) {
            toast.error(`⚠️ Максимум ${limits.maxPhotos} фото для вашого статусу!`);
            e.target.value = '';
            return;
        }
        
        setPhotoError(''); 
        setIsCheckingPhoto(true);

        const options = { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: false };

        for (const file of files) {
            try {
                const compressedBlob = await imageCompression(file, options);
                const properFile = new File([compressedBlob], file.name || `photo_${Date.now()}.jpg`, {
                    type: compressedBlob.type || 'image/jpeg',
                    lastModified: Date.now()
                });
                
                setPhotos(prev => [...prev, { 
                    file: properFile, 
                    preview: URL.createObjectURL(properFile),
                    isUploaded: false 
                }]);
            } catch (error) { console.error("Помилка стиснення:", error); }
        }
        
        setIsCheckingPhoto(false); 
        e.target.value = ''; 
    };

    const handlePublish = async () => {
        if (!formData.name || !formData.age || photos.length === 0) {
            toast.error('Заповніть ім\'я, вік та додайте хоча б 1 фото!', { style: { background: '#111', color: '#fff', border: '1px solid #ff4444' } });
            return;
        }

        // 🔥 ФІНАЛЬНА ПЕРЕВІРКА ПЕРЕД ВІДПРАВКОЮ
        if (photos.length > limits.maxPhotos) {
            return toast.error(`⚠️ Максимум ${limits.maxPhotos} фото для вашого статусу! Видаліть зайві.`);
        }

        setIsPublishing(true);
        const loadingToast = toast.loading('Завантаження фото...');

        try {
            const uploadedUrls = [];
            
            for (const photoObj of photos) {
                if (photoObj.isUploaded) {
                    uploadedUrls.push(photoObj.preview);
                } else {
                    const uploadResult = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${API_URL}/upload`, true);
                        
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                resolve(JSON.parse(xhr.responseText));
                            } else {
                                reject(new Error(`Помилка сервера: ${xhr.status}`));
                            }
                        };
                        
                        xhr.onerror = () => reject(new Error('Мережева помилка телефону'));
                        
                        const uploadData = new FormData();
                        uploadData.append('photo', photoObj.file, photoObj.file.name || `photo_${Date.now()}.jpg`);
                        xhr.send(uploadData);
                    });
                    
                    const finalUrl = uploadResult.url || uploadResult.imageUrl || uploadResult.secure_url || uploadResult.path;
                    
                    if (uploadResult.success && finalUrl) {
                        uploadedUrls.push(finalUrl);
                    } else {
                        throw new Error('Бекенд не віддав посилання на фотографію!');
                    }
                }
            }

            toast.loading('Збереження анкети...', { id: loadingToast });

            const finalProfileData = {
                userId: userUniqueId, 
                name: formData.name,
                title: formData.title,
                age: parseInt(formData.age) || 18,
                priceFrom: parseInt(formData.priceFrom) || 500,
                gender: formData.gender, 
                bodyType: formData.bodyType,
                hairColor: formData.hairColor,
                fetishes: formData.fetishes,
                contactType: formData.contactType,
                contact: formData.contact,
                bio: formData.desc || formData.title,
                photos: uploadedUrls 
            };
            
            const url = editingModel ? `${API_URL}/profiles/${editingModel.id}` : `${API_URL}/profiles`;
            const method = editingModel ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalProfileData),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('✅ Анкету відправлено на модерацію!', { id: loadingToast, style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
                loadCatalog(); 
                setShowCreateModal(false); 
            } else {
                toast.error('❌ Помилка бази: ' + result.message, { id: loadingToast });
            }

        } catch (error) {
            console.error('Помилка відправки:', error);
            toast.error(`❌ Помилка: ${error.message}`, { id: loadingToast, duration: 5000 });
        } finally {
            setIsPublishing(false); 
        }
    };

    const safeT = t[currentLang] || {};
    const genderSuffix = formData.gender === 'm' ? '_m' : (formData.gender === 'c' ? '_c' : '');
    const formBodyTypes = safeT[`bodyTypes${genderSuffix}`] || safeT.bodyTypes || {};
    const formHairColors = safeT[`hairColors${genderSuffix}`] || safeT.hairColors || {};

    return (
        <div ref={scrollRef} data-lenis-prevent="true" className="custom-scrollbar create-profile-modal-bg" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 4000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', margin: 'auto' }}>
                
                <div className="modal-pop create-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', position: 'relative' }}>
                    
                    <div className="create-profile-left" style={{ position: 'relative', background: '#0a0a0f', border: `1px solid rgba(255,255,255,0.05)`, borderRadius: '24px', padding: '40px', boxShadow: `0 20px 60px rgba(0,0,0,0.9)` }}>
                        <X onClick={() => setShowCreateModal(false)} className="close-btn-mobile menu-hover" style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', color: '#888', zIndex: 50 }} size={28} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', paddingRight: '40px' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap color={accent}/> 
                                {editingModel ? (safeT.editBtn || 'Редагувати') : (safeT.create || 'Створити')}
                            </h2>
                        </div>
                        
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div className="cp-block" style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: 'bold' }}>
                                    {safeT.orientation}
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {genderKeys.map(gKey => ( 
                                        <div key={gKey} onClick={() => handleChange('gender', gKey)} className={`filter-pill ${formData.gender === gKey ? 'active' : ''}`}>
                                            {safeT.genders?.[gKey]}
                                        </div> 
                                    ))}
                                </div>
                            </div>

                            <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: 'bold', paddingLeft: '5px' }}>{safeT.age}</label>
                                    <input type="number" placeholder="18" value={formData.age} onChange={e => handleChange('age', e.target.value.slice(0, 2))} className="mobile-input-fix center-text-mobile" style={{ ...styles.input, background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: 'bold', paddingLeft: '5px' }}>{safeT.height} (м)</label>
                                    <input type="text" placeholder="1,70" value={formData.height} onChange={e => handleChange('height', e.target.value)} className="mobile-input-fix center-text-mobile" style={{ ...styles.input, background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: 'bold', paddingLeft: '5px' }}>{safeT.weight} (кг)</label>
                                    <input type="number" placeholder="55" value={formData.weight} onChange={e => handleChange('weight', e.target.value.slice(0, 3))} className="mobile-input-fix center-text-mobile" style={{ ...styles.input, background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }} />
                                </div>
                            </div>

                            <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: 'bold', paddingLeft: '5px' }}>{safeT.bodyTitle}</label>
                                    <select value={formData.bodyType} onChange={e => handleChange('bodyType', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, cursor: 'pointer', background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {bodyKeys.map(b => <option key={b} value={b}>{formBodyTypes[b] || b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: 'bold', paddingLeft: '5px' }}>{safeT.hairTitle}</label>
                                    <select value={formData.hairColor} onChange={e => handleChange('hairColor', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, cursor: 'pointer', background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {hairKeys.map(h => <option key={h} value={h}>{formHairColors[h] || h}</option>)}
                                    </select>
                                </div>
                            </div>

                            <input placeholder={safeT.yourNamePlaceholder} value={formData.name} onChange={e => handleChange('name', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <input placeholder={safeT.title} value={formData.title} onChange={e => handleChange('title', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, background: '#050508', border: `1px solid ${formData.title ? 'rgba(255,255,255,0.1)' : accent}` }} />
                            <textarea placeholder={safeT.desc} value={formData.desc} onChange={e => handleChange('desc', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, height: '120px', resize: 'vertical', background: '#050508', border: '1px solid rgba(255,255,255,0.1)' }} />
                            
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: accent, fontWeight: '900' }}>UAH</span>
                                <input placeholder={safeT.priceFrom} type="number" value={formData.priceFrom} onChange={e => handleChange('priceFrom', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, background: '#050508', border: `1px solid ${accent}` }} />
                            </div>

                            <div className="cp-block" style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '15px', display: 'block' }}>{safeT.fetishesTitle}</label>
                                {safeT.fetishes && Object.entries(safeT.fetishes).map(([catKey, category]) => (
                                    <div key={catKey} style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '11px', color: accent, marginBottom: '10px', fontWeight: 'bold' }}>{category.title}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {Object.entries(category.items).map(([itemKey, itemLabel]) => (
                                                <div key={itemKey} onClick={() => toggleFetish(itemKey)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: formData.fetishes.includes(itemKey) ? `${accent}33` : '#222', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${formData.fetishes.includes(itemKey) ? accent : 'rgba(255,255,255,0.1)'}`, transition: '0.2s', fontWeight: '500' }}>
                                                    <span style={{ fontSize: '12px', color: formData.fetishes.includes(itemKey) ? 'white' : '#aaa' }}>{itemLabel}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cp-block" style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '20px', background: '#111', borderRadius: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: 'bold' }}>{safeT.personalMessenger}</label>
                                <div className="messenger-btns-mobile" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    {["Telegram", "WhatsApp", "Viber"].map(m => ( 
                                        <button key={m} onClick={() => handleChange('contactType', m)} style={{ flex: 1, padding: '12px', background: formData.contactType === m ? accent : '#050508', border: formData.contactType === m ? 'none' : '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px', fontWeight: 'bold', transition: '0.2s' }}>
                                            {m}
                                        </button> 
                                    ))}
                                </div>
                                <input placeholder={`${safeT.your || 'Ваш'} ${formData.contactType}`} value={formData.contact} onChange={e => handleChange('contact', e.target.value)} className="mobile-input-fix" style={{ ...styles.input, background: '#050508', fontWeight: '500' }} />
                            </div>
                            
                            <div className="cp-block" style={{ border: `1px dashed rgba(233, 30, 99, 0.3)`, padding: '25px', borderRadius: '12px', textAlign: 'center', background: 'rgba(233, 30, 99, 0.05)' }}>
                                <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>{safeT.uploadPhotosTitle}</div>
                                <div style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>Максимум {limits.maxPhotos} фото для вашого статусу</div>
                                
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {photos.map((p, i) => ( 
                                        <div key={i} style={{ width: '80px', height: '100px', border: `2px solid ${accent}`, borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                                            <img src={p.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="upload" />
                                            <div onClick={() => setPhotos(photos.filter((_, index) => index !== i))} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(255,0,0,0.8)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <X size={14} color="white"/>
                                            </div>
                                        </div> 
                                    ))}
                                    {/* 🔥 КНОПКА ЗНИКАЄ, ЯКЩО ЛІМІТ ФОТО ДОСЯГНУТО */}
                                    {photos.length < limits.maxPhotos && ( 
                                        <div onClick={() => !isCheckingPhoto && fileInputRef.current.click()} style={{ width: '80px', height: '100px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCheckingPhoto ? 'not-allowed' : 'pointer', background: '#111', transition: '0.3s' }} className="menu-hover">
                                            {isCheckingPhoto ? <div style={{ width: '24px', height: '24px', border: `3px solid transparent`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> : <Plus size={24} color="#888"/>}
                                        </div> 
                                    )}
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handlePhotoUpload} />
                                </div>
                                {photoError && <div style={{ color: '#ff4444', fontSize: '13px', marginTop: '15px', fontWeight: 'bold', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '6px' }}>{photoError}</div>}
                            </div>

                            <button onClick={handlePublish} disabled={isCheckingPhoto || isPublishing} style={{ padding: '20px', background: (isCheckingPhoto || isPublishing) ? '#222' : accent, border: 'none', borderRadius: '12px', color: (isCheckingPhoto || isPublishing) ? '#666' : 'white', fontSize: '18px', fontWeight: '900', cursor: (isCheckingPhoto || isPublishing) ? 'not-allowed' : 'pointer', marginTop: '10px', transition: '0.3s', boxShadow: (isCheckingPhoto || isPublishing) ? 'none' : `0 10px 30px ${accent}66` }} className="menu-hover"> 
                                {isPublishing ? 'Обробка...' : (editingModel ? safeT.save : safeT.publish)} 
                            </button>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginTop: '10px', fontWeight: '500' }}>
                                {safeT.cancelBtn || 'Скасувати'}
                            </button>
                        </div>
                    </div>

                    <div className="create-profile-preview" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'sticky', top: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingLeft: '10px' }}>
                                <Eye color={accent} size={24} />
                                <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{safeT.previewTitle}</h3>
                            </div>
                            <div style={{ backgroundColor: '#050508', border: '1px solid #1a1a1a', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                                <div style={{ height: '420px', width: '100%', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                    {photos.length > 0 ? ( 
                                        <img src={photos[0].preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" /> 
                                    ) : ( 
                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333', background: '#0a0a0f' }}>
                                            <Camera size={48} opacity={0.2} style={{ marginBottom: '10px' }}/>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{safeT.photoPlaceholder}</span>
                                        </div> 
                                    )}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', pointerEvents: 'none' }}></div>
                                </div>
                                <div style={{ padding: '25px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{formData.name || safeT.yourNamePlaceholder}</div>
                                                <CheckCircle2 size={20} color="#4CAF50" />
                                            </div>
                                            <div style={{ fontSize: '16px', color: accent, fontWeight: 'bold' }}>{formData.title || safeT.profileTitlePlaceholder}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '24px', fontWeight: '900', color: accent }}>
                                                {formData.priceFrom || "500"} <span style={{ fontSize: '14px', color: '#888' }}>₴</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '500', flexWrap: 'wrap' }}>
                                        <span style={{ background: '#111', padding: '4px 10px', borderRadius: '6px' }}>{formData.age || "18"} {safeT.age}</span>
                                        <span style={{ background: '#111', padding: '4px 10px', borderRadius: '6px' }}>📍 {safeT.onlineOnly}</span>
                                    </div>
                                    <button style={{ width: '100%', padding: '15px', background: 'transparent', border: `1px solid ${accent}`, borderRadius: '8px', color: accent, fontWeight: 'bold', cursor: 'not-allowed', fontFamily: 'inherit', opacity: 0.5 }}>
                                        {safeT.write || 'Написати'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateProfileModal;