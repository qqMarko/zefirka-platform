import React from 'react';
import { X, ShieldCheck, Camera, Video, Check } from 'lucide-react';
import { C, R, overlay, modalBox, closeBtn, section, btnPrimary, btnGhost } from '../styles/ds';

const VerifyPromoModal = ({ setShowVerifyPromo, setShowSupport, handleSupportSend, t, currentLang, accent }) => {
    const sendBasic  = () => { setShowVerifyPromo(false); setShowSupport(true); handleSupportSend('Хочу пройти Базову верифікацію по фото.'); };
    const sendPremium = () => { setShowVerifyPromo(false); setShowSupport(true); handleSupportSend('Хочу пройти Повну верифікацію по відео.'); };

    return (
        <div style={{ ...overlay, zIndex: 9000 }}>
            <div className="modal-pop" style={modalBox('520px', { padding: '28px' })}>

                <button onClick={() => setShowVerifyPromo(false)} style={closeBtn}><X size={16} /></button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: R.sm, background: `${C.accent}18`, border: `1px solid ${C.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShieldCheck size={20} color={C.accent} />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: C.accent }}>{t[currentLang]?.verifyTitle || 'Отримайте галочку верифікації'}</div>
                </div>
                <p style={{ color: C.textSub, lineHeight: '1.65', fontSize: '14px', marginBottom: '24px' }}>{t[currentLang]?.verifyText1}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Basic */}
                    <div style={{ ...section(), display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <Camera size={17} color={C.success} />
                            <span style={{ fontWeight: '800', fontSize: '15px', color: C.success }}>{t[currentLang]?.vLevel1 || 'Базова верифікація (Фото)'}</span>
                        </div>
                        <p style={{ margin: 0, color: C.textSub, fontSize: '13.5px', lineHeight: '1.6' }}>{t[currentLang]?.vLevel1Desc}</p>
                        <button onClick={sendBasic} style={{ ...btnGhost({ borderColor: 'rgba(76,175,80,0.4)', color: C.success }), alignSelf: 'flex-start', padding: '9px 18px', fontSize: '13px' }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(76,175,80,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >
                            <Check size={14} /> {t[currentLang]?.verifyAction1 || 'Пройти Базову Верифікацію'}
                        </button>
                    </div>

                    {/* Premium */}
                    <div style={{ ...section(), display: 'flex', flexDirection: 'column', gap: '12px', borderColor: `${C.accent}44`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: `linear-gradient(180deg, ${C.accent}, ${C.accent}88)` }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <Video size={17} color={C.accent} />
                            <span style={{ fontWeight: '800', fontSize: '15px', color: C.accent }}>{t[currentLang]?.vLevel2 || 'Premium верифікація (Відео)'}</span>
                        </div>
                        <p style={{ margin: 0, color: C.textSub, fontSize: '13.5px', lineHeight: '1.6' }}>{t[currentLang]?.vLevel2Desc}</p>
                        <button onClick={sendPremium} style={{ ...btnPrimary(), alignSelf: 'flex-start', padding: '9px 18px', fontSize: '13px' }}>
                            <Video size={14} /> {t[currentLang]?.verifyAction2 || 'Пройти Відео Верифікацію'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VerifyPromoModal;