import React from 'react';
import { ShieldCheck, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { C, R, overlay, modalBox, closeBtn } from '../styles/ds';

const ContactSelectionModal = ({ contactSelectionModel, setContactSelectionModel, setSelectedModel, isLoggedIn, openPrivateChat, setShowAuth, t, currentLang, accent }) => {
    if (!contactSelectionModel) return null;

    const close = () => setContactSelectionModel(null);

    return (
        <div style={{ ...overlay, zIndex: 8000 }} onClick={close}>
            <div className="fade-in-up modal-pop" style={modalBox('360px', { padding: '28px' })} onClick={e => e.stopPropagation()}>

                <button onClick={close} style={closeBtn}><X size={16} /></button>

                <div style={{ fontSize: '18px', fontWeight: '900', color: C.text, marginBottom: '20px', paddingRight: '32px' }}>
                    {t[currentLang]?.chooseChatMethod || 'Спосіб зв\'язку'}
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <button
                        onClick={() => { close(); setSelectedModel(null); isLoggedIn ? openPrivateChat(contactSelectionModel) : setShowAuth(true); }}
                        style={{ padding: '16px', background: `${C.accent}12`, border: `1px solid ${C.accent}44`, borderRadius: R.md, color: C.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.18s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${C.accent}22`}
                        onMouseLeave={e => e.currentTarget.style.background = `${C.accent}12`}
                    >
                        <ShieldCheck size={22} color={C.accent} />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{t[currentLang]?.chatWith || 'Zefirka чат'}</div>
                            <div style={{ fontSize: '12px', color: C.textSub, marginTop: '2px' }}>{t[currentLang]?.chatSafe || 'Анонімно та безпечно'}</div>
                        </div>
                    </button>

                    <button
                        onClick={() => { toast(`Перехід у ${contactSelectionModel.contactType || 'Месенджер'}`, { icon: '✈️' }); close(); setSelectedModel(null); }}
                        style={{ padding: '16px', background: 'rgba(76,175,80,0.10)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: R.md, color: C.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.18s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,175,80,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(76,175,80,0.10)'}
                    >
                        <Send size={22} color="#4caf50" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{contactSelectionModel.contactType || 'Месенджер'}</div>
                            <div style={{ fontSize: '12px', color: C.textSub, marginTop: '2px' }}>{t[currentLang]?.messengerGo || 'Перейти в месенджер'}</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactSelectionModal;