import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = (userId) => `zefirka_support_chat_${userId || 'guest'}`;

export const useSupportLogic = (userUniqueId, email) => {
    const [showSupport, setShowSupport] = useState(false);
    const [agentName, setAgentName] = useState(null); // ім'я адміна що взяв тікет
    const [supportMessages, setSupportMessages] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY(userUniqueId));
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    });
    const [supportInput, setSupportInput] = useState('');
    const [supportAttachedImg, setSupportAttachedImg] = useState(null);
    const supportFileRef = useRef(null);

    // Зберігаємо переписку при кожній зміні
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY(userUniqueId), JSON.stringify(supportMessages)); } catch {}
    }, [supportMessages, userUniqueId]);

    const handleSupportAttach = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSupportAttachedImg(reader.result);
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const handleSupportSend = async (forcedText = null) => {
        const textToSend = typeof forcedText === 'string' ? forcedText : supportInput;
        if (!textToSend.trim() && !supportAttachedImg) return;

        const newMsg = { id: Date.now(), text: textToSend, img: supportAttachedImg, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSupportMessages(prev => [...prev, newMsg]);

        if (typeof forcedText !== 'string') {
            setSupportInput('');
            setSupportAttachedImg(null);
        }

        try {
            const token = localStorage.getItem('zefirka_token');
            await fetch('/api/support/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    userId: userUniqueId || localStorage.getItem('guest_support_id'),
                    text: textToSend,
                    userEmail: email || 'Не вказано (Гість)',
                    image: supportAttachedImg
                })
            });
        } catch (error) {}
    };

    // Очистити після закриття адміном
    const clearSupportSession = () => {
        setSupportMessages([]);
        setAgentName(null);
        try { localStorage.removeItem(STORAGE_KEY(userUniqueId)); } catch {}
    };

    return {
        showSupport, setShowSupport,
        supportMessages, setSupportMessages,
        supportInput, setSupportInput,
        supportAttachedImg, setSupportAttachedImg,
        supportFileRef, handleSupportAttach, handleSupportSend,
        agentName, setAgentName, clearSupportSession
    };
};