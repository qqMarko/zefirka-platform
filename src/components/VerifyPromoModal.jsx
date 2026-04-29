import React from 'react';
import { X, ShieldCheck, Camera, Video } from 'lucide-react';

const VerifyPromoModal = ({ setShowVerifyPromo, setShowSupport, handleSupportSend, t, currentLang, accent }) => {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="modal-pop" style={{ width: '600px', background: '#000', border: `1px solid ${accent}`, padding: '40px', position: 'relative', boxShadow: `0 0 40px ${accent}33`, borderRadius: '24px' }}>
                <X onClick={() => setShowVerifyPromo(false)} style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', color: '#888' }} className="menu-hover" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <ShieldCheck size={32} color={accent} />
                    <h2 style={{ margin: 0, color: accent, letterSpacing: '1px', fontWeight: '900' }}>{t[currentLang]?.verifyTitle}</h2>
                </div>
                <p style={{ color: '#aaa', lineHeight: '1.6', fontSize: '14px', marginBottom: '30px', fontWeight: '500' }}>{t[currentLang]?.verifyText1}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#050508', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4CAF50' }}><Camera size={20}/><h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{t[currentLang]?.vLevel1}</h3></div>
                        <p style={{ margin: 0, color: '#888', fontSize: '14px', lineHeight: '1.5', fontWeight: '500' }}>{t[currentLang]?.vLevel1Desc}</p>
                        <button onClick={() => { setShowVerifyPromo(false); setShowSupport(true); handleSupportSend("Хочу пройти Базову верифікацію по фото."); }} style={{ alignSelf: 'flex-start', padding: '10px 20px', background: 'none', border: '1px solid #4CAF50', color: '#4CAF50', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px' }} className="menu-hover">{t[currentLang]?.verifyAction1}</button>
                    </div>
                    <div style={{ background: '#050508', border: `1px solid ${accent}44`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: accent, boxShadow: `0 0 10px ${accent}` }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: accent }}><Video size={20}/><h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{t[currentLang]?.vLevel2}</h3></div>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.5', fontWeight: '500' }}>{t[currentLang]?.vLevel2Desc}</p>
                        <button onClick={() => { setShowVerifyPromo(false); setShowSupport(true); handleSupportSend("Хочу пройти Повну верифікацію по відео."); }} style={{ alignSelf: 'flex-start', padding: '10px 20px', background: accent, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 0 15px ${accent}66`, fontFamily: 'inherit', borderRadius: '8px' }} className="menu-hover">{t[currentLang]?.verifyAction2}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyPromoModal;