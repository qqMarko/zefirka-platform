import React, { useRef, useCallback, useEffect } from 'react';
import CatalogGrid from './CatalogGrid';
import { Loader2, Lock, ShieldCheck, Zap } from 'lucide-react';

const CatalogPage = ({
    isLoggedIn, userRole, t, currentLang, accent,
    totalItems, isLoading, models, setSelectedModel,
    setContactSelectionModel, favorites, handleToggleFavorite,
    totalPages, catalogPage, handlePageChange
}) => {

    const sentinelRef = useRef(null);

    // IntersectionObserver — підвантажує наступну сторінку коли sentinel видно
    const handleObserver = useCallback((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && catalogPage < totalPages) {
            handlePageChange(catalogPage + 1);
        }
    }, [isLoading, catalogPage, totalPages, handlePageChange]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '200px', // починаємо завантаження за 200px до кінця
            threshold: 0,
        });
        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [handleObserver]);

    const allLoaded = catalogPage >= totalPages && !isLoading;

    return (
        <main>
            {(!isLoggedIn || userRole === 'client') && (
                <div style={{ marginBottom: '80px' }} className="fade-in-up">
                    <h2 style={{ color: 'white', letterSpacing: '1px', marginBottom: '40px', textAlign: 'center', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: '900', textTransform: 'uppercase' }}>{t[currentLang]?.whyUsTitle}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {[
                            { icon: Lock, color: accent, title: t[currentLang]?.whyUs1, desc: t[currentLang]?.whyUs1Desc },
                            { icon: ShieldCheck, color: '#4caf50', title: t[currentLang]?.whyUs2, desc: t[currentLang]?.whyUs2Desc },
                            { icon: Zap, color: '#ffc107', title: t[currentLang]?.whyUs3, desc: t[currentLang]?.whyUs3Desc },
                        ].map((f, i) => (
                            <div key={i} style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '26px', transition: 'border-color 0.2s, transform 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '55'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
                            >
                                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: f.color + '18', border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <f.icon size={22} color={f.color} />
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginBottom: '10px', letterSpacing: '0.3px' }}>{f.title}</div>
                                <div style={{ color: '#999', fontSize: '14px', lineHeight: '1.65', fontWeight: '400' }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 'clamp(20px, 4vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'clamp(10px, 3vw, 20px)' }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>{t[currentLang]?.catalog}</h2>
                <div style={{ background: '#111', padding: 'clamp(4px, 1.5vw, 8px) clamp(10px, 3vw, 16px)', borderRadius: '20px', fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {t[currentLang]?.found}: <span style={{ color: 'white', fontWeight: 'bold' }}>{totalItems || 0}</span>
                </div>
            </div>

            {/* Перше завантаження — spinner по центру */}
            {isLoading && models.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }} className="fade-in-up">
                    <div style={{ width: '60px', height: '60px', border: `4px solid rgba(255,255,255,0.1)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <div style={{ color: '#888', fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px' }}>{t[currentLang]?.loading || 'ЗАВАНТАЖЕННЯ...'}</div>
                </div>
            ) : (
                <>
                    <CatalogGrid
                        currentModels={models}
                        setSelectedModel={setSelectedModel}
                        setContactSelectionModel={setContactSelectionModel}
                        t={t} currentLang={currentLang} accent={accent}
                        favorites={favorites} handleToggleFavorite={handleToggleFavorite}
                    />

                    {/* Підвантаження нової сторінки — маленький spinner знизу */}
                    {isLoading && models.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                            <Loader2 size={28} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}

                    {/* Sentinel — невидимий елемент, IntersectionObserver стежить за ним */}
                    {!allLoaded && <div ref={sentinelRef} style={{ height: '1px' }} />}

                    {/* Кінець каталогу */}
                    {allLoaded && models.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 0 24px', color: '#444', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            — {t[currentLang]?.allLoaded || 'Всі анкети завантажено'} —
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default CatalogPage;