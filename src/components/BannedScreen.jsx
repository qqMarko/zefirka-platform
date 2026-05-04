import React from 'react';
import { ShieldAlert } from 'lucide-react';

const BannedScreen = ({ t, currentLang }) => {
    const tapeString = Array(20).fill(t[currentLang]?.tapeText || "ACCESS DENIED ").join("");
    const tapeStyle = { position: 'absolute', background: '#ffcc00', color: '#000', fontWeight: '900', fontSize: '24px', letterSpacing: '4px', padding: '12px 0', width: '200vw', textAlign: 'center', textTransform: 'uppercase', boxShadow: '0 10px 30px rgba(0,0,0,0.9)', zIndex: 10, whiteSpace: 'nowrap', display: 'flex', pointerEvents: 'none' };

    return (
        <div style={{ padding: 0, margin: 0, width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0000', border: '2px solid #ff4444', overflow: 'hidden'}}>
            <div style={{ ...tapeStyle, transform: 'rotate(15deg)' }}>{tapeString}</div>
            <div style={{ ...tapeStyle, transform: 'rotate(-15deg)' }}>{tapeString}</div>
            <div style={{ zIndex: 20, background: 'rgba(10,0,0,0.95)', padding: '50px', border: '2px solid #ff4444', borderRadius: '15px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                <ShieldAlert size={80} color="#ff4444" style={{marginBottom: '20px', margin: '0 auto'}}/>
                <h1 style={{color: '#ff4444', margin: '0 0 20px 0'}}>{t[currentLang]?.bannedTitle || "АКАУНТ ЗАБЛОКОВАНО"}</h1>
                <p style={{color: '#ccc', fontSize: '15px', maxWidth: '400px', margin: '0 auto'}}>{t[currentLang]?.bannedText || "Ваш доступ до платформи обмежено."}</p>
            </div>
        </div>
    );
};

export default BannedScreen;