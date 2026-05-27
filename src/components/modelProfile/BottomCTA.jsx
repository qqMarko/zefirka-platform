import React from 'react';
import { ShieldCheck, Sparkles, Send } from 'lucide-react';
import { C, R, section } from '../../styles/ds';

const BottomCTA = ({
    isOwner, showContacts, setShowContacts,
    availableSocials, contactNetworks,
    handleInternalChatClick, handleSocialClick, accent
}) => (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px 24px', background: 'linear-gradient(0deg, #09090b 80%, rgba(9,9,11,0) 100%)', zIndex: 100 }}>
        {isOwner ? (
            <div style={{ ...section(), padding: '16px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: C.textSub, fontSize: '14px', fontWeight: '700' }}>
                <ShieldCheck size={20} color="#71717a" /> ЦЕ ВАША АНКЕТА
            </div>
        ) : !showContacts ? (
            <button onClick={() => setShowContacts(true)} style={{ width: '100%', padding: '18px', background: accent, border: 'none', borderRadius: '16px', color: '#000', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: `0 10px 30px ${accent}66` }} className="hover-scale">
                <Sparkles size={20} /> ІНІЦІЮВАТИ СПІЛКУВАННЯ
            </button>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: availableSocials.length === 0 ? '1fr' : '1fr 1fr', gap: '12px', animation: 'fadeInUp 0.3s ease' }}>
                <button onClick={handleInternalChatClick} style={{ padding: '14px', background: C.surface2, border: `1px solid ${accent}44`, borderRadius: R.sm, color: C.text, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontFamily: 'inherit', transition: 'border-color 0.18s' }}>
                    <ShieldCheck size={24} color={accent} />
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>Внутрішній Чат</div>
                </button>
                {availableSocials.length > 0 ? (
                    availableSocials.map(network => {
                        const netData = contactNetworks.find(n => n.id === network) || contactNetworks[0];
                        return (
                            <button key={network} onClick={() => handleSocialClick(network)} style={{ padding: '14px', background: '#141417', border: `1px solid ${netData.color}`, borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' }} className="hover-scale">
                                <Send size={24} color={netData.color} />
                                <div style={{ fontSize: '13px', fontWeight: '700' }}>{network}</div>
                            </button>
                        );
                    })
                ) : (
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px dashed #3f3f46', borderRadius: '14px', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
                        Соцмережі не вказані
                    </div>
                )}
            </div>
        )}
    </div>
);

export default BottomCTA;