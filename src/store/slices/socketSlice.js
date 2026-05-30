// Налаштування socket-слухачів
export const createSocketSlice = (socket, set, get) => ({
    setupGlobalSocket: () => {
        const userId = get().userUniqueId;

        socket.off('global_promo');
        socket.on('global_promo', (data) => {
            set({ activePromoText: data.text, activeDiscount: data.discount });
        });

        socket.off('global_sync');
        socket.on('global_sync', (data) => {
            if (data.action === 'reload_catalog') get().loadCatalog();
        });

        if (!userId) return;

        socket.off(`force_logout_${userId}`);
        socket.on(`force_logout_${userId}`, (data) => {
            const currentMyToken = get().token || localStorage.getItem('zefirka_token');
            if (currentMyToken !== data.keepToken) {
                get().logout();
                window.location.href = '/';
            }
        });

        socket.off(`kill_session_${userId}`);
        socket.on(`kill_session_${userId}`, (data) => {
            const currentMyToken = get().token || localStorage.getItem('zefirka_token');
            if (currentMyToken === data.removedToken) {
                get().logout();
                window.location.href = '/';
            }
        });

        socket.emit('user_connected', userId);

        socket.off('sync_online_users');
        socket.on('sync_online_users', (onlineIds) => {
            set((state) => {
                const updatedUsers = { ...state.onlineUsers };
                Object.keys(updatedUsers).forEach(id => {
                    if (!onlineIds.includes(id) && updatedUsers[id]?.status === 'online') {
                        updatedUsers[id] = { status: 'offline', lastSeen: new Date() };
                    }
                });
                onlineIds.forEach(id => { updatedUsers[id] = { status: 'online' }; });
                return { onlineUsers: updatedUsers };
            });
        });

        socket.off('connect');
        socket.on('connect', () => { socket.emit('user_connected', userId); });

        socket.off(`new_notification_${userId}`);
        socket.on(`new_notification_${userId}`, (notif) => {
            set((state) => ({
                notifications: [notif, ...state.notifications],
                unreadNotifs: state.unreadNotifs + 1
            }));
        });

        socket.off(`receive_direct_message_${userId}`);
        socket.on(`receive_direct_message_${userId}`, (data) => {
            // 🚫 Власні повідомлення вже додані локально при відправці — ігноруємо ехо
            if (String(data.message?.senderId) === String(userId)) return;

            try { new Audio('/sounds/ah.mp3').play().catch(() => {}); } catch (e) {}
            const normalizedMsg = {
                id: data.message._id || Date.now() + Math.random(),
                text: data.message.text,
                time: data.message.time,
                type: data.message.type || 'text',
                mediaUrl: data.message.mediaUrl || null,
                priority: data.message.priority || 0,
                sender: 'partner',
            };
            const chatExists = get().myChats.find(c => c.id === data.roomId);
            if (chatExists) {
                set(state => ({
                    myChats: state.myChats.map(c => {
                        if (c.id !== data.roomId) return c;
                        return { ...c, messages: [...c.messages, normalizedMsg] };
                    })
                }));
            } else {
                get().loadChats(userId);
            }
        });

        socket.off('user_status_change');
        socket.on('user_status_change', ({ userId: id, status, lastSeen }) => {
            get().setOnlineUser(id, { status, lastSeen });
        });

        socket.off(`instant_sync_${userId}`);
        socket.on(`instant_sync_${userId}`, (data) => {
            if (data.action === 'ban') {
                set({ isBannedStatus: true });
                localStorage.setItem('zefirka_banned_device', 'true');
            } else if (data.action === 'unban') {
                set({ isBannedStatus: false });
                localStorage.removeItem('zefirka_banned_device');
            }
            get().loadBalance(userId);
            if (get().userRole === 'model') get().loadMyModels(userId);
        });
    },
});