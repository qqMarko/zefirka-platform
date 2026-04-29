import React, { useRef } from 'react';
import { User, BellOff } from 'lucide-react';
import useSmoothScroll from '../../hooks/useSmoothScroll';

const ChatSidebar = ({ myChats, activeChatId, setActiveChatId, onlineUsers, userUniqueId, accent, t, currentLang, isMobile, isMobileChatOpen, getPartnerInfo }) => {
    const dialogsScrollRef = useRef(null);
    useSmoothScroll(dialogsScrollRef);

    return (
        <div className={`messages-sidebar ${isMobileChatOpen ? 'hide-on-mobile' : ''}`} style={{ width: isMobile ? '100%' : '350px', borderRight: '1px solid rgba(255,255,255,0.05)', background: '#050508', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {myChats.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontSize: '13px', fontWeight: '500' }}>
                    {t[currentLang]?.noDialogs || 'У вас поки немає діалогів.'}
                </div>
            )}
            <div 
                ref={dialogsScrollRef}
                className="custom-scrollbar" 
                tabIndex={-1} 
                onMouseEnter={(e) => e.currentTarget.focus()}
                style={{ display: myChats.length === 0 ? 'none' : 'block', overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain', outline: 'none', WebkitOverflowScrolling: 'touch' }}
                data-lenis-prevent="true" // 🚀 ЗБЕРІГАЄМО ПРАВИЛЬНИЙ СКРОЛ
            >
                {myChats.map(chat => {
                    const isOnline = onlineUsers[chat.partnerId]?.status === 'online';
                    const isMuted = Array.isArray(chat.mutedBy) && chat.mutedBy.includes(userUniqueId);
                    const pInfo = getPartnerInfo(chat); 
                    
                    return (
                        <div key={chat.id} onClick={() => setActiveChatId(chat.id)} style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: activeChatId === chat.id ? '#111' : 'transparent', display: 'flex', gap: '15px', alignItems: 'center', transition: '0.2s' }} className="menu-hover">
                            <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', background: '#222', border: activeChatId === chat.id ? `2px solid ${accent}` : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {pInfo.avatar ? <img src={pInfo.avatar} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius: '50%'}} alt="avatar"/> : <User size={24} color="#888" />}
                                {isOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#4caf50', borderRadius: '50%', border: '2px solid #050508' }}></div>}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>{pInfo.name}</span>{isMuted && <BellOff size={12} color="#888" />}</div>
                                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '500', flexShrink: 0 }}>{chat.messages[chat.messages.length - 1]?.time}</span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                                    {chat.messages[chat.messages.length - 1]?.type === 'image' ? '📷 Фото' : 
                                        chat.messages[chat.messages.length - 1]?.type === 'video' ? '🎥 Відео' : 
                                        chat.messages[chat.messages.length - 1]?.type === 'audio' ? '🎤 Голосове' : 
                                        chat.messages[chat.messages.length - 1]?.text || 'Немає повідомлень'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatSidebar;