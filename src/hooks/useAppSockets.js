import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useStore, { socket } from '../store/useStore';
import { accent } from '../styles/theme';

export const useAppSockets = ({
    userUniqueId,
    setSupportMessages,
    setShowSupport,
    setHasActiveDisputeAlert
}) => {
    useEffect(() => {
        // Логіка визначення ID користувача (або гостя для підтримки)
        const currentUserId = userUniqueId || localStorage.getItem('guest_support_id') || `GUEST_${Math.floor(Math.random()*100000)}`;
        if (!userUniqueId) localStorage.setItem('guest_support_id', currentUserId);

        // Підключення користувача
        if (userUniqueId) socket.emit('user_connected', userUniqueId);

        // --- Аудіо контекст для сповіщень ---
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        let audioBuffer = null;

        fetch('/sounds/ah.mp3')
            .then(res => res.arrayBuffer())
            .then(data => audioCtx.decodeAudioData(data))
            .then(buffer => {
                audioBuffer = buffer;
            })
            .catch(e => console.error("Помилка аудіо:", e));

        const unlockAudioContext = () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0; 
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start(0);
            oscillator.stop(audioCtx.currentTime + 0.1);

            document.removeEventListener('click', unlockAudioContext, { capture: true });
            document.removeEventListener('touchstart', unlockAudioContext, { capture: true });
        };

        document.addEventListener('click', unlockAudioContext, { capture: true });
        document.addEventListener('touchstart', unlockAudioContext, { capture: true });

        const playThemeSound = () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (audioBuffer) {
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.start(0);
            }
        };

        // --- Обробники подій сокетів ---
        const handleSupportReply = (data) => {
            playThemeSound(); 
            setSupportMessages(prev => [...prev, { id: Date.now(), text: data.text, sender: 'agent', time: data.time }]);
            setShowSupport(true); 
            toast.success('💬 Нове повідомлення від Підтримки!', { style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
        };

        const handleDispute = () => {
            playThemeSound(); 
            setHasActiveDisputeAlert(true);
        };
        
        const handleNotif = (newNotif) => {
            playThemeSound(); 
            useStore.setState(state => ({
                notifications: [newNotif, ...state.notifications],
                unreadNotifs: state.unreadNotifs + 1
            }));
            toast(newNotif.text, { icon: '🔔', style: { background: '#111', color: '#fff', border: `1px solid ${accent}`, fontWeight: 'bold' } });
        };

        const handleDirectMessage = () => {
            playThemeSound(); 
            toast('💬 Нове повідомлення в чаті!', { style: { background: '#111', color: '#fff', border: `1px solid ${accent}`, fontWeight: 'bold' } });
        };

        // Підписка на події
        socket.on(`support_reply_${currentUserId}`, handleSupportReply);

        if (userUniqueId) {
            socket.on(`new_dispute_${userUniqueId}`, handleDispute);
            socket.on(`new_notification_${userUniqueId}`, handleNotif);
            socket.on(`receive_direct_message_${userUniqueId}`, handleDirectMessage);
        }

        // --- Обробка згортання вкладки ---
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (userUniqueId) socket.emit('user_away', userUniqueId);
            } else {
                if (userUniqueId) socket.emit('user_connected', userUniqueId);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // --- Очищення ефектів при розмонтуванні ---
        return () => { 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('click', unlockAudioContext, { capture: true });
            document.removeEventListener('touchstart', unlockAudioContext, { capture: true });
            
            socket.off(`support_reply_${currentUserId}`, handleSupportReply); 
            if (userUniqueId) {
                socket.off(`new_dispute_${userUniqueId}`, handleDispute);
                socket.off(`new_notification_${userUniqueId}`, handleNotif);
                socket.off(`receive_direct_message_${userUniqueId}`, handleDirectMessage);
            }
        };
    }, [userUniqueId, setSupportMessages, setShowSupport, setHasActiveDisputeAlert]);
};