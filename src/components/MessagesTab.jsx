import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ArrowLeft, MoreVertical, Trash2, Eraser, BellOff, Bell, User, Paperclip, Loader, Mic, Play, Pause } from 'lucide-react';
import useStore, { socket } from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';
import useSmoothScroll from '../hooks/useSmoothScroll';

const pulseAnimation = `
@keyframes pulse-red {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}
.pulse-record { animation: pulse-red 1.5s infinite; }
`;

const SmoothScrollArea = ({ children, autoScrollDeps = [], style, className }) => {
    const ref = useRef(null);
    useSmoothScroll(ref);

    useEffect(() => {
        if (ref.current && autoScrollDeps.length > 0) {
            const timer = setTimeout(() => {
                if (ref.current) {
                    ref.current.scrollTop = ref.current.scrollHeight;
                    ref.current.dispatchEvent(new Event('scroll'));
                    ref.current.focus({ preventScroll: true });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, autoScrollDeps);

    return (
        <div ref={ref} className={className} tabIndex={-1} onMouseEnter={(e) => { if (e.currentTarget) e.currentTarget.focus({ preventScroll: true }); }} style={style}>
            <style>{pulseAnimation}</style>
            {children}
        </div>
    );
};

const CustomAudioPlayer = ({ src, accent }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setProgress((current / total) * 100 || 0);
        setCurrentTime(formatTime(current));
    };

    const handleLoadedMetadata = () => {
        setDuration(formatTime(audioRef.current.duration));
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime('0:00');
    };

    const handleSeek = (e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const percent = Math.max(0, Math.min(1, x / bounds.width));
        audioRef.current.currentTime = percent * audioRef.current.duration;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '25px', minWidth: '220px', maxWidth: '280px', margin: '5px 0' }}>
            <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
                style={{ display: 'none' }}
            />
            
            <div onClick={togglePlay} style={{ width: '38px', height: '38px', background: accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: `0 4px 10px ${accent}44` }} className="menu-hover">
                {isPlaying ? <Pause size={18} fill="white" color="white" /> : <Play size={18} fill="white" color="white" style={{ marginLeft: '2px' }} />}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div onClick={handleSeek} style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`, background: accent, borderRadius: '3px', transition: 'width 0.1s linear' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: 'white', borderRadius: '50%', boxShadow: '0 0 5px rgba(0,0,0,0.5)', transition: 'left 0.1s linear' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    <span>{currentTime}</span>
                    <span>{duration}</span>
                </div>
            </div>
        </div>
    );
};

const MessagesTab = ({ setCurrentPage }) => {
    const { currentLang, myChats, activeChatId, setActiveChatId, setSelectedModel, userUniqueId, onlineUsers, setOnlineUser } = useStore();
    
    const [chatInput, setChatInput] = useState('');
    const [partnerIsTyping, setPartnerIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showMicModal, setShowMicModal] = useState(false);
    
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);

    const typingTimeoutRef = useRef(null);
    const isMobileChatOpen = activeChatId !== null;
    const activeChat = myChats.find(c => c.id === activeChatId);

    const dialogsScrollRef = useRef(null);
    const chatScrollRef = useRef(null);

    useSmoothScroll(dialogsScrollRef);

    useEffect(() => {
        document.body.classList.add('chat-active');
        return () => document.body.classList.remove('chat-active');
    }, []);

    const getPartnerInfo = (chat) => {
        if (!chat || !userUniqueId) return { name: 'Модель', avatar: null, isClient: false };
        const myId = String(userUniqueId);
        if (myId === String(chat.model?.userId)) return { name: `Клієнт (ID: ${chat.partnerId ? String(chat.partnerId).slice(-4) : '0000'})`, avatar: null, isClient: true };
        return { name: chat.model?.name || 'Модель', avatar: chat.model?.photos?.[0] || null, isClient: false };
    };

    useEffect(() => {
        if (!userUniqueId) return;
        const fetchChats = async () => {
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
                const res = await fetch(`${BASE_URL}/chats/${userUniqueId}?t=${Date.now()}`, {
                    method: 'GET', cache: 'no-store', headers: { 'Cache-Control': 'no-cache' }
                });
                const data = await res.json();
                if (data.success) {
                    const formattedChats = data.data.map(chat => {
                        const partnerId = chat.participants.find(p => p !== userUniqueId);
                        return {
                            id: chat.roomId, partnerId, model: chat.modelProfile || {},
                            messages: chat.messages.map(m => ({ 
                                id: m._id || Math.random(), text: m.text, sender: m.senderId === userUniqueId ? 'me' : 'partner', 
                                time: m.time, type: m.type || 'text', mediaUrl: m.mediaUrl || null 
                            })),
                            mutedBy: chat.mutedBy || []
                        };
                    });
                    useStore.setState(state => {
                        const newEmptyChat = state.myChats.find(c => c.id === state.activeChatId && c.messages.length === 0);
                        if (newEmptyChat && !formattedChats.find(c => c.id === newEmptyChat.id)) return { myChats: [newEmptyChat, ...formattedChats] };
                        return { myChats: formattedChats };
                    });
                }
            } catch (err) { console.error("Помилка завантаження чатів:", err); }
        };
        fetchChats();
    }, [userUniqueId]);

    useEffect(() => {
        myChats.forEach(chat => socket.emit('join_room', chat.id));
        const handleStatusChange = ({ userId, status, lastSeen }) => setOnlineUser(userId, { status, lastSeen });
        const handleTyping = ({ senderId }) => { if (activeChat && senderId === activeChat.partnerId) setPartnerIsTyping(true); };
        const handleStopTyping = ({ senderId }) => { if (activeChat && senderId === activeChat.partnerId) setPartnerIsTyping(false); };

        socket.on('user_status_change', handleStatusChange);
        socket.on('user_typing', handleTyping);
        socket.on('user_stopped_typing', handleStopTyping);

        return () => {
            socket.off('user_status_change', handleStatusChange);
            socket.off('user_typing', handleTyping);
            socket.off('user_stopped_typing', handleStopTyping);
        };
    }, [myChats.length, userUniqueId, activeChat, setOnlineUser]);

    const handleToggleMute = async () => {
        setShowMenu(false);
        const isMuted = Array.isArray(activeChat?.mutedBy) && activeChat.mutedBy.includes(userUniqueId);
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/chats/${activeChatId}/mute`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, mute: !isMuted })
            });
            const data = await res.json();
            if (data.success) useStore.setState(state => ({ myChats: state.myChats.map(c => c.id === activeChatId ? { ...c, mutedBy: data.mutedBy } : c) }));
        } catch (err) { console.error(err); }
    };

    const handleClearHistory = async () => {
        if (!window.confirm("Очистити історію повідомлень? Сама переписка залишиться у списку.")) return;
        setShowMenu(false);
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            await fetch(`${BASE_URL}/chats/${activeChatId}/clear`, { method: 'DELETE' });
            useStore.setState(state => ({ myChats: state.myChats.map(c => c.id === activeChatId ? { ...c, messages: [] } : c) }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteChat = async () => {
        if (!window.confirm("Назавжди видалити цю переписку? Вона зникне зі списку.")) return;
        setShowMenu(false);
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            await fetch(`${BASE_URL}/chats/${activeChatId}/delete`, { method: 'DELETE' });
            useStore.setState(state => ({ myChats: state.myChats.filter(c => c.id !== activeChatId), activeChatId: null }));
        } catch (err) { console.error(err); }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMediaFile(file);
        setMediaPreview({ url: URL.createObjectURL(file), type: file.type.startsWith('video') ? 'video' : 'image' });
    };

    const clearMedia = () => {
        setMediaFile(null); setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleInputChange = (e) => {
        setChatInput(e.target.value);
        if (activeChatId && userUniqueId) {
            socket.emit('typing', { senderId: userUniqueId, receiverId: activeChat.partnerId });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', { senderId: userUniqueId, receiverId: activeChat.partnerId }), 2000);
        }
    };

    const handleMicClick = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Браузер апаратно заблокував мікрофон! Причина: сайт відкритий не через HTTPS (або не через localhost).");
                return;
            }
            const query = await navigator.permissions.query({ name: 'microphone' });
            if (query.state === 'granted') {
                startRecording();
            } else if (query.state === 'prompt') {
                setShowMicModal(true);
            } else {
                alert(t[currentLang]?.micBlocked || "Ви заблокували доступ до мікрофона в налаштуваннях браузера.");
            }
        } catch (err) {
            setShowMicModal(true);
        }
    };

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Браузер відмовився вмикати мікрофон.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' }); 
                    await sendAudioFile(audioBlob);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            console.error("Детальна помилка мікрофона:", err);
            alert(`Апаратна помилка: ${err.name}\nОпис: ${err.message}\n\nПеревірте налаштування приватності ОС.`);
        }
    };

    const stopRecordingAndSend = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            audioChunksRef.current = []; 
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
            setRecordingTime(0);
        }
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const sendAudioFile = async (blob) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('media', blob, `voice_${Date.now()}.mp4`); 

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const res = await fetch(`${BASE_URL}/chat/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                emitMessage('', 'audio', data.mediaUrl);
            }
        } catch (err) {
            console.error("Audio upload error:", err);
            alert("Помилка відправки голосового");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSend = async () => {
        if ((!chatInput.trim() && !mediaFile) || !activeChatId || isUploading) return;
        setIsUploading(true);
        let finalType = 'text';
        let finalMediaUrl = null;

        if (mediaFile) {
            const formData = new FormData();
            formData.append('media', mediaFile);
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
                const res = await fetch(`${BASE_URL}/chat/upload`, { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    finalMediaUrl = data.mediaUrl;
                    finalType = mediaFile.type.startsWith('video') ? 'video' : 'image';
                }
            } catch (err) {
                console.error("Upload error:", err); setIsUploading(false); alert("Помилка завантаження файлу"); return;
            }
        }

        emitMessage(chatInput, finalType, finalMediaUrl);
        setChatInput('');
        clearMedia();
        setIsUploading(false);
    };

    const emitMessage = (text, type, mediaUrl) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsgForMe = { id: Date.now(), text, sender: 'me', time, type, mediaUrl };
        
        socket.emit('send_message', {
            roomId: activeChatId, senderId: userUniqueId, partnerId: activeChat.partnerId, 
            text, time, modelProfile: activeChat.model, type, mediaUrl
        });
        
        socket.emit('stop_typing', { senderId: userUniqueId, receiverId: activeChat.partnerId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        useStore.setState((state) => ({
            myChats: state.myChats.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, newMsgForMe] } : c)
        }));
    };

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

    const isMobile = window.innerWidth < 768;

    return (
        <main className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100dvh - 110px)' : 'calc(100vh - 145px)', width: '100%', overflow: 'hidden' }}>
            
            <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                <h1 style={{ fontSize: 'clamp(20px, 5vw, 32px)', margin: 0, letterSpacing: '1px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', wordBreak: 'break-word', flex: 1 }}>
                    <MessageCircle size={30} color={accent} style={{ flexShrink: 0 }} /> 
                    {t[currentLang]?.messagesTitle || 'Повідомлення'}
                </h1>
                <div onClick={() => setCurrentPage('catalog')} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', flexShrink: 0, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} className="menu-hover">
                    <X size={20} color="#888" />
                </div>
            </div>

            <div className="messages-container" style={{ display: 'flex', flex: '1 1 0', minHeight: 0, background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', boxShadow: `0 10px 40px rgba(0,0,0,0.8)` }}>
                
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

                <div className={`messages-chat-area ${!isMobileChatOpen ? 'hide-on-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', height: '100%' }}>
                    {!activeChat ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px', background: `radial-gradient(circle at center, #111 0%, #050508 100%)`, fontWeight: '500' }}>
                            {t[currentLang]?.selectChat || 'Оберіть чат для початку спілкування'}
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div onClick={() => setActiveChatId(null)} className="mobile-back-btn" style={{ cursor: 'pointer', padding: '5px', marginRight: '10px' }}><ArrowLeft size={24} color="#888" /></div>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', cursor: !getPartnerInfo(activeChat).isClient ? 'pointer' : 'default', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => { if(!getPartnerInfo(activeChat).isClient) { setSelectedModel(activeChat.model); setCurrentPage('catalog'); } }}>
                                        {getPartnerInfo(activeChat).avatar ? <img src={getPartnerInfo(activeChat).avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar"/> : <User size={20} color="#888" />}
                                    </div>
                                    <div style={{ cursor: !getPartnerInfo(activeChat).isClient ? 'pointer' : 'default' }} onClick={() => { if(!getPartnerInfo(activeChat).isClient) { setSelectedModel(activeChat.model); setCurrentPage('catalog'); } }}>
                                        <div style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>{getPartnerInfo(activeChat).name}</div>
                                        {getPartnerStatus()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {!getPartnerInfo(activeChat).isClient && <div onClick={() => {setSelectedModel(activeChat.model); setCurrentPage('catalog');}} style={{ color: accent, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }} className="menu-hover hide-mobile-text">{t[currentLang]?.viewProfile || 'Профіль'}</div>}
                                    
                                    {/* 🔥 ТРИ ТОЧКИ ПОВЕРНУЛИСЯ! */}
                                    <div style={{ position: 'relative' }}>
                                        <div onClick={() => setShowMenu(!showMenu)} style={{ padding: '5px', cursor: 'pointer', color: '#888', transition: '0.2s' }} className="menu-hover">
                                            <MoreVertical size={24} />
                                        </div>
                                        
                                        {showMenu && (
                                            <>
                                                {/* Прозорий фон для закриття меню по кліку */}
                                                <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'transparent' }} />
                                                
                                                {/* Сама менюшка */}
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

                            <SmoothScrollArea 
                                className="custom-scrollbar"
                                autoScrollDeps={[activeChat.messages.length, partnerIsTyping, mediaPreview, isRecording]}
                                style={{ display: activeChat ? 'flex' : 'none', flex: 1, minHeight: 0, padding: '20px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', outline: 'none', flexDirection: 'column', gap: '15px', background: '#050508' }}
                            >
                                {activeChat?.messages.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '13px', fontStyle: 'italic' }}>Тут поки немає повідомлень...</div>
                                ) : (
                                    activeChat?.messages.map(msg => {
                                        const isMe = msg.sender === 'me';
                                        let mediaSrc = null;
                                        if (msg.mediaUrl) {
                                            if (msg.mediaUrl.startsWith('http')) {
                                                mediaSrc = msg.mediaUrl;
                                            } else {
                                                const envApi = import.meta.env.VITE_API_URL || '';
                                                const baseUrl = envApi ? envApi.replace(/\/api\/?$/, '') : `http://${window.location.hostname}:5000`;
                                                mediaSrc = `${baseUrl}${msg.mediaUrl}`;
                                            }
                                        }

                                        return (
                                            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? accent : '#1a1a1a', border: 'none', color: 'white', padding: '12px 18px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', maxWidth: '85%', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontWeight: '500', wordBreak: 'break-word', flexShrink: 0 }}>
                                                {msg.type === 'image' && mediaSrc && (
                                                    <img src={mediaSrc} alt="photo" style={{ width: '100%', maxWidth: '300px', borderRadius: '10px', marginBottom: msg.text ? '10px' : '0', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                )}
                                                {msg.type === 'video' && mediaSrc && (
                                                    <video src={mediaSrc} controls playsInline webkit-playsinline="true" preload="metadata" style={{ width: '100%', maxWidth: '300px', borderRadius: '10px', marginBottom: msg.text ? '10px' : '0', outline: 'none', background: '#000' }} />
                                                )}
                                                {msg.type === 'audio' && mediaSrc && (
                                                    <CustomAudioPlayer src={mediaSrc} accent={accent} />
                                                )}
                                                {msg.text && <div style={{marginTop: (msg.type === 'image' || msg.type === 'video' || msg.type === 'audio') ? '8px' : '0'}}>{msg.text}</div>}
                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginTop: '5px', textAlign: 'right' }}>{msg.time}</div>
                                            </div>
                                        )
                                    })
                                )}
                                {partnerIsTyping && <div style={{ alignSelf: 'flex-start', background: 'transparent', color: '#888', padding: '5px 10px', fontSize: '12px', fontStyle: 'italic', flexShrink: 0 }}>{getPartnerInfo(activeChat).name} друкує...</div>}
                            </SmoothScrollArea>

                            {mediaPreview && (
                                <div style={{ background: '#111', padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                                    <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${accent}` }}>
                                        {mediaPreview.type === 'image' ? <img src={mediaPreview.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <video src={mediaPreview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        <div onClick={clearMedia} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}><X size={14} color="white"/></div>
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '13px' }}>{mediaPreview.type === 'image' ? 'Фото готове до відправки' : 'Відео готове до відправки'}</div>
                                </div>
                            )}

                            {isRecording ? (
                                <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f', display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
                                    <div onClick={cancelRecording} style={{ cursor: 'pointer', color: '#ff4444', padding: '10px', background: 'rgba(255,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }} className="menu-hover">
                                        <Trash2 size={20} />
                                    </div>
                                    
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '25px' }}>
                                        <div className="pulse-record" style={{ width: '12px', height: '12px', background: '#ff4444', borderRadius: '50%' }}></div>
                                        <span style={{ color: 'white', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px', letterSpacing: '1px' }}>{formatTime(recordingTime)}</span>
                                    </div>

                                    <div onClick={stopRecordingAndSend} style={{ width: '50px', height: '50px', background: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s', flexShrink: 0, boxShadow: '0 0 15px rgba(76, 175, 80, 0.3)' }} className="menu-hover">
                                        <Send size={20} color="white" style={{ marginLeft: '-2px' }} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f', display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
                                    <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                                    <div onClick={() => fileInputRef.current.click()} style={{ padding: '10px', cursor: 'pointer', background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', transition: '0.3s', flexShrink: 0 }} className="menu-hover">
                                        <Paperclip size={20} />
                                    </div>

                                    <input 
                                        value={chatInput} onChange={handleInputChange} onKeyPress={e => e.key === 'Enter' && handleSend()} 
                                        placeholder={t[currentLang]?.typeMessage || 'Введіть повідомлення...'} 
                                        style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 20px', color: 'white', borderRadius: '25px', outline: 'none', fontSize: '14px', fontFamily: 'inherit', fontWeight: '500', minWidth: 0 }} 
                                        disabled={isUploading}
                                    />
                                    
                                    <div onClick={(chatInput.trim() || mediaFile) ? handleSend : handleMicClick} style={{ width: '50px', height: '50px', background: (chatInput.trim() || mediaFile) ? accent : '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !isUploading ? 'pointer' : 'default', transition: '0.3s', flexShrink: 0 }} className={!isUploading ? "menu-hover" : ""}>
                                        {isUploading ? <Loader size={20} color="white" className="spin" /> : 
                                            (chatInput.trim() || mediaFile) ? <Send size={20} color="white" style={{ marginLeft: '-2px' }} /> : <Mic size={20} color="#888" />}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showMicModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="fade-in-up" style={{ background: '#0a0a0f', border: `1px solid ${accent}44`, borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${accent}22` }}>
                        <div style={{ background: `${accent}22`, width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Mic size={35} color={accent} />
                        </div>
                        <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '20px', fontWeight: '900' }}>Доступ до мікрофона</h3>
                        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
                            Щоб відправляти голосові повідомлення, нам потрібен доступ до мікрофона. <br/><br/>
                            <b style={{color: 'white'}}>Натисніть "Дозволити" у системному вікні браузера після закриття цього повідомлення.</b>
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setShowMicModal(false)} style={{ flex: 1, padding: '14px', background: '#222', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }} className="menu-hover">
                                Скасувати
                            </button>
                            <button 
                                onClick={() => { setShowMicModal(false); startRecording(); }} 
                                style={{ flex: 1, padding: '14px', background: accent, color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: `0 5px 15px ${accent}44` }} 
                                className="menu-hover"
                            >
                                Зрозуміло
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MessagesTab;