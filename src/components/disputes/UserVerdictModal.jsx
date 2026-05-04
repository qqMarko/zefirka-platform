import React from 'react';
import { Gavel, AlertTriangle } from 'lucide-react';

const UserVerdictModal = ({ verdictResultModal, setVerdictResultModal, accent }) => {
    if (!verdictResultModal) return null;
    const isPenalty = verdictResultModal.includes('САНКЦІЇ') || verdictResultModal.includes('заблоковано');

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} className="fade-in">
            <div style={{ background: 'linear-gradient(145deg, #13131a, #0a0a0f)', padding: '40px', borderRadius: '24px', border: isPenalty ? '2px solid #f44336' : `2px solid ${accent}`, width: '100%', maxWidth: '550px', textAlign: 'center', boxShadow: isPenalty ? '0 20px 80px rgba(244, 67, 54, 0.4)' : `0 20px 80px ${accent}66`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: isPenalty ? 'radial-gradient(circle, rgba(244,67,54,0.15) 0%, transparent 60%)' : `radial-gradient(circle, ${accent}33 0%, transparent 60%)`, zIndex: 0, pointerEvents: 'none' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: isPenalty ? 'rgba(244, 67, 54, 0.1)' : `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: isPenalty ? '2px solid #f44336' : `2px solid ${accent}`, boxShadow: isPenalty ? '0 0 30px rgba(244,67,54,0.5)' : `0 0 30px ${accent}88` }}>
                        {isPenalty ? <AlertTriangle size={40} color="#f44336" /> : <Gavel size={40} color={accent} />}
                    </div>
                    <h2 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '26px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '900' }}>
                        {isPenalty ? 'Увага! Санкції' : 'Офіційне Рішення'}
                    </h2>
                    <div style={{ color: '#eee', fontSize: '16px', lineHeight: '1.6', marginBottom: '30px', background: 'rgba(0,0,0,0.6)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap', textAlign: 'left', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)' }}>
                        {verdictResultModal}
                    </div>
                    <button onClick={() => setVerdictResultModal(null)} style={{ background: isPenalty ? '#f44336' : accent, color: isPenalty ? '#fff' : '#000', border: 'none', padding: '16px 30px', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: isPenalty ? '0 10px 20px rgba(244,67,54,0.3)' : `0 10px 20px ${accent}44` }} className="menu-hover">
                        Ознайомлений(а)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserVerdictModal;