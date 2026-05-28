import React, { useRef, useEffect, useState } from 'react';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { Play, Pause } from 'lucide-react';

const pulseAnimation = `
@keyframes pulse-red {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}
.pulse-record { animation: pulse-red 1.5s infinite; }
`;

// АУДІО ПЛЕЄР
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

    const togglePlay = () => { isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); };
    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setProgress((current / total) * 100 || 0);
        setCurrentTime(formatTime(current));
    };
    const handleLoadedMetadata = () => setDuration(formatTime(audioRef.current.duration));
    const handleEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime('0:00'); };
    const handleSeek = (e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
        audioRef.current.currentTime = percent * audioRef.current.duration;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 4px', minWidth: '220px', maxWidth: '260px' }}>
            <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="metadata" style={{ display: 'none' }} />
            <div onClick={togglePlay} style={{ width: '34px', height: '34px', background: accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s', boxShadow: `0 3px 10px ${accent}44` }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                {isPlaying ? <Pause size={15} fill="white" color="white" /> : <Play size={15} fill="white" color="white" style={{ marginLeft: '2px' }} />}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div onClick={handleSeek} style={{ height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`, background: accent, borderRadius: '3px', transition: 'width 0.1s linear' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)', width: '10px', height: '10px', background: 'white', borderRadius: '50%', boxShadow: '0 0 4px rgba(0,0,0,0.6)', transition: 'left 0.1s linear' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontFamily: 'monospace' }}>
                    <span>{currentTime}</span><span>{duration}</span>
                </div>
            </div>
        </div>
    );
};

// ЗОНА СКРОЛУ
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
        <div ref={ref} className={className} tabIndex={-1} data-lenis-prevent="true" onMouseEnter={(e) => { if (e.currentTarget) e.currentTarget.focus({ preventScroll: true }); }} style={style}>
            <style>{pulseAnimation}</style>
            {children}
        </div>
    );
};

const ChatMessageList = ({ activeChat, partnerIsTyping, getPartnerInfo, mediaPreview, isRecording, accent }) => {
    return (
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
                        if (msg.mediaUrl.startsWith('http')) mediaSrc = msg.mediaUrl;
                        else {
                            const envApi = import.meta.env.VITE_API_URL || '';
                            const baseUrl = envApi ? envApi.replace(/\/api\/?$/, '') : `http://${window.location.hostname}:5000`;
                            mediaSrc = `${baseUrl}${msg.mediaUrl}`;
                        }
                    }

                    const isVipMsg = !isMe && (msg.priority || 0) >= 2;
                    const isAudio = msg.type === 'audio';
                    return (
                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', position: 'relative', background: isAudio ? '#1a1a1a' : (isMe ? accent : '#1a1a1a'), border: isVipMsg ? '1px solid #FFD700' : 'none', color: 'white', padding: isAudio ? '6px 10px' : '12px 18px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', maxWidth: '85%', fontSize: '14px', lineHeight: '1.5', boxShadow: isVipMsg ? '0 4px 18px rgba(255,215,0,0.25)' : '0 4px 15px rgba(0,0,0,0.5)', fontWeight: '500', wordBreak: 'break-word', flexShrink: 0 }}>
                            {isVipMsg && <div style={{ fontSize: '10px', fontWeight: '900', color: '#FFD700', marginBottom: '4px', letterSpacing: '0.5px', padding: '0 8px' }}>⭐ VIP КЛІЄНТ</div>}
                            {msg.type === 'image' && mediaSrc && <img src={mediaSrc} alt="photo" style={{ width: '100%', maxWidth: '300px', borderRadius: '10px', marginBottom: msg.text ? '10px' : '0', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} />}
                            {msg.type === 'video' && mediaSrc && <video src={mediaSrc} controls playsInline webkit-playsinline="true" preload="metadata" style={{ width: '100%', maxWidth: '300px', borderRadius: '10px', marginBottom: msg.text ? '10px' : '0', outline: 'none', background: '#000' }} />}
                            {msg.type === 'audio' && mediaSrc && <CustomAudioPlayer src={mediaSrc} accent={accent} />}
                            {msg.text && <div style={{marginTop: (msg.type === 'image' || msg.type === 'video' || msg.type === 'audio') ? '8px' : '0'}}>{msg.text}</div>}
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginTop: '5px', textAlign: 'right' }}>{msg.time}</div>
                        </div>
                    )
                })
            )}
            {partnerIsTyping && <div style={{ alignSelf: 'flex-start', background: 'transparent', color: '#888', padding: '5px 10px', fontSize: '12px', fontStyle: 'italic', flexShrink: 0 }}>{getPartnerInfo(activeChat).name} друкує...</div>}
        </SmoothScrollArea>
    );
};

export default ChatMessageList;