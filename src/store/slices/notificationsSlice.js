// Сповіщення та push-налаштування
export const createNotificationsSlice = (set, get) => {
    const BASE_URL = '/api';

    return {
        loadNotifications: async (userId) => {
            if (!userId) return;
            try {
                const res = await fetch(`${BASE_URL}/notifications/${userId}?t=${Date.now()}`);
                const data = await res.json();
                if (data.success) {
                    set({
                        notifications: data.data,
                        unreadNotifs: data.data.filter(n => !n.isRead).length,
                        pushEnabled: data.pushEnabled !== false
                    });
                }
            } catch (err) { console.error("Помилка завантаження сповіщень", err); }
        },

        markNotificationsAsRead: async () => {
            const userId = get().userUniqueId;
            if (!userId) return;
            try {
                await fetch(`${BASE_URL}/notifications/${userId}/read`, { method: 'POST' });
                set((state) => ({
                    unreadNotifs: 0,
                    notifications: state.notifications.map(n => ({ ...n, isRead: true }))
                }));
            } catch (err) { console.error("Помилка читання", err); }
        },

        deleteNotification: async (notifId) => {
            const userId = get().userUniqueId;
            if (!userId) return;
            try {
                await fetch(`${BASE_URL}/notifications/${userId}/${notifId}`, { method: 'DELETE' });
                set((state) => {
                    const updated = state.notifications.filter(n => (n._id || n.id) !== notifId);
                    return { notifications: updated, unreadNotifs: updated.filter(n => !n.isRead).length };
                });
            } catch (err) { console.error("Помилка видалення", err); }
        },

        clearAllNotifications: async () => {
            const userId = get().userUniqueId;
            if (!userId) return;
            try {
                await fetch(`${BASE_URL}/notifications/${userId}`, { method: 'DELETE' });
                set({ notifications: [], unreadNotifs: 0 });
            } catch (err) { console.error("Помилка очищення", err); }
        },

        togglePushEnabled: async () => {
            const userId = get().userUniqueId;
            const currentStatus = get().pushEnabled;
            const newStatus = !currentStatus;
            set({ pushEnabled: newStatus });
            if (userId) {
                try {
                    await fetch(`${BASE_URL}/notifications/settings/${userId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pushEnabled: newStatus })
                    });
                } catch (err) {
                    console.error("Помилка збереження", err);
                    set({ pushEnabled: currentStatus });
                }
            }
        },
    };
};