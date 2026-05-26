import { create } from 'zustand';
import io from 'socket.io-client';

// WebSocket одразу — без polling затримки
export const socket = io("/", {
    path: "/socket.io",
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});

socket.on('connect', () => console.log('✅ Socket:', socket.id));
socket.on('disconnect', (r) => console.warn('❌ Socket disconnect:', r));
socket.on('connect_error', (e) => console.error('🔥 Socket error:', e.message));

const savedToken = localStorage.getItem('zefirka_token');
const savedUserId = localStorage.getItem('zefirka_userId');
const savedRole = localStorage.getItem('zefirka_role');
const savedEmail = localStorage.getItem('zefirka_email');
const saved2FA = localStorage.getItem('zefirka_2fa') === 'true';
const savedEmailNotif = localStorage.getItem('zefirka_emailNotif') !== 'false';

const BASE_URL = '/api';

const useStore = create((set, get) => ({
    isLoggedIn: !!savedToken,
    token: savedToken || null,
    userUniqueId: savedUserId || '',
    userRole: savedRole || 'model',
    email: savedEmail || '',

    balance: 0,
    isBannedStatus: false,
    trustScore: 100,

    user: {
        freeBumps: 0,
        twoFactorEnabled: saved2FA,
        emailNotifications: savedEmailNotif,
        vipPackage: 'none',
        vipExpiresAt: null
    },

    notifications: [],
    unreadNotifs: 0,
    pushEnabled: true,

    activePromoText: '',
    activeDiscount: 0,

    hasDisputeAccess: () => {
        const { user } = get();
        const allowedPackages = ['premium', 'diamond', 'premium_client', 'priority_chat', 'concierge'];
        return allowedPackages.includes(user.vipPackage?.toLowerCase());
    },

    setBalance: (amount) => set({ balance: amount }),
    setUser: (userData) => set({ user: { ...get().user, ...userData } }),

    loadBalance: async (userId) => {
        if (!userId) return;
        try {
            const res = await fetch(`${BASE_URL}/wallet/balance/${userId}?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) {
                let parsedTrust = parseInt(data.trustScore);
                if (isNaN(parsedTrust)) parsedTrust = 100;
                set({
                    balance: data.balance || 0,
                    isBannedStatus: !!data.isBanned,
                    trustScore: parsedTrust,
                    user: {
                        ...get().user,
                        freeBumps: data.freeBumps || 0,
                        vipPackage: data.vipPackage || 'none',
                        vipExpiresAt: data.vipExpiresAt || null,
                        upgradeDiscount: data.upgradeDiscount || null
                    }
                });
                if (data.isBanned) localStorage.setItem('zefirka_banned_device', 'true');
                else localStorage.removeItem('zefirka_banned_device');
            }
        } catch (err) {
            console.error("Помилка балансу", err);
        }
    },

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
        } catch (err) {
            console.error("Помилка завантаження сповіщень", err);
        }
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
        } catch (err) {
            console.error("Помилка при читанні сповіщень", err);
        }
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
        } catch (err) {
            console.error("Помилка видалення сповіщення", err);
        }
    },

    clearAllNotifications: async () => {
        const userId = get().userUniqueId;
        if (!userId) return;
        try {
            await fetch(`${BASE_URL}/notifications/${userId}`, { method: 'DELETE' });
            set({ notifications: [], unreadNotifs: 0 });
        } catch (err) {
            console.error("Помилка очищення сповіщень", err);
        }
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
                console.error("Помилка збереження налаштувань", err);
                set({ pushEnabled: currentStatus });
            }
        }
    },

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
        console.log('📡 user_connected надіслано для userId:', userId);

        socket.off('sync_online_users');
        socket.on('sync_online_users', (onlineIds) => {
            set((state) => {
                const updatedUsers = { ...state.onlineUsers };
                Object.keys(updatedUsers).forEach(id => {
                    if (!onlineIds.includes(id) && updatedUsers[id]?.status === 'online') {
                        updatedUsers[id] = { status: 'offline', lastSeen: new Date() };
                    }
                });
                onlineIds.forEach(id => {
                    updatedUsers[id] = { status: 'online' };
                });
                return { onlineUsers: updatedUsers };
            });
        });

        socket.off('connect');
        socket.on('connect', () => {
            socket.emit('user_connected', userId);
        });

        socket.off(`new_notification_${userId}`);
        socket.on(`new_notification_${userId}`, (notif) => {
            set((state) => ({
                notifications: [notif, ...state.notifications],
                unreadNotifs: state.unreadNotifs + 1
            }));
        });

        socket.off(`receive_direct_message_${userId}`);
        socket.on(`receive_direct_message_${userId}`, (data) => {
            // Звук сповіщення для вхідних повідомлень
            if (String(data.message?.senderId) !== String(userId)) {
                try { new Audio('/sounds/ah.mp3').play().catch(() => {}); } catch (e) {}
            }

            const normalizedMsg = {
                id: data.message._id || Date.now() + Math.random(),
                text: data.message.text,
                time: data.message.time,
                type: data.message.type || 'text',
                mediaUrl: data.message.mediaUrl || null,
                sender: String(data.message.senderId) === String(userId) ? 'me' : 'partner',
            };

            const chatExists = get().myChats.find(c => c.id === data.roomId);
            if (chatExists) {
                set(state => ({
                    myChats: state.myChats.map(c =>
                        c.id === data.roomId
                            ? { ...c, messages: [...c.messages, normalizedMsg] }
                            : c
                    )
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

    login: (id, role, userEmail, token, twoFactorEnabled = false, emailNotifications = true) => {
        localStorage.setItem('zefirka_token', token);
        localStorage.setItem('zefirka_userId', id);
        localStorage.setItem('zefirka_role', role);
        localStorage.setItem('zefirka_email', userEmail);
        localStorage.setItem('zefirka_2fa', twoFactorEnabled);
        localStorage.setItem('zefirka_emailNotif', emailNotifications);

        set((state) => ({
            isLoggedIn: true,
            userUniqueId: id,
            userRole: role,
            email: userEmail,
            token: token,
            showAuth: false,
            user: { ...state.user, twoFactorEnabled, emailNotifications }
        }));

        if (socket.connected) {
            get().setupGlobalSocket();
        } else {
            socket.once('connect', () => get().setupGlobalSocket());
        }
        get().loadChats(id);
    },

    logout: () => {
        localStorage.removeItem('zefirka_token');
        localStorage.removeItem('zefirka_userId');
        localStorage.removeItem('zefirka_role');
        localStorage.removeItem('zefirka_email');
        localStorage.removeItem('zefirka_banned_device');
        localStorage.removeItem('zefirka_2fa');
        localStorage.removeItem('zefirka_emailNotif');

        set({
            isLoggedIn: false, userUniqueId: '', userRole: 'model', email: '', token: null,
            myChats: [], activeChatId: null, balance: 0, isBannedStatus: false, trustScore: 100,
            notifications: [], unreadNotifs: 0, user: { freeBumps: 0, vipPackage: 'none', vipExpiresAt: null }
        });
    },

    setRole: (role) => set({ userRole: role }),
    currentLang: 'UA',
    setLang: (lang) => set({ currentLang: lang }),

    showAuth: false, setShowAuth: (show) => set({ showAuth: show }),
    showCreateModal: false, setShowCreateModal: (show) => set({ showCreateModal: show }),
    showWalletModal: false, setShowWalletModal: (show) => set({ showWalletModal: show }),
    showVipModal: false, setShowVipModal: (show) => set({ showVipModal: show }),

    models: [],
    myModels: [],
    favorites: [],
    totalPages: 1,
    totalItems: 0,
    isLoading: true,
    editingModel: null,

    setModels: (newModels) => set({ models: newModels }),
    setMyModels: (newMyModels) => set({ myModels: newMyModels }),

    loadCatalog: async (filters = {}, page = 1) => {
        set({ isLoading: true });
        try {
            const queryParams = new URLSearchParams({ page, limit: 12 });
            // Відправляємо фільтр тільки якщо він не є дефолтним значенням
            if (filters.maxAge && filters.maxAge < 60) queryParams.append('maxAge', filters.maxAge);
            if (filters.maxPrice && filters.maxPrice < 20000) queryParams.append('maxPrice', filters.maxPrice);
            if (filters.fetishes?.length) queryParams.append('fetishes', filters.fetishes.join(','));
            if (filters.hair?.length) queryParams.append('hair', filters.hair.join(','));
            if (filters.body?.length) queryParams.append('body', filters.body.join(','));
            if (filters.genders?.length) queryParams.append('genders', filters.genders.join(','));

            const response = await fetch(`${BASE_URL}/profiles?${queryParams.toString()}`);
            const result = await response.json();

            if (result.success) {
                const myId = String(get().userUniqueId);
                const formattedModels = result.data.map(profile => {
                    // userId може бути populated об'єктом {_id, trustScore, lastActive}
                    const userIdObj = profile.userId;
                    const userIdStr = String(userIdObj?._id || userIdObj || '');
                    // trustScore береться з populated userId де реальне значення
                    const trustScore = Number(userIdObj?.trustScore || userIdObj?.trustPercentage || profile.trustScore) || 100;
                    return {
                        ...profile,
                        id: profile._id,
                        userId: userIdStr,
                        priceFrom: profile.priceFrom || 500,
                        vLevel: profile.vLevel || 0,
                        trustScore,
                        isApproved: profile.isApproved || false,
                        isMine: userIdStr === myId,
                    };
                });
                set({
                    models: formattedModels,
                    totalPages: result.totalPages,
                    totalItems: result.totalItems
                });
            }
        } catch (error) {
            console.error("❌ Помилка завантаження каталогу:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    loadMyModels: async (userId) => {
        if (!userId) return;
        try {
            const response = await fetch(`${BASE_URL}/profiles?userId=${userId}&fetchAll=true&t=${Date.now()}`);
            const result = await response.json();
            if (result.success) {
                const formattedModels = result.data.map(profile => ({
                    ...profile,
                    id: profile._id,
                    priceFrom: profile.priceFrom || 500,
                    vLevel: profile.vLevel || 0,
                    trustScore: profile.trustScore || 100,
                    isApproved: profile.isApproved || false,
                    isMine: true
                }));
                set({ myModels: formattedModels });
            }
        } catch (error) {
            console.error("❌ Помилка завантаження власних анкет:", error);
        }
    },

    // ⭐ ЗАВАНТАЖИТИ ВИБРАНІ З СЕРВЕРА
    loadFavorites: async (userId) => {
        if (!userId) return;
        try {
            const res = await fetch(`${BASE_URL}/profiles/favorites/${userId}`);
            const data = await res.json();
            if (data.success) {
                const formatted = data.favorites.map(p => ({ ...p, id: p._id }));
                set({ favorites: formatted });
            }
        } catch (error) {
            console.error("❌ Помилка завантаження вибраних:", error);
        }
    },

    // ⭐ ТОГЛЕННЯ ВИБРАНИХ (ДОДАТИ / ПРИБРАТИ) + СИНХРОНІЗАЦІЯ З СЕРВЕРОМ
    toggleFavoriteServer: async (userId, profile) => {
        if (!userId || !profile) return { added: false };
        try {
            const profileId = profile.id || profile._id;
            const token = localStorage.getItem('zefirka_token');
            const res = await fetch(`${BASE_URL}/profiles/favorites/${userId}/${profileId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                if (data.added) {
                    set(state => ({ favorites: [...state.favorites, { ...profile, id: profileId }] }));
                } else {
                    set(state => ({ favorites: state.favorites.filter(f => String(f.id) !== String(profileId)) }));
                }
                return { added: data.added };
            }
        } catch (error) {
            console.error("❌ Помилка тоглення вибраних:", error);
        }
        return { added: false };
    },

    addModel: (newModel) => set((state) => ({
        models: [newModel, ...state.models],
        myModels: [newModel, ...state.myModels]
    })),

    updateModel: (updatedModel) => set((state) => ({
        models: state.models.map(m => m.id === updatedModel.id ? updatedModel : m),
        myModels: state.myModels.map(m => m.id === updatedModel.id ? updatedModel : m)
    })),

    openCreate: () => set({ showCreateModal: true, editingModel: null }),
    openEdit: (model) => set({ showCreateModal: true, editingModel: model }),

    myChats: [],
    activeChatId: null,
    onlineUsers: {},

    setOnlineUser: (userId, statusData) => set((state) => ({
        onlineUsers: { ...state.onlineUsers, [userId]: statusData }
    })),

    setActiveChatId: (id) => set({ activeChatId: id }),

    loadChats: async (userId) => {
        if (!userId) return;
        try {
            const response = await fetch(`${BASE_URL}/chats/${userId}?t=${Date.now()}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            const result = await response.json();
            if (result.success) {
                const loadedChats = result.data.map(chat => {
                    const realPartnerId = chat.participants.find(p => String(p) !== String(userId));
                    return {
                        id: chat.roomId,
                        model: chat.modelProfile || {},
                        partnerId: realPartnerId,
                        messages: chat.messages.map(m => ({
                            id: m._id || Date.now() + Math.random(),
                            text: m.text,
                            time: m.time,
                            type: m.type || 'text',
                            mediaUrl: m.mediaUrl || null,
                            sender: String(m.senderId) === String(userId) ? 'me' : 'partner'
                        })),
                        mutedBy: chat.mutedBy || []
                    };
                });
                set(state => {
                    const newEmptyChat = state.myChats.find(c => c.id === state.activeChatId && c.messages.length === 0);
                    if (newEmptyChat && !loadedChats.find(c => c.id === newEmptyChat.id)) {
                        return { myChats: [newEmptyChat, ...loadedChats] };
                    }
                    return { myChats: loadedChats };
                });
            }
        } catch (error) {
            console.error("❌ Помилка завантаження чатів:", error);
        }
    },

    startPrivateChat: (model) => set((state) => {
        const myId = String(get().userUniqueId);
        // userId може бути об'єктом через populate — беремо _id
        const partnerUserId = String(model.userId?._id || model.userId);

        if (!myId) return { showAuth: true };
        const roomId = [myId, partnerUserId].sort().join('_');
        const exists = state.myChats.find(c => c.id === roomId);

        if (!exists) {
            const newChat = {
                id: roomId,
                model: model,
                partnerId: partnerUserId,
                messages: [],
                mutedBy: []
            };
            return { myChats: [newChat, ...state.myChats], activeChatId: roomId };
        }
        return { activeChatId: roomId };
    }),
}));

// Запускаємо після підключення сокету
if (socket.connected) {
    useStore.getState().setupGlobalSocket();
} else {
    socket.once('connect', () => useStore.getState().setupGlobalSocket());
}

if (savedUserId) {
    useStore.getState().loadChats(savedUserId);
}

export default useStore;