import React from 'react';
import { AlertCircle } from 'lucide-react';

const VerifyTimerModal = ({ showVerifyModal, verifyTimer, email, t, currentLang, accent }) => {
    if (!showVerifyModal) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="fade-in-up modal-pop" style={{ width: '400px', background: '#000', border: `1px solid ${accent}`, padding: '40px', textAlign: 'center', boxShadow: `0 0 50px ${accent}22`, borderRadius: '16px' }}>
                <AlertCircle size={40} color={accent} style={{marginBottom: '20px', margin: '0 auto'}}/>
                <h2 style={{letterSpacing: '2px', marginTop: '20px', fontWeight: '900'}}>{t[currentLang]?.confirm}</h2>
                <p style={{color: '#666', fontSize: '13px', margin: '20px 0'}}>{t[currentLang]?.sent} {email}</p>
                <div style={{fontSize: '11px', color: accent, fontWeight: '600'}}>{t[currentLang]?.loginIn}: {verifyTimer} {t[currentLang]?.sec}</div>
                <div style={{ height: '2px', background: accent, marginTop: '15px', width: '100%', animation: 'shrink 10s linear forwards' }}></div>
            </div>
        </div>
    );
};

export default VerifyTimerModal;