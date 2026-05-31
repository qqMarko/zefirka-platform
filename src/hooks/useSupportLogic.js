import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = (userId) => `zefirka_support_chat_${userId}`;

export const useSupportLogic = (userUniqueId, email) => {
    const [showSupport, setShowSupport] = useState(false);
    const [agentName, setAgentName] = useState(null);
    // Не читаємо з localStorage при ініціалізації — userUniqueId може ще не бути
    const [supportMessages, setSupportMessages] = useState([]);
    const [supportInput, setSupportInput] = useState('');
    const [supportAttachedImg, setSupportAttachedImg] = useState(null);
    const supportFileRef = useRef(null);
    const loadedForUser = useRef(null);

    // Завантажуємо історію тільки коли userUniqueId відомий — і тільки раз на юзера
    useEffect(() => {
        if (!userUniqueId || loadedForUser.current === userUniqueId) return;
        loadedForUser.current = userUniqueId;
        // Скидаємо попередні повідомлення (могли бути від іншого юзера)
        setSupportMessages([]);
        // Видаляємо гостьовий ключ — він більше не потрібен
        try { localStorage.removeItem(`zefirka_support_chat_guest`); } catch {}
        // Завантажуємо переписку конкретного юзера
        try {
            const raw = localStorage.getItem(STORAGE_KEY(userUniqueId));
            if (raw) setSupportMessages(JSON.parse(raw));
        } catch {}
    }, [userUniqueId]);

    // Зберігаємо переписку при кожній зміні (тільки якщо є реальний userId)
    useEffect(() => {
        if (!userUniqueId) return;
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