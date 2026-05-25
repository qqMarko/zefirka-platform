import React from 'react';
import { ArrowLeft, User, MoreVertical, Bell, BellOff, Eraser, Trash2 } from 'lucide-react';

const ChatHeader = ({ activeChat, activeChatId, userUniqueId, onlineUsers, accent, t, currentLang, setActiveChatId, setSelectedModel, setCurrentPage, showMenu, setShowMenu, getPartnerInfo, handleToggleMute, handleClearHistory, handleDeleteChat }) => {
    
    const pInfo = getPartnerInfo(activeChat);

    const getPartnerStatus = () => {
        if (!activeChat) return null;
        const statusData = onlineUsers[activeChat.partnerId];
        if (statusData?.status === 'online') return <div style={{ fontSize: '11px', color: '#4caf50', fontWeight: 'bold' }}>• Онлайн</div>;
        if (statusData?.lastSeen) {
            const timeString = new Date(statusData.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return <div style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>Був(-ла) о {timeString}</div>;
        }
        return <div style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>Офлайн</div>;
    };

    return (
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div onClick={() => setActiveChatId(null)} className="mobile-back-btn" style={{ cursor: 'pointer', padding: '5px', marginRight: '10px' }}><ArrowLeft size={24} color="#888" /></div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', cursor: !pInfo.isClient ? 'pointer' : 'default', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => { if(!pInfo.isClient) setSelectedModel(activeChat.model); }}>
                    {pInfo.avatar ? <img src={pInfo.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar"/> : <User size={20} color="#888" />}
                </div>
                <div style={{ cursor: !pInfo.isClient ? 'pointer' : 'default' }} onClick={() => { if(!pInfo.isClient) setSelectedModel(activeChat.model); }}>
                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>{pInfo.name}</div>
                    {getPartnerStatus()}
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!pInfo.isClient && (
                    <div onClick={() => setSelectedModel(activeChat.model)} style={{ color: accent, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }} className="menu-hover hide-mobile-text">
                        {t[currentLang]?.viewProfile || 'Профіль'}
                    </div>
                )}
                
                <div style={{ position: 'relative' }}>
                    <div onClick={() => setShowMenu(!showMenu)} style={{ padding: '5px', cursor: 'pointer', color: '#888', transition: '0.2s' }} className="menu-hover">
                        <MoreVertical size={24} />
                    </div>
                    
                    {showMenu && (
                        <>
                            <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'transparent' }} />
                            <div className="fade-in-up" style={{ position: 'absolute', top: '100%', right: '0', marginTop: '10px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 100, minWidth: '220px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                                <div onClick={handleToggleMute} style={{ padding: '12px 15px', color: '#ccc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }} className="dropdown-item-hover">
                                    {Array.isArray(activeChat?.mutedBy) && activeChat.mutedBy.includes(userUniqueId) ? <><Bell size={16} color={accent}/> Увімкнути звук</> : <><BellOff size={16} color="#888"/> Вимкнути сповіщення</>}
                                </div>
                                <div onClick={handleClearHistory} style={{ padding: '12px 15px', color: '#ccc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }} className="dropdown-item-hover">
                                    <Eraser size={16} color="#ffc107" /> Очистити історію
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }}></div>
                                <div onClick={handleDeleteChat} style={{ padding: '12px 15px', color: '#ff4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }} className="dropdown-item-hover-red">
                                    <Trash2 size={16} /> Видалити переписку
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;