import React from 'react';
import { ShieldCheck, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ContactSelectionModal = ({ 
    contactSelectionModel, setContactSelectionModel, setSelectedModel, 
    isLoggedIn, openPrivateChat, setShowAuth, t, currentLang, accent 
}) => {
    if (!contactSelectionModel) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setContactSelectionModel(null)}>
            <div style={{ background: '#0a0a0f', padding: '30px', borderRadius: '20px', border: `1px solid ${accent}`, width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()} className="fade-in-up">
                <h3 style={{color: 'white', marginTop: 0, marginBottom: '20px'}}>{t[currentLang]?.chooseChatMethod}</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                    <button onClick={() => { setContactSelectionModel(null); setSelectedModel(null); isLoggedIn ? openPrivateChat(contactSelectionModel) : setShowAuth(true); }} style={{ padding: '18px', background: '#111', border: `1px solid ${accent}`, borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.3s' }} className="menu-hover">
                        <ShieldCheck size={28} color={accent}/> <span style={{fontSize: '13px'}}>{t[currentLang]?.chatWith}<br/><span style={{fontSize: '10px', color: '#888'}}>{t[currentLang]?.chatSafe}</span></span>
                    </button>
                    <button onClick={() => { toast(`Перехід у ${contactSelectionModel.contactType || "Месенджер"}`, { icon: '✈️', style: { background: '#111', color: '#fff', border: '1px solid #4caf50' } }); setContactSelectionModel(null); setSelectedModel(null); }} style={{ padding: '18px', background: '#111', border: `1px solid #4caf50`, borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.3s' }} className="menu-hover">
                        <Send size={28} color="#4caf50"/> <span style={{fontSize: '13px'}}>{contactSelectionModel.contactType || "Месенджер"}<br/><span style={{fontSize: '10px', color: '#888'}}>{t[currentLang]?.messengerGo}</span></span>
                    </button>
                </div>
                <button onClick={() => setContactSelectionModel(null)} style={{marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer'}}>{t[currentLang]?.close}</button>
            </div>
        </div>
    );
};

export default ContactSelectionModal;