import React from 'react';
import { Mic } from 'lucide-react';

const MicPermissionModal = ({ showMicModal, setShowMicModal, startRecording, accent }) => {
    if (!showMicModal) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="fade-in-up" style={{ background: '#0a0a0f', border: `1px solid ${accent}44`, borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${accent}22` }}>
                <div style={{ background: `${accent}22`, width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Mic size={35} color={accent} />
                </div>
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '20px', fontWeight: '900' }}>Доступ до мікрофона</h3>
                <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
                    Щоб відправляти голосові повідомлення, нам потрібен доступ до мікрофона. <br/><br/>
                    <b style={{color: 'white'}}>Натисніть "Дозволити" у системному вікні браузера після закриття цього повідомлення.</b>
                </p>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowMicModal(false)} style={{ flex: 1, padding: '14px', background: '#222', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }} className="menu-hover">
                        Скасувати
                    </button>
                    <button 
                        onClick={() => { setShowMicModal(false); startRecording(); }} 
                        style={{ flex: 1, padding: '14px', background: accent, color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: `0 5px 15px ${accent}44` }} 
                        className="menu-hover"
                    >
                        Зрозуміло
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MicPermissionModal;