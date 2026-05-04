import React from 'react';
import { ShieldAlert, Minus, Gavel } from 'lucide-react';
import DisputesTab from './DisputesTab';

const ActiveDisputeOverlay = ({
    activeDisputeForMe,
    isDisputeMinimized,
    toggleDisputeMinimize,
    userUniqueId,
    userRole
}) => {
    if (!activeDisputeForMe) return null;

    return (
        <>
            {!isDisputeMinimized && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <div style={{ width: '100%', maxWidth: '950px', height: '90vh', maxHeight: '800px', background: '#050508', borderRadius: '24px', border: '1px solid #ff4444', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,1)' }} className="fade-in-up">
                        <div style={{ padding: '12px 25px', background: 'rgba(255,68,68,0.1)', borderBottom: '1px solid rgba(255,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <ShieldAlert color="#ff4444" size={22} />
                                 <span style={{ color: '#ff4444', fontWeight: '900', fontSize: '16px', textTransform: 'uppercase' }}>УВАГА: ВІДКРИТИЙ СПІР</span>
                            </div>
                            <button onClick={() => toggleDisputeMinimize(true)} style={{ background: '#222', border: 'none', color: 'white', cursor: 'pointer', padding: '8px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold' }} className="menu-hover">
                                <Minus size={18} style={{ marginRight: '5px' }} /> Згорнути
                            </button>
                        </div>
                        {/* Прибрано padding, щоб DisputesTab зайняв 100% простору */}
                        <div style={{ flex: 1, padding: '0', overflow: 'hidden', display: 'flex' }}>
                            <DisputesTab userUniqueId={userUniqueId} userRole={userRole} hasDisputeAccess={true} forcedDispute={activeDisputeForMe} />
                        </div>
                    </div>
                </div>
            )}
            {isDisputeMinimized && (
                <div onClick={() => toggleDisputeMinimize(false)} style={{ position: 'fixed', bottom: '25px', left: '25px', zIndex: 9999, background: '#050508', border: '2px solid #ff4444', color: 'white', padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 5px 25px rgba(255,68,68,0.4)', animation: 'pulseAlert 2s infinite' }} className="menu-hover">
                    <Gavel size={22} color="#ff4444" />
                    <span style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Активний спір!</span>
                </div>
            )}
        </>
    );
};

export default ActiveDisputeOverlay;