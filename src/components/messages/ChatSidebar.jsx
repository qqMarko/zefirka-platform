import React, { useRef } from 'react';
import { User, BellOff } from 'lucide-react';
import useSmoothScroll from '../../hooks/useSmoothScroll';

// 👑 Конфіг VIP-пріоритетів для відображення в сайдбарі
const VIP_BADGE = {
    3: { label: '👑 CONCIERGE', color: '#ff007f', borderColor: 'rgba(255,0,127,0.45)', bgColor: 'rgba(255,0,127,0.08)' },
    2: { label: '⭐ PRIORITY',  color: '#ffc107', borderColor: 'rgba(255,193,7,0.45)',  bgColor: 'rgba(255,193,7,0.08)'  },
    1: { label: '✓ GUEST',      color: '#4caf50', borderColor: 'rgba(76,175,80,0.45)',  bgColor: 'rgba(76,175,80,0.08)'  },
};

const ChatSidebar = ({ myChats, activeChatId, setActiveChatId, onlineUsers, userUniqueId, accent, t, currentLang, isMobile, isMobileChatOpen, getPartnerInfo }) => {
    const dialogsScrollRef = useRef(null);
    useSmoothScroll(dialogsScrollRef);

    // 👑 Сортуємо чати: VIP-клієнти вище, серед рівних — за часом останнього повідомлення
    const sortedChats = [...myChats].sort((a, b) => {
        const pa = a.clientPriority || 0;
        const pb = b.clientPriority || 0;
        if (pb !== pa) return pb - pa; // вищий пріоритет — вище
        // однаковий пріоритет — новіший чат вище
        const aTime = a.messages[a.messages.length - 1]?.time || '';
        const bTime = b.messages[b.messages.length - 1]?.time || '';
        return bTime.localeCompare(aTime);
    });

    return (
        <div className={`messages-sidebar ${isMobileChatOpen ? 'hide-on-mobile' : ''}`} style={{ width: isMobile ? '100%' : '350px', borderRight: '1px solid rgba(255,255,255,0.05)', background: '#050508', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {sortedChats.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontSize: '13px', fontWeight: '500' }}>
                    {t[currentLang]?.noDialogs || 'У вас поки немає діалогів.'}
                </div>
            )}
            <div 
                ref={dialogsScrollRef}
                className="custom-scrollbar" 
                tabIndex={-1} 
                onMouseEnter={(e) => e.currentTarget.focus()}
                style={{ display: sortedChats.length === 0 ? 'none' : 'block', overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain', outline: 'none', WebkitOverflowScrolling: 'touch' }}
                data-lenis-prevent="true"
            >
                {sortedChats.map(chat => {
                    const isOnline = onlineUsers[chat.partnerId]?.status === 'online';
                    const isMuted = Array.isArray(chat.mutedBy) && chat.mutedBy.includes(userUniqueId);
                    const pInfo = getPartnerInfo(chat);
                    const vipLevel = chat.clientPriority || 0;
                    const vipBadge = VIP_BADGE[vipLevel];
                    const isActive = activeChatId === chat.id;

                    return (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChatId(chat.id)}
                            style={{
                                padding: '16px 20px',
                                borderBottom: vipBadge
                                    ? `1px solid ${vipBadge.borderColor}`
                                    : '1px solid rgba(255,255,255,0.03)',
                                cursor: 'pointer',
                                background: isActive
                                    ? (vipBadge ? vipBadge.bgColor : '#111')
                                    : (vipBadge ? `${vipBadge.bgColor}` : 'transparent'),
                                display: 'flex',
                                gap: '15px',
                                alignItems: 'center',
                                transition: '0.2s',
                                // 👑 Ліва кольорова смужка для VIP
                                borderLeft: vipBadge ? `3px solid ${vipBadge.color}` : '3px solid transparent',
                            }}
                            className="menu-hover"
                        >
                            {/* АВАТАР */}
                            <div style={{
                                position: 'relative',
                                width: '50px', height: '50px',
                                borderRadius: '50%',
                                background: '#222',
                                border: isActive
                                    ? `2px solid ${accent}`
                                    : vipBadge ? `2px solid ${vipBadge.color}` : '2px solid transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: vipBadge && !isActive ? `0 0 12px ${vipBadge.color}44` : 'none',
                            }}>
                                {pInfo.avatar
                                    ? <img src={pInfo.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="avatar" />
                                    : <User size={24} color={vipBadge ? vipBadge.color : '#888'} />
                                }
                                {isOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#4caf50', borderRadius: '50%', border: '2px solid #050508' }} />}
                            </div>

                            {/* ТЕКСТОВА ЧАСТИНА */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: vipBadge ? vipBadge.color : 'white',
                                            fontSize: '15px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {pInfo.name}
                                        </span>
                                        {isMuted && <BellOff size={12} color="#888" style={{ flexShrink: 0 }} />}
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '500', flexShrink: 0, marginLeft: '8px' }}>
                                        {chat.messages[chat.messages.length - 1]?.time}
                                    </span>
                                </div>

                                {/* 👑 VIP БЕЙДЖ під іменем */}
                                {vipBadge && (
                                    <div style={{
                                        display: 'inline-block',
                                        fontSize: '10px', fontWeight: '800',
                                        color: vipBadge.color,
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        {vipBadge.label}
                                    </div>
                                )}

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