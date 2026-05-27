import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { C, R, btnPrimary, btnGhost } from '../../styles/ds';

/** Попередження при переході в зовнішню соцмережу */
const SocialWarningModal = ({ open, selectedSocial, onClose, onGoToInternal, onConfirmRedirect }) => {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="fade-in-up" style={{ background: C.surface, borderRadius: R.xl, border: `1px solid ${C.border}`, padding: '28px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.9)', width: '90%', maxWidth: '400px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: R.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <AlertTriangle size={30} color="#ef4444" />
                </div>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '15px' }}>ПОПЕРЕДЖЕННЯ</h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                    Переходячи в <b>{selectedSocial}</b>, ви залишаєте безпечну зону нашої платформи.<br /><br />
                    <b style={{ color: '#ef4444' }}>Ми не несемо відповідальності</b> за будь-які фінансові операції або домовленості поза цим сайтом.<br /><br />
                    <b style={{ color: '#10b981' }}>Рекомендуємо:</b> для вашої безпеки ведіть листування у нашому <b>Внутрішньому Чаті</b>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={onGoToInternal} style={{ ...btnPrimary(), width: '100%', padding: '13px' }}>
                        НАПИСАТИ В ЧАТІ САЙТУ
                    </button>
                    <button onClick={onConfirmRedirect} style={{ ...btnGhost(), width: '100%', padding: '13px' }}>
                        ВСЕ ОДНО ПЕРЕЙТИ В {selectedSocial}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocialWarningModal;