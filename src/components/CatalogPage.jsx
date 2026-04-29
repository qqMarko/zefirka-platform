import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CatalogGrid from './CatalogGrid';

const CatalogPage = ({
    isLoggedIn, userRole, t, currentLang, accent,
    totalItems, isLoading, models, setSelectedModel, 
    setContactSelectionModel, favorites, handleToggleFavorite,
    totalPages, catalogPage, handlePageChange
}) => {
    return (
        <main>
            {(!isLoggedIn || userRole === 'client') && (
                <div style={{ marginBottom: '80px' }} className="fade-in-up">
                    <h2 style={{ color: 'white', letterSpacing: '1px', marginBottom: '40px', textAlign: 'center', fontSize: '36px', fontWeight: '900', textTransform: 'uppercase' }}>{t[currentLang]?.whyUsTitle}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                        <div className="benefit-card"><div style={{ fontSize: '20px', fontWeight: 'bold', color: accent, marginBottom: '15px', letterSpacing: '0.5px' }}>{t[currentLang]?.whyUs1}</div><div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7', fontWeight: '400' }}>{t[currentLang]?.whyUs1Desc}</div></div>
                        <div className="benefit-card"><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50', marginBottom: '15px', letterSpacing: '0.5px' }}>{t[currentLang]?.whyUs2}</div><div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7', fontWeight: '400' }}>{t[currentLang]?.whyUs2Desc}</div></div>
                        <div className="benefit-card"><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107', marginBottom: '15px', letterSpacing: '0.5px' }}>{t[currentLang]?.whyUs3}</div><div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7', fontWeight: '400' }}>{t[currentLang]?.whyUs3Desc}</div></div>
                    </div>
                </div>
            )}
            
            <div style={{ marginBottom: 'clamp(20px, 4vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'clamp(10px, 3vw, 20px)' }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>{t[currentLang]?.catalog}</h2>
                <div style={{ background: '#111', padding: 'clamp(4px, 1.5vw, 8px) clamp(10px, 3vw, 16px)', borderRadius: '20px', fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {t[currentLang]?.found}: <span style={{color: 'white', fontWeight: 'bold'}}>{totalItems || 0}</span>
                </div>
            </div>
            
            {isLoading ? ( 
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }} className="fade-in-up">
                    <div style={{ width: '60px', height: '60px', border: `4px solid rgba(255,255,255,0.1)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                    <div style={{ color: '#888', fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px' }}>{t[currentLang]?.loading || 'ЗАВАНТАЖЕННЯ...'}</div>
                </div>
            ) : (
                <>
                    <CatalogGrid currentModels={models} setSelectedModel={setSelectedModel} setContactSelectionModel={setContactSelectionModel} t={t} currentLang={currentLang} accent={accent} favorites={favorites} handleToggleFavorite={handleToggleFavorite} />
                    
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '50px', paddingBottom: '20px' }} className="fade-in-up">
                            <button onClick={() => handlePageChange(catalogPage - 1)} disabled={catalogPage === 1} style={{ padding: '10px', background: catalogPage === 1 ? '#111' : 'transparent', border: `1px solid ${catalogPage === 1 ? 'rgba(255,255,255,0.05)' : accent}`, color: catalogPage === 1 ? '#555' : accent, borderRadius: '8px', cursor: catalogPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }} className={catalogPage !== 1 ? "menu-hover" : ""}> <ChevronLeft size={24} /> </button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} onClick={() => handlePageChange(i + 1)} style={{ width: '44px', height: '44px', background: catalogPage === i + 1 ? accent : '#111', border: catalogPage === i + 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', cursor: catalogPage === i + 1 ? 'default' : 'pointer' }} className={catalogPage !== i + 1 ? "menu-hover" : ""}>{i + 1}</button>
                                ))}
                            </div>
                            <button onClick={() => handlePageChange(catalogPage + 1)} disabled={catalogPage === totalPages} style={{ padding: '10px', background: catalogPage === totalPages ? '#111' : 'transparent', border: `1px solid ${catalogPage === totalPages ? 'rgba(255,255,255,0.05)' : accent}`, color: catalogPage === totalPages ? '#555' : accent, borderRadius: '8px', cursor: catalogPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }} className={catalogPage !== totalPages ? "menu-hover" : ""}> <ChevronRight size={24} /> </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default CatalogPage;