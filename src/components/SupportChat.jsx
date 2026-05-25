import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, Send, MessageSquare, AlertTriangle } from 'lucide-react';

// Шаблони для швидких відповідей (більш корисні для клієнтів)
const quickReplies = [
    { icon: "🚨", text: "Меня обманули / шахрайство", short: "Шахрайство" },
    { icon: "💳", text: "Проблема з оплатою або поповненням", short: "Оплата" },
    { icon: "🔒", text: "Мій акаунт заблоковано — чому?", short: "Блокування" },
    { icon: "👤", text: "Хочу верифікувати профіль", short: "Верифікація" },
    { icon: "⭐", text: "Як отримати VIP статус?", short: "VIP / Premium" },
    { icon: "📸", text: "AI заблокував моє фото", short: "Фото заблоковано" },
    { icon: "💬", text: "Проблема з повідомленнями / чатом", short: "Чат / Повідомлення" },
    { icon: "❓", text: "Загальне питання до підтримки", short: "Інше питання" },
];

const SupportChat = ({
    setShowSupport, supportMessages, supportInput, setSupportInput,
    supportAttachedImg, setSupportAttachedImg, supportFileRef,
    handleSupportAttach, handleSupportSend, t, currentLang, accent
}) => {
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const targetScroll = useRef(0);
    const isScrolling = useRef(false);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const updateScroll = () => {
            if (!container) { isScrolling.current = false; return; }
            const currentScroll = container.scrollTop;
            const diff = targetScroll.current - currentScroll;
            const easing = 0.06; 
            if (Math.abs(diff) > 0.5) {
                container.scrollTop = currentScroll + diff * easing;
                requestAnimationFrame(updateScroll);
            } else {
                container.scrollTop = targetScroll.current;
                isScrolling.current = false;
            }
        };
        const handleWheel = (e) => {
            e.preventDefault(); e.stopPropagation(); 
            const maxScroll = container.scrollHeight - container.clientHeight;
            const scrollStep = e.deltaY * 0.3; 
            targetScroll.current = Math.max(0, Math.min(maxScroll, targetScroll.current + scrollStep));
            if (!isScrolling.current) { isScrolling.current = true; requestAnimationFrame(updateScroll); }
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const handleNativeScroll = (e) => { if (!isScrolling.current) targetScroll.current = e.target.scrollTop; };

    useEffect(() => {
        if (messagesEndRef.current && scrollContainerRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => { if (scrollContainerRef.current) targetScroll.current = scrollContainerRef.current.scrollTop; }, 400);
        }
    }, [supportMessages]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => setShowSupport(false), 300);
    };

    return (
        <>
            <style>
                {`
                    @keyframes chatPopOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.95) translateY(20px); } }
                    .chat-closing { animation: chatPopOut 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards !important; }
                `}
            </style>

            <div className={`modal-pop ${isClosing ? 'chat-closing' : ''}`} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '360px', height: '600px', background: 'linear-gradient(180deg, rgba(15,15,20,0.95) 0%, rgba(5,5,8,0.98) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid rgba(255,255,255,0.08)`, zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${accent}22`, borderRadius: '24px', overflow: 'hidden' }}>
                
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}44, ${accent}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}66`, color: accent, boxShadow: `0 0 10px ${accent}44` }}><MessageSquare size={18} fill={`${accent}44`} /></div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>{t[currentLang]?.supportAgent || 'Support'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4caf50', fontWeight: '600' }}><span style={{ width: '6px', height: '6px', background: '#4caf50', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #4caf50' }}></span>{t[currentLang]?.supportOnline || 'Online'}</div>
                        </div>
                    </div>
                    <div onClick={handleClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }} className="menu-hover"><X size={18} color="#aaa" /></div>
                </div>

                {/* 🚀 ПОПЕРЕДЖЕННЯ ПРО АРБІТРАЖ */}
                <div style={{ background: 'rgba(255, 152, 0, 0.1)', borderBottom: '1px solid rgba(255, 152, 0, 0.2)', padding: '10px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertTriangle size={16} color="#ff9800" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>
                        Розгляд скарг через чат Турботи може зайняти час. Для <b>миттєвого блокування шахраїв</b> використовуйте розділ <b style={{color: '#ff9800'}}>Арбітраж</b> (Доступно з VIP статусом).
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative', background: 'transparent' }}>
                    <div ref={scrollContainerRef} onScroll={handleNativeScroll} className="custom-scrollbar" data-lenis-prevent="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div style={{ alignSelf: 'flex-start', background: '#15151a', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', maxWidth: '85%', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontWeight: '500', color: '#e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                            {t[currentLang]?.agentGreeting || 'Вітаю! Чим можу допомогти?'}
                            <div style={{ fontSize: '10px', color: '#666', marginTop: '6px', textAlign: 'right', fontWeight: '600' }}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>

                        {supportMessages.map(msg => {
                            const isUser = msg.sender === 'user';
                            return (
                                <div key={msg.id} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', background: isUser ? `linear-gradient(135deg, ${accent}, ${accent}dd)` : '#15151a', border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', maxWidth: '85%', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontWeight: '500', boxShadow: isUser ? `0 4px 15px ${accent}44` : '0 4px 15px rgba(0,0,0,0.2)' }}>
                                    {msg.img && <img src={msg.img} style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.1)' }} alt="attached" />}
                                    {msg.text}
                                    <div style={{ fontSize: '10px', color: isUser ? 'rgba(255,255,255,0.7)' : '#666', marginTop: '6px', textAlign: 'right', fontWeight: '600' }}>{msg.time}</div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* 🚀 ШВИДКІ ВІДПОВІДІ — горизонтальний скрол + колесо миші */}
                {!supportInput && !supportAttachedImg && (
                    <div 
                        style={{ padding: '8px 14px', marginBottom: '4px', position: 'relative' }}
                        onWheel={e => {
                            const el = e.currentTarget.querySelector('.quick-scroll-inner');
                            if (el) { e.preventDefault(); el.scrollLeft += e.deltaY * 1.2; }
                        }}
                    >
                        <div style={{ fontSize: '10px', color: '#555', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '7px', paddingLeft: '2px' }}>Швидкі теми</div>
                        <div 
                            className="quick-scroll-inner custom-scrollbar"
                            style={{ display: 'flex', gap: '7px', overflowX: 'auto', paddingBottom: '4px', scrollBehavior: 'smooth' }}
                        >
                            {quickReplies.map((reply, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSupportInput(reply.text)}
                                    style={{ 
                                        background: 'rgba(255,255,255,0.04)', 
                                        border: '1px solid rgba(255,255,255,0.09)', 
                                        color: '#bbb', padding: '7px 12px', borderRadius: '20px', 
                                        fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', 
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                                        flexShrink: 0, fontFamily: 'inherit', fontWeight: '600',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; e.currentTarget.style.color='#bbb'; }}
                                >
                                    <span style={{ fontSize: '14px' }}>{reply.icon}</span>
                                    <span>{reply.short}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {supportAttachedImg && (
                    <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f', flexShrink: 0 }}>
                        <div style={{ width: '50px', height: '50px', border: `2px solid ${accent}`, position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={supportAttachedImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                            <div onClick={() => setSupportAttachedImg(null)} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottomLeftRadius: '8px' }}><X size={12} color="white"/></div>
                        </div>
                    </div>
                )}

                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                    <div onClick={() => supportFileRef.current.click()} style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }} className="menu-hover"><Camera size={20} color="#aaa" /></div>
                    <input type="file" ref={supportFileRef} hidden accept="image/*" onChange={handleSupportAttach} />
                    <input value={supportInput} onChange={e => setSupportInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSupportSend()} placeholder={t[currentLang]?.supportPlaceholder || 'Повідомлення...'} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 18px', color: 'white', borderRadius: '24px', outline: 'none', fontSize: '13px', fontFamily: 'inherit', fontWeight: '500', transition: 'border-color 0.3s' }} onFocus={(e) => e.target.style.borderColor = accent} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                    <div onClick={() => { if(supportInput.trim() || supportAttachedImg) handleSupportSend() }} style={{ width: '42px', height: '42px', borderRadius: '50%', background: (supportInput.trim() || supportAttachedImg) ? accent : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (supportInput.trim() || supportAttachedImg) ? 'pointer' : 'default', transition: '0.3s', boxShadow: (supportInput.trim() || supportAttachedImg) ? `0 0 15px ${accent}66` : 'none' }} className={(supportInput.trim() || supportAttachedImg) ? "menu-hover hover-scale" : ""}><Send size={18} color={(supportInput.trim() || supportAttachedImg) ? 'white' : '#666'} style={{ marginLeft: '-2px' }} /></div>
                </div>
            </div>
        </>
    );
};

export default SupportChat;