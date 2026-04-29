import React from 'react';
import { Trash2, Rocket } from 'lucide-react';

const ConfirmActionModal = ({ confirmModal, setConfirmModal, executeBump, executeFreeBump, executeDelete, accent }) => {
    if (!confirmModal.isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setConfirmModal({isOpen: false})}>
            <div className="fade-in-up modal-pop" style={{ width: '100%', maxWidth: '400px', background: '#0a0a0f', border: `1px solid ${confirmModal.type === 'delete' ? '#ff4444' : accent}`, borderRadius: '24px', padding: '30px', textAlign: 'center', boxShadow: `0 20px 60px rgba(0,0,0,0.9)` }} onClick={e => e.stopPropagation()}>
                
                <div style={{ background: confirmModal.type === 'delete' ? 'rgba(255,68,68,0.1)' : `${accent}22`, width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `2px solid ${confirmModal.type === 'delete' ? '#ff4444' : accent}` }}>
                    {confirmModal.type === 'delete' ? <Trash2 size={40} color="#ff4444"/> : <Rocket size={40} color={accent}/>}
                </div>
                
                <h2 style={{color: 'white', margin: '0 0 10px 0', fontSize: '22px', fontWeight: 'bold'}}>{confirmModal.title}</h2>
                <p style={{color: '#888', marginBottom: '30px', fontSize: '14px', lineHeight: '1.5'}}>{confirmModal.text}</p>
                
                <div style={{display: 'flex', gap: '15px'}}>
                    <button onClick={() => setConfirmModal({isOpen: false})} style={{flex: 1, padding: '15px', background: 'transparent', border: '1px solid #444', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'}} className="menu-hover">
                        Ні, скасувати
                    </button>
                    <button 
                        onClick={() => {
                            if(confirmModal.type === 'bump') executeBump(confirmModal.modelId);
                            if(confirmModal.type === 'free_bump') executeFreeBump(confirmModal.modelId);
                            if(confirmModal.type === 'delete') executeDelete(confirmModal.modelId);
                        }} 
                        style={{flex: 1, padding: '15px', background: confirmModal.type === 'delete' ? '#ff4444' : accent, border: 'none', color: confirmModal.type === 'delete' ? 'white' : '#000', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: confirmModal.type === 'delete' ? '0 5px 20px rgba(255,68,68,0.3)' : `0 5px 20px ${accent}44`}} 
                        className="menu-hover"
                    >
                        {confirmModal.type === 'delete' ? <><Trash2 size={16}/> Так, видалити</> : <><Rocket size={16}/> Так, підняти</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmActionModal;