import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import useStore, { socket } from '../store/useStore';
import { t } from '../data/translations';
import { accent } from '../styles/theme';

// Імпортуємо розбиті компоненти
import ChatSidebar from './messages/ChatSidebar';
import ChatHeader from './messages/ChatHeader';
import ChatMessageList from './messages/ChatMessageList';
import ChatInputBox from './messages/ChatInputBox';
import MicPermissionModal from './messages/MicPermissionModal';

const MessagesTab = ({ setCurrentPage, setSelectedModel }) => {
    const { currentLang, myChats, activeChatId, setActiveChatId, userUniqueId, onlineUsers, setOnlineUser, user } = useStore();
    
    // СТЕЙТИ
    const [chatInput, setChatInput] = useState('');
    const [partnerIsTyping, setPartnerIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showMicModal, setShowMicModal] = useState(false);
    
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const cancelledRef = useRef(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const isMobileChatOpen = activeChatId !== null;
    const activeChat = myChats.find(c => c.id === activeChatId);
    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        document.body.classList.add('chat-active');
        return () => document.body.classList.remove('chat-active');
    }, []);

    const getPartnerInfo = (chat) => {
        if (!chat || !userUniqueId) return { name: 'Модель', avatar: null, isClient: false };
        const myId = String(userUniqueId);
        const modelOwnerId = String(chat.model?.userId?._id || chat.model?.userId || '');
        // Якщо власник анкети = я → співрозмовник є КЛІЄНТОМ
        if (modelOwnerId && myId === modelOwnerId) {
            const shortId = chat.partnerId ? String(chat.partnerId).slice(-4) : '0000';
            return { name: `Клієнт #${shortId}`, avatar: null, isClient: true };
        }
        return { name: chat.model?.name || 'Модель', avatar: chat.model?.photos?.[0] || null, isClient: false };
    };

    // ЗАВАНТАЖЕННЯ ЧАТІВ ТА СОКЕТИ
    useEffect(() => {
        if (!userUniqueId) return;
        const fetchChats = async () => {
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
                const token = localStorage.getItem('zefirka_token');
                const res = await fetch(`${BASE_URL}/chats/${userUniqueId}?t=${Date.now()}`, {
                    method: 'GET', cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    const formattedChats = data.data.map(chat => {
                        const partnerId = chat.participants.find(p => p !== userUniqueId);
                        const messages = chat.messages.map(m => ({ 
                            id: m._id || Math.random(), text: m.text, sender: m.senderId === userUniqueId ? 'me' : 'partner', 
                            time: m.time, type: m.type || 'text', mediaUrl: m.mediaUrl || null,
                            priority: m.priority || 0
                        }));
                        // 👑 Беремо актуальний пріоритет партнера з сервера (не з історії повідомлень)
                        const clientPriority = chat.partnerPriority || 0;
                        return {
                            id: chat.roomId, partnerId, model: chat.modelProfile || {},
                            messages, mutedBy: chat.mutedBy || [], clientPriority
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

    // ДІЇ З ЧАТОМ
    const handleToggleMute = async () => {
        setShowMenu(false);
        const isMuted = Array.isArray(activeChat?.mutedBy) && activeChat.mutedBy.includes(userUniqueId);
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            const res = await fetch(`${BASE_URL}/chats/${activeChatId}/mute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ mute: !isMuted })
            });
            const data = await res.json();
            if (data.success) useStore.setState(state => ({ myChats: state.myChats.map(c => c.id === activeChatId ? { ...c, mutedBy: data.mutedBy } : c) }));
        } catch (err) { console.error(err); }
    };

    const handleClearHistory = async () => {
        if (!window.confirm(t[currentLang]?.chatClearConfirm || "Очистити історію повідомлень? Сама переписка залишиться у списку.")) return;
        setShowMenu(false);
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            await fetch(`${BASE_URL}/chats/${activeChatId}/clear`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            useStore.setState(state => ({ myChats: state.myChats.map(c => c.id === activeChatId ? { ...c, messages: [] } : c) }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteChat = async () => {
        if (!window.confirm("Назавжди видалити цю переписку? Вона зникне зі списку.")) return;
        setShowMenu(false);
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
            const token = localStorage.getItem('zefirka_token');
            await fetch(`${BASE_URL}/chats/${activeChatId}/delete`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            useStore.setState(state => ({ myChats: state.myChats.filter(c => c.id !== activeChatId), activeChatId: null }));
        } catch (err) { console.error(err); }
    };

    // ФАЙЛИ ТА ВВІД
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

    // МІКРОФОН ТА ГОЛОСОВІ
    const handleMicClick = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Браузер апаратно заблокував мікрофон! Причина: сайт відкритий не через HTTPS.");
                return;
            }
            const query = await navigator.permissions.query({ name: 'microphone' });
            if (query.state === 'granted') startRecording();
            else if (query.state === 'prompt') setShowMicModal(true);
            else alert(t[currentLang]?.micBlocked || "Ви заблокували доступ до мікрофона в налаштуваннях браузера.");
        } catch (err) { setShowMicModal(true); }
    };

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert("Браузер відмовився вмикати мікрофон.");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorderRef.current.onstop = async () => {
                if (!cancelledRef.current && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' }); 
                    await sendAudioFile(audioBlob);
                }
                audioChunksRef.current = [];
                cancelledRef.current = false;
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            cancelledRef.current = false;
            setIsRecording(true); setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) { alert(`Апаратна помилка мікрофона.`); }
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
            cancelledRef.current = true; // 🚫 onstop пропустить відправку
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
            const token = localStorage.getItem('zefirka_token');
            const res = await fetch(`${BASE_URL}/chat/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
            });
            const data = await res.json();
            if (data.success) emitMessage('', 'audio', data.mediaUrl);
        } catch (err) { alert("Помилка відправки голосового"); } 
        finally { setIsUploading(false); }
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
                const token = localStorage.getItem('zefirka_token');
            const res = await fetch(`${BASE_URL}/chat/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
            });
                const data = await res.json();
                if (data.success) {
                    finalMediaUrl = data.mediaUrl;
                    finalType = mediaFile.type.startsWith('video') ? 'video' : 'image';
                }
            } catch (err) { setIsUploading(false); alert("Помилка завантаження файлу"); return; }
        }

        emitMessage(chatInput, finalType, finalMediaUrl);
        setChatInput(''); clearMedia(); setIsUploading(false);
    };

    const emitMessage = (text, type, mediaUrl) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsgForMe = { id: Date.now(), text, sender: 'me', time, type, mediaUrl, priority: 0 };
        
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

    return (
        <main className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100dvh - 110px)' : 'calc(100vh - 145px)', width: '100%', overflow: 'hidden' }}>
            
            {/* ШАПКА ВКЛАДКИ */}
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
                
                <ChatSidebar 
                    myChats={myChats} activeChatId={activeChatId} setActiveChatId={setActiveChatId}
                    onlineUsers={onlineUsers} userUniqueId={userUniqueId} accent={accent}
                    t={t} currentLang={currentLang} isMobile={isMobile} isMobileChatOpen={isMobileChatOpen}
                    getPartnerInfo={getPartnerInfo}
                />

                <div className={`messages-chat-area ${!isMobileChatOpen ? 'hide-on-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', height: '100%' }}>
                    {!activeChat ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px', background: `radial-gradient(circle at center, #111 0%, #050508 100%)`, fontWeight: '500' }}>
                            {t[currentLang]?.selectChat || 'Оберіть чат для початку спілкування'}
                        </div>
                    ) : (
                        <>
                            <ChatHeader 
                                activeChat={activeChat} activeChatId={activeChatId} userUniqueId={userUniqueId}
                                onlineUsers={onlineUsers} accent={accent} t={t} currentLang={currentLang}
                                setActiveChatId={setActiveChatId} setSelectedModel={setSelectedModel} setCurrentPage={setCurrentPage}
                                showMenu={showMenu} setShowMenu={setShowMenu} getPartnerInfo={getPartnerInfo}
                                handleToggleMute={handleToggleMute} handleClearHistory={handleClearHistory} handleDeleteChat={handleDeleteChat}
                                userVipPackage={user?.vipPackage} userVipExpires={user?.vipExpiresAt}
                            />

                            <ChatMessageList 
                                activeChat={activeChat} partnerIsTyping={partnerIsTyping} 
                                getPartnerInfo={getPartnerInfo} mediaPreview={mediaPreview} isRecording={isRecording} accent={accent}
                                clientPriority={activeChat?.clientPriority || 0}
                                userUniqueId={userUniqueId} socket={socket}
                            />

                            <ChatInputBox 
                                chatInput={chatInput} handleInputChange={handleInputChange} handleSend={handleSend}
                                mediaPreview={mediaPreview} clearMedia={clearMedia} fileInputRef={fileInputRef} handleFileSelect={handleFileSelect}
                                isRecording={isRecording} recordingTime={recordingTime} formatTime={formatTime}
                                handleMicClick={handleMicClick} cancelRecording={cancelRecording} stopRecordingAndSend={stopRecordingAndSend}
                                isUploading={isUploading} accent={accent} t={t} currentLang={currentLang}
                            />
                        </>
                    )}
                </div>
            </div>

            <MicPermissionModal showMicModal={showMicModal} setShowMicModal={setShowMicModal} startRecording={startRecording} accent={accent} />
            
        </main>
    );
};

export default MessagesTab;