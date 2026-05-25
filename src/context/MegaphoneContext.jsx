import React, { createContext, useState, useEffect, useContext } from 'react';
import { socket } from '../store/useStore';

const MegaphoneContext = createContext();

export const MegaphoneProvider = ({ children }) => {
    const [megaphone, setMegaphone] = useState({
        message: '',
        vipDiscountPercent: 0,
        bumpDiscountPercent: 0,
        activeVipPackages: [],
        isActive: false
    });

    // Персональна знижка для конкретного юзера (маркетинг-апгрейд)
    const [personalPromo, setPersonalPromo] = useState(null);

    useEffect(() => {
        // Завантажуємо початковий стан
        fetch('/api/admin/megaphone/status')
            .then(r => r.json())
            .then(res => {
                if (res.success && res.settings) setMegaphone(res.settings);
            })
            .catch(err => console.error('Megaphone fetch error:', err));

        // Слухаємо оновлення через ІСНУЮЧИЙ сокет (не створюємо новий)
        const handleUpdate = (newSettings) => setMegaphone(newSettings);
        socket.on('megaphone_update', handleUpdate);

        return () => socket.off('megaphone_update', handleUpdate);
    }, []);

    // Персональна знижка від маркетинг-логіки
    useEffect(() => {
        const userId = localStorage.getItem('zefirka_userId');
        if (!userId) return;

        const handlePersonalPromo = (data) => {
            setPersonalPromo(data);
            // Автовидалення після закінчення
            const msLeft = new Date(data.expiresAt) - Date.now();
            if (msLeft > 0) setTimeout(() => setPersonalPromo(null), msLeft);
        };

        socket.on(`personal_promo_${userId}`, handlePersonalPromo);
        return () => socket.off(`personal_promo_${userId}`, handlePersonalPromo);
    }, []);

    return (
        <MegaphoneContext.Provider value={{ ...megaphone, personalPromo }}>
            {children}
        </MegaphoneContext.Provider>
    );
};

export const useMegaphone = () => useContext(MegaphoneContext);