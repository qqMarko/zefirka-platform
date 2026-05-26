import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Gavel, X, Clock, CheckCircle } from 'lucide-react';
import { socket } from '../../store/useStore';
import { toast } from 'react-hot-toast';
import AdminDropdown from './AdminDropdown';

const adminChatTemplates = [
    "👋 Вітаю! Я арбітр платформи. Надайте, будь ласка, докази.",
    "⏳ Очікуємо пояснень від іншої сторони спору.",
    "⚠️ Якщо доказів не буде протягом 10 хвилин, спір закриється.",
    "🛑 Спілкуйтесь без образ, інакше отримаєте штраф/бан."
];

const DisputeChat = ({ activeDispute, userUniqueId, userRole, setFullscreenImage, adminActions, setAdminActions, setShowVerdictModal, accent }) => {
    const [message, setMessage] = useState('');
    const [attachedImage, setAttachedImage] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!activeDispute || activeDispute.status === 'closed' || userRole === 'admin') { setTimeRemaining(0); return; }
        const calculateTimeLeft = () => {
            const msgs = activeDispute.messages;
            if (msgs.length === 0) return 0;
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.senderId === userUniqueId) {
                const storedTime = localStorage.getItem(`zefir_timer_${activeDispute._id}`);
                const msgTime = lastMsg.timestamp || storedTime;
                if (msgTime) {
                    const diff = Date.now() - parseInt(msgTime);
                    const timeLeft = (5 * 60 * 1000) - diff; 
                    return timeLeft > 0 ? timeLeft : 0;
                }
            }
            return 0;
        };
        const initialTimeLeft = calculateTimeLeft();
        setTimeRemaining(initialTimeLeft);
        if (initialTimeLeft === 0) localStorage.removeItem(`zefir_timer_${activeDispute._id}`);

        const interval = setInterval(() => {
            const currentLeft = calculateTimeLeft();
            setTimeRemaining(currentLeft);
            if (currentLeft === 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeDispute, userUniqueId, userRole]);

    useEffect(() => {
        if (activeDispute) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'instant' }), 100);
    }, [activeDispute]);

    const isInputDisabled = userRole !== 'admin' && timeRemaining > 0;

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('media', file);
        const toastId = toast.loading('Завантаження фото...');
        try {
            const token = localStorage.getItem('zefirka_token');
            const res = await fetch('/api/chat/upload', {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
            });
            const data = await res.json();
            if (data.success) {
                setAttachedImage(data.mediaUrl);
                toast.success('Фото прикріплено!', { id: toastId });
            } else toast.error('Помилка завантаження', { id: toastId });
        } catch (err) { toast.error('Помилка сервера', { id: toastId }); }
    };

    const sendMessage = () => {
        if ((!message.trim() && !attachedImage) || isInputDisabled) return;
        if (userRole !== 'admin') localStorage.setItem(`zefir_timer_${activeDispute._id}`, Date.now());

        socket.emit('send_dispute_message', {
            disputeId: activeDispute._id,
            senderId: userUniqueId,
            senderRole: userRole,
            text: message,
            image: attachedImage,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        setMessage(''); setAttachedImage(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '15px 25px', background: '#0a0a0f', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <h3 style={{ color: 'white', margin: 0 }}>Спір #{activeDispute._id.substring(0,6)}</h3>
                    <span style={{ fontSize: '11px', color: activeDispute.status === 'closed' ? '#4caf50' : accent, fontWeight: 'bold' }}>
                        {activeDispute.status === 'closed' ? '● ЗАКРИТО' : '● У ПРОЦЕСІ РОЗГЛЯДУ'}
                    </span>
                </div>

                {userRole === 'admin' && activeDispute.status !== 'closed' && (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <AdminDropdown role="initiator" title="Ініціатор" adminActions={adminActions} setAdminActions={setAdminActions} accent={accent} />
                        <AdminDropdown role="accused" title="Порушник" adminActions={adminActions} setAdminActions={setAdminActions} accent={accent} />
                        <div style={{ width: '1px', height: '24px', background: '#333', margin: '0 5px' }}></div>
                        <button onClick={() => setShowVerdictModal(true)} style={{ padding: '10px 20px', background: '#4caf50', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={18}/> ВИРОК
                        </button>
                    </div>
                )}
            </div>

            {/* 🚀 ВАЖЛИВО: Повернув data-lenis-prevent="true" та overscrollBehavior */}
            <div 
                data-lenis-prevent="true" 
                className="custom-scrollbar dispute-chat-container" 
                style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
                {activeDispute.status === 'closed' && (
                    <div style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', padding: '25px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4caf50', fontWeight: '900', fontSize: '18px', marginBottom: '10px' }}><Gavel size={24}/> РІШЕННЯ АРБІТРАЖУ</div>
                        <p style={{ color: '#fff', fontSize: '16px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>{activeDispute.verdict}</p>
                    </div>
                )}

                <div style={{ background: '#111', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${accent}` }}>
                    <div style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>ОРИГІНАЛЬНА СКАРГА:</div>
                    <p style={{ color: '#ccc', margin: 0 }}>{activeDispute.reason}</p>
                    {activeDispute.screenshots && activeDispute.screenshots.length > 0 && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto' }}>
                            {activeDispute.screenshots.map((img, i) => (
                                <img key={i} src={img} alt="Доказ" onClick={() => setFullscreenImage(img)} style={{ height: '80px', borderRadius: '8px', border: `1px solid ${accent}55`, objectFit: 'cover', cursor: 'zoom-in' }} />
                            ))}
                        </div>
                    )}
                </div>

                {activeDispute.messages.map((msg, i) => {
                    const isMe = msg.senderId === userUniqueId;
                    const isAdminMsg = msg.senderRole === 'admin';
                    return (
                        <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            {isAdminMsg && <div style={{ fontSize: '10px', color: '#4caf50', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '1px' }}>👮 АРБІТР</div>}
                            <div style={{ background: isAdminMsg ? 'rgba(76, 175, 80, 0.1)' : (isMe ? accent : '#16161a'), color: isAdminMsg ? '#4caf50' : (isMe ? '#000' : '#fff'), padding: '12px 18px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', border: isAdminMsg ? '1px solid #4caf50' : 'none' }}>
                                {msg.image && <img src={msg.image} onClick={() => setFullscreenImage(msg.image)} style={{ width: '100%', borderRadius: '10px', marginBottom: '10px', cursor: 'zoom-in' }}/>}
                                <div style={{ fontSize: '14px' }}>{msg.text}</div>
                            </div>
                            <div style={{ fontSize: '10px', color: '#555', marginTop: '5px' }}>{msg.time}</div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {activeDispute.status === 'open' && (
                <div style={{ padding: '20px', background: '#0a0a0f', borderTop: '1px solid #111', flexShrink: 0 }}>
                    {userRole === 'admin' && (
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }} className="custom-scrollbar">
                            {adminChatTemplates.map((tpl, idx) => (
                                <button key={idx} onClick={() => setMessage(tpl)} style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', color: '#4caf50', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    {tpl}
                                </button>
                            ))}
                        </div>
                    )}
                    {attachedImage && (
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                            <img src={attachedImage} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: `1px solid ${accent}` }} />
                            <button onClick={() => setAttachedImage(null)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}><X size={12}/></button>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} disabled={isInputDisabled} />
                        <button onClick={() => fileInputRef.current.click()} disabled={isInputDisabled} style={{ background: 'transparent', border: '1px solid #333', color: isInputDisabled ? '#333' : '#aaa', padding: '12px', borderRadius: '12px', cursor: isInputDisabled ? 'not-allowed' : 'pointer' }}>
                            <ImageIcon size={20}/>
                        </button>
                        <input type="text" value={message} disabled={isInputDisabled} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder={isInputDisabled ? `Очікуйте... ${Math.floor(timeRemaining/1000)}с` : "Ваш аргумент..."} style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #333', borderRadius: '12px', color: 'white', outline: 'none' }} />
                        <button onClick={sendMessage} disabled={isInputDisabled || (!message.trim() && !attachedImage)} style={{ padding: '0 25px', height: '100%', background: isInputDisabled ? '#333' : accent, border: 'none', borderRadius: '12px', color: isInputDisabled ? '#555' : '#000', fontWeight: 'bold', cursor: isInputDisabled ? 'not-allowed' : 'pointer' }}>
                            {isInputDisabled ? <Clock size={20}/> : <Send size={20}/>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisputeChat;