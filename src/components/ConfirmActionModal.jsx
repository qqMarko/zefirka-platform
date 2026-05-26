import React from 'react';
import { Trash2, Rocket } from 'lucide-react';
import { C, R, shadow, overlay, modalBox, btnPrimary, btnGhost, btnDanger } from '../styles/ds';

const ConfirmActionModal = ({ confirmModal, setConfirmModal, executeBump, executeFreeBump, executeDelete, accent }) => {
    if (!confirmModal.isOpen) return null;
    const isDel = confirmModal.type === 'delete';
    const color = isDel ? C.danger : C.accent;

    return (
        <div style={{ ...overlay, zIndex: 9999 }} onClick={() => setConfirmModal({ isOpen: false })}>
            <div className="fade-in-up modal-pop" style={modalBox('380px', { padding: '32px', textAlign: 'center', border: `1px solid ${color}44` })} onClick={e => e.stopPropagation()}>

                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    {isDel ? <Trash2 size={28} color={color} /> : <Rocket size={28} color={color} />}
                </div>

                <div style={{ fontSize: '20px', fontWeight: '900', color: C.text, marginBottom: '8px' }}>{confirmModal.title}</div>
                <div style={{ color: C.textSub, fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>{confirmModal.text}</div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setConfirmModal({ isOpen: false })} style={{ ...btnGhost(), flex: 1 }}>Скасувати</button>
                    <button
                        onClick={() => {
                            if (confirmModal.type === 'bump') executeBump(confirmModal.modelId);
                            if (confirmModal.type === 'free_bump') executeFreeBump(confirmModal.modelId);
                            if (confirmModal.type === 'delete') executeDelete(confirmModal.modelId);
                        }}
                        style={{ ...(isDel ? btnDanger() : btnPrimary()), flex: 1 }}
                    >
                        {isDel ? <><Trash2 size={15} /> Видалити</> : <><Rocket size={15} /> Підняти</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmActionModal;