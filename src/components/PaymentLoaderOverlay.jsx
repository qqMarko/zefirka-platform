import React from 'react';

const PaymentLoaderOverlay = ({ showPaymentLoader, t, currentLang, accent }) => {
    if (!showPaymentLoader) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '50px', height: '50px', border: `4px solid transparent`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
            <h2 style={{ color: 'white', letterSpacing: '2px', margin: '0 0 10px 0' }} className="fade-in-up">{t[currentLang]?.payProcessTitle}</h2>
            <p style={{ color: '#888', fontSize: '13px' }} className="fade-in-up">{t[currentLang]?.payProcessDesc}</p>
        </div>
    );
};

export default PaymentLoaderOverlay;