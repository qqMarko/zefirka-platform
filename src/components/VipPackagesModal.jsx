import React, { useState, useEffect } from 'react';
import { X, Crown, Zap, Star, ShieldCheck, Check, Sparkles, Diamond, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { useMegaphone } from '../context/MegaphoneContext';

const VipPackagesModal = ({ setShowVipModal, userRole, openWalletWithAmount }) => {
    
    const { balance, userUniqueId, user, loadBalance } = useStore();
    
    const megaphone = useMegaphone();
    const globalDiscountPercent = megaphone.isActive ? megaphone.vipDiscountPercent : 0;
    const promoText = megaphone.isActive ? megaphone.message : null;
    const activePackagesForDiscount = megaphone.isActive ? (megaphone.activeVipPackages || []) : [];

    // 🎯 Персональна знижка на апгрейд (з маркетинг-логіки)
    const personalUpgradeDiscount = user?.upgradeDiscount?.forPackage && 
        user.upgradeDiscount.expiresAt && 
        new Date(user.upgradeDiscount.expiresAt) > new Date()
            ? user.upgradeDiscount 
            : null;

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const [localVip, setLocalVip] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, pkgId: null, price: null });
    const [selectedDetailsId, setSelectedDetailsId] = useState(null);
    
    const isClient = userRole === 'client';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const calculatePrice = (basePriceStr, pkgDiscountPercent) => {
        const basePriceNum = Number(basePriceStr);
        if (!pkgDiscountPercent || pkgDiscountPercent <= 0) return basePriceNum;
        return Math.floor(basePriceNum - (basePriceNum * (pkgDiscountPercent / 100)));
    };

    const modelPackages = [
        { 
            id: 'start', title: 'START', price: '2000', days: `30 днів`, 
            color: '#ff007f', icon: <Star size={36} color="#ff007f" />, 
            desc: 'Срібний статус для швидкого та впевненого старту.', 
            topFeatures: ['Яскраве виділення анкети', '+5 безкоштовних підняттів в ТОП'], 
            features: ['Пріоритетне розміщення у пошуку', 'Розширена статистика переглядів', 'Можливість додати до 3-х анкет', 'Базова підтримка 24/7'], 
            isPopular: false 
        },
        { 
            id: 'premium', title: 'PREMIUM', badge: 'ХІТ', price: '4000', days: `30 днів`, 
            color: '#ffc107', icon: <Crown size={36} color="#ffc107" />, 
            desc: 'Золотий статус для максимальної уваги та безпеки.', 
            topFeatures: ['💎 Усі переваги статусу START', 'Ексклюзивна золота рамка'], 
            features: ['+10 безкоштовних підняттів в ТОП', 'Високий пріоритет у каталозі', 'Премодерація нових відгуків', 'Доступ до системи Арбітражу', 'До 5-ти активних анкет'], 
            isPopular: true 
        },
        { 
            id: 'diamond', title: 'DIAMOND', badge: 'VIP', price: '7500', days: `30 днів`, 
            color: '#00ffff', icon: <Diamond size={36} color="#00ffff" />, 
            desc: 'Абсолютний ТОП. Максимальний контроль та охоплення.', 
            topFeatures: ['👑 Усі переваги статусу PREMIUM', 'Унікальна RGB-рамка анкети'], 
            features: ['Автоматичне підняття в ТОП', 'Абсолютний ТОП у видачі', 'Повне керування відгуками', 'Прямий VIP-чат з адміністрацією', 'До 10-ти активних анкет'], 
            isPopular: false, isRgb: true 
        }
    ];

    const clientPackages = [
        { 
            id: 'premium_client', title: 'GUEST', price: '2000', days: '30 днів', 
            color: '#4caf50', icon: <ShieldCheck size={36} color="#4caf50" />, 
            desc: 'Базовий доступ для статусних клієнтів.', 
            topFeatures: ['Усі переваги статусу Безкоштовно'], 
            features: ['Вищий пріоритет в особистих повідомленнях моделі 🚀', 'Додавання анкет в Обране 🩷', 'Доступ до розділу Арбітраж ⚖️'], 
            isPopular: false 
        },
        { 
            id: 'priority_chat', title: 'PRIORITY', badge: 'ХІТ', price: '4000', days: '30 днів', 
            color: '#ffc107', icon: <Zap size={36} color="#ffc107" />, 
            desc: 'Пріоритетне спілкування та доступ до арбітражу.', 
            topFeatures: ['Усі переваги статусу GUEST'], 
            features: ['Вищий пріоритет для розгляду арбітражних скарг 🚀', 'Виділення повідомлень кольором в чаті моделі 🎨', 'Можливість залишити відгук на анкеті моделі 💬'], 
            isPopular: true 
        },
        { 
            id: 'concierge', title: 'CONCIERGE', badge: 'ПРИВИД', price: '8000', days: '30 днів', 
            color: '#ff007f', icon: <Sparkles size={36} color="#ff007f" />, 
            desc: 'Абсолютна анонімність та індивідуальний сервіс.', 
            topFeatures: ['👑 Усі переваги статусу PRIORITY'], 
            features: ['Персональний менеджер 24/7', 'Приховане прочитання повідомлень 😶‍🌫️', 'Найвищий пріоритет для розгляду арбітражних скарг 🚀', 'Відшкодування коштів 💵', 'Персональне вирішення проблем через адміністратора 🤴'], 
            isPopular: false, isRgb: true 
        }
    ];

    const packages = isClient ? clientPackages : modelPackages;

    const getRemainingTime = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - currentTime;
        if (diff <= 0) return null; 
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        if (days > 0) return `${days} дн ${hours} год`;
        return `${hours} год`;
    };

    const handleInitiateBuy = (priceStr, packageId) => {
        const currentActivePkg = localVip ? localVip.packageId : user?.vipPackage;
        const currentExpire = localVip ? localVip.expiresAt : user?.vipExpiresAt;
        const hasActivePackage = currentActivePkg && currentActivePkg !== 'none' && new Date(currentExpire) > currentTime;

        if (hasActivePackage) {
            setConfirmDialog({ isOpen: true, pkgId: packageId, price: priceStr });
        } else {
            executePurchase(priceStr, packageId);
        }
    };

    const executePurchase = async (priceStr, packageId) => {
        if (isProcessing) return;
        setConfirmDialog({ isOpen: false, pkgId: null, price: null }); 
        const amount = Number(priceStr);
        
        if (balance >= amount) {
            setIsProcessing(true);
            const loadingToast = toast.loading('Обробка платежу...');
            try {
                let BASE_URL = import.meta.env.VITE_API_URL || '';
                if (BASE_URL.endsWith('/api')) BASE_URL = BASE_URL.slice(0, -4);

                const res = await fetch(`${BASE_URL}/api/wallet/buy-vip`, { 
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ userId: userUniqueId, amount, packageId }) 
                });
                
                const data = await res.json();
                if (data.success) {
                    toast.success(`🎉 Статус успішно активовано!`, { id: loadingToast, duration: 3000 });
                    setLocalVip({
                        packageId: data.vipPackage || packageId,
                        expiresAt: data.vipExpiresAt || new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
                    });
                    if (loadBalance) loadBalance(userUniqueId); 
                } else {
                    toast.error(data.message || '❌ Помилка покупки', { id: loadingToast });
                }
            } catch (err) { 
                toast.error('Мережева помилка!', { id: loadingToast }); 
            } finally { 
                setIsProcessing(false); 
            }
        } else {
            const needed = amount - balance;
            toast.error(`Недостатньо коштів! Поповніть ще на ${needed} ₴`);
            setShowVipModal(false);
            if (openWalletWithAmount) openWalletWithAmount(needed.toString());
        }
    };

    const detailsPkg = packages.find(p => p.id === selectedDetailsId);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div 
                style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 10, 0.9)', backdropFilter: 'blur(25px)', cursor: 'pointer' }} 
                onClick={() => setShowVipModal(false)} 
            />
            
            <style>
                {`
                    .premium-typography { font-family: 'Inter', sans-serif; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
                    @keyframes rgbBorder { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                    .micro-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .micro-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
                    .glass-popup { animation: popupIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                    @keyframes popupIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                `}
            </style>

            <div 
                className="fade-in-up premium-typography custom-scrollbar" 
                style={{ position: 'relative', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(15, 15, 20, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', zIndex: 1 }}
            >
                <X 
                    onClick={() => setShowVipModal(false)} 
                    style={{ position: 'absolute', top: '25px', right: '25px', cursor: 'pointer', color: '#888', transition: '0.3s', zIndex: 100 }} 
                    className="menu-hover" 
                    size={32} 
                />

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '900', color: 'white', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                        {isClient ? "Преміум Доступ" : "Елітні Статуси"}
                    </h2>
                    <p style={{ color: '#aaa', fontSize: '16px', maxWidth: '500px', margin: '0 auto', fontWeight: '500' }}>
                        Оберіть свій рівень домінування на платформі.
                    </p>
                </div>

                {promoText && (
                    <div style={{ background: 'rgba(233, 30, 99, 0.1)', border: '1px solid rgba(233, 30, 99, 0.4)', padding: '16px', borderRadius: '16px', marginBottom: '30px', color: '#e91e63', textAlign: 'center', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 0 30px rgba(233, 30, 99, 0.1)' }}>
                        <Zap size={22} fill="#e91e63" />
                        {promoText}
                        <Zap size={22} fill="#e91e63" />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {packages.map((pkg) => {
                        const activePkgId = localVip ? localVip.packageId : user?.vipPackage;
                        const activeExpire = localVip ? localVip.expiresAt : user?.vipExpiresAt;
                        const timeLeft = getRemainingTime(activeExpire);
                        const isActiveStatus = activePkgId === pkg.id && timeLeft !== null;
                        
                        const pkgDiscount = activePackagesForDiscount.includes(pkg.id) ? globalDiscountPercent : 0;
                        // 🎯 Персональна знижка має пріоритет над глобальною
                        const personalDiscount = (!isActiveStatus && personalUpgradeDiscount?.forPackage === pkg.id) 
                            ? personalUpgradeDiscount.discountPercent 
                            : 0;
                        const effectiveDiscount = Math.max(pkgDiscount, personalDiscount);
                        const currentPrice = calculatePrice(pkg.price, effectiveDiscount);
                        const isPersonalOffer = personalDiscount > 0 && personalDiscount >= pkgDiscount;

                        return (
                            <div 
                                key={pkg.id} 
                                className={!isActiveStatus ? "micro-card" : ""} 
                                style={{ 
                                    position: 'relative', 
                                    background: isActiveStatus ? 'linear-gradient(145deg, rgba(20, 40, 20, 0.9), rgba(10, 20, 10, 0.9))' : 'rgba(10, 10, 15, 0.8)', 
                                    borderRadius: '24px', 
                                    border: `1px solid ${isActiveStatus ? '#4caf50' : (pkg.isPopular ? pkg.color : 'rgba(255,255,255,0.05)')}`, 
                                    padding: '35px 25px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    textAlign: 'center', 
                                    boxShadow: isActiveStatus ? `0 0 50px rgba(76, 175, 80, 0.15)` : (pkg.isPopular ? `0 20px 60px ${pkg.color}22` : '0 10px 40px rgba(0,0,0,0.5)'), 
                                    overflow: 'hidden' 
                                }}
                            >
                                {pkg.isRgb && !isActiveStatus && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${pkg.color}, #00ffff, ${pkg.color})`, backgroundSize: '200% 200%', animation: 'rgbBorder 3s linear infinite' }} />
                                )}
                                
                                {isActiveStatus && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#4caf50' }} />
                                )}
                                
                                {pkg.badge && !isActiveStatus && (
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: pkg.color, color: '#000', fontSize: '11px', fontWeight: '900', padding: '6px 12px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                                        {pkg.badge}
                                    </div>
                                )}

                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `${pkg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${pkg.color}44`, marginBottom: '20px' }}>
                                    {pkg.icon}
                                </div>
                                
                                <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', margin: '0 0 15px 0' }}>
                                    {pkg.title}
                                </h3>
                                
                                {/* 🔥 КРАСИВИЙ БЛОК ЗІ ЗНИЖКОЮ */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', minHeight: '65px', justifyContent: 'center' }}>
                                    {effectiveDiscount > 0 && !isActiveStatus ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ 
                                                    background: isPersonalOffer 
                                                        ? 'linear-gradient(90deg, #7c3aed, #a855f7)' 
                                                        : 'linear-gradient(90deg, #ff007f, #ff4444)', 
                                                    color: 'white', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '8px', 
                                                    fontSize: '12px', 
                                                    fontWeight: '900', 
                                                    boxShadow: isPersonalOffer 
                                                        ? '0 4px 15px rgba(124,58,237,0.5)' 
                                                        : '0 4px 15px rgba(255,0,127,0.4)', 
                                                    letterSpacing: '1px' 
                                                }}>
                                                    {isPersonalOffer ? `🎁 ВАША ЗНИЖКА -${effectiveDiscount}%` : `ЗНИЖКА -${effectiveDiscount}%`}
                                                </span>
                                                <s style={{ color: '#888', fontSize: '15px', fontWeight: '600' }}>
                                                    {pkg.price} ₴
                                                </s>
                                            </div>
                                            {isPersonalOffer && (
                                                <div style={{ fontSize: '11px', color: '#a855f7', marginBottom: '6px', fontWeight: '700' }}>
                                                    До {new Date(personalUpgradeDiscount.expiresAt).toLocaleDateString('uk-UA')}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                <span style={{ fontSize: '42px', fontWeight: '900', color: pkg.color, lineHeight: '1', letterSpacing: '-1px', textShadow: `0 0 25px ${pkg.color}66` }}>
                                                    {currentPrice}
                                                </span>
                                                <span style={{ fontSize: '16px', color: pkg.color, fontWeight: 'bold', opacity: 0.8 }}>
                                                    UAH
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                            <span style={{ fontSize: '38px', fontWeight: '900', color: isActiveStatus ? '#4caf50' : pkg.color, lineHeight: '1', letterSpacing: '-1px' }}>
                                                {pkg.price}
                                            </span>
                                            <span style={{ fontSize: '15px', color: '#666', fontWeight: 'bold' }}>
                                                UAH
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                                    <button 
                                        onClick={() => setSelectedDetailsId(pkg.id)} 
                                        style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                                        className="menu-hover"
                                    >
                                        <Info size={16} color={pkg.color} /> Що всередині?
                                    </button>

                                    {isActiveStatus ? (
                                        <div style={{ width: '100%', padding: '14px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '14px', color: '#4caf50', textAlign: 'center' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <CheckCircle2 size={16} /> АКТИВОВАНО
                                            </div>
                                            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '600' }}>
                                                <Clock size={12}/> {timeLeft}
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleInitiateBuy(currentPrice.toString(), pkg.id)} 
                                            disabled={isProcessing} 
                                            style={{ width: '100%', padding: '14px', background: pkg.isPopular ? pkg.color : 'rgba(255,255,255,0.05)', border: pkg.isPopular ? 'none' : `1px solid ${pkg.color}55`, borderRadius: '14px', color: pkg.isPopular ? '#000' : pkg.color, fontSize: '15px', fontWeight: '900', letterSpacing: '1px', cursor: isProcessing ? 'not-allowed' : 'pointer', transition: '0.3s' }}
                                        >
                                            АКТИВУВАТИ
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ДЕТАЛІ ПАКЕТУ */}
            {detailsPkg && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div 
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(15px)' }} 
                        onClick={() => setSelectedDetailsId(null)} 
                    />
                    <div 
                        className="glass-popup premium-typography" 
                        style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'rgba(20, 20, 25, 0.95)', border: `1px solid ${detailsPkg.color}55`, borderRadius: '28px', padding: '40px', boxShadow: `0 30px 80px rgba(0,0,0,0.9)` }}
                    >
                        <button 
                            onClick={() => setSelectedDetailsId(null)} 
                            style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: `${detailsPkg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${detailsPkg.color}66` }}>
                                {detailsPkg.icon}
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>
                                {detailsPkg.title}
                            </h3>
                        </div>
                        
                        <p style={{ color: '#bbb', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>
                            {detailsPkg.desc}
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                            {detailsPkg.topFeatures.map((f, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                    <Check size={18} color={detailsPkg.color} />
                                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{f}</span>
                                </div>
                            ))}
                            {detailsPkg.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                    <Check size={16} color={detailsPkg.color} style={{ opacity: 0.5 }} />
                                    <span style={{ color: '#ccc', fontSize: '14px' }}>{f}</span>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => setSelectedDetailsId(null)} 
                            style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Зрозуміло
                        </button>
                    </div>
                </div>
            )}

            {/* ПІДТВЕРДЖЕННЯ ЗАМІНИ */}
            {confirmDialog.isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div 
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} 
                        onClick={() => setConfirmDialog({ isOpen: false, pkgId: null, price: null })} 
                    />
                    <div 
                        className="fade-in-up premium-typography" 
                        style={{ position: 'relative', background: '#111', border: '1px solid rgba(255, 68, 68, 0.4)', borderRadius: '24px', padding: '30px', maxWidth: '420px', width: '100%', textAlign: 'center' }}
                    >
                        <div style={{ width: '64px', height: '64px', background: 'rgba(255,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(255,68,68,0.3)' }}>
                            <AlertTriangle size={32} color="#ff4444" />
                        </div>
                        <h3 style={{ color: 'white', fontSize: '22px', fontWeight: '900', marginBottom: '15px' }}>
                            Заміна статусу
                        </h3>
                        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>
                            У вас вже є активний VIP. При покупці нового старий буде анульовано без повернення коштів.
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => setConfirmDialog({ isOpen: false, pkgId: null, price: null })} 
                                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px', border: '1px solid #333' }}
                            >
                                Скасувати
                            </button>
                            <button 
                                onClick={() => executePurchase(confirmDialog.price, confirmDialog.pkgId)} 
                                style={{ flex: 1, padding: '14px', background: '#ff4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}
                            >
                                Так, замінити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VipPackagesModal;