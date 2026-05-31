// Чати та онлайн-статуси
export const createChatsSlice = (set, get) => {
    const BASE_URL = '/api';

    return {
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
                const token = localStorage.getItem('zefirka_token');
                const response = await fetch(`${BASE_URL}/chats/${userId}?t=${Date.now()}`, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'Authorization': `Bearer ${token}`
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
                                priority: m.priority || 0,
                                readAt: m.readAt ? new Date(m.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
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
            } catch (error) { console.error("❌ Помилка завантаження чатів:", error); }
        },

        startPrivateChat: (model) => set((state) => {
            const myId = String(get().userUniqueId);
            const partnerUserId = String(model.userId?._id || model.userId);
            if (!myId) return { showAuth: true };
            // 🚫 Не можна писати самому собі (своя ж анкета)
            if (myId === partnerUserId) return {};
            const roomId = [myId, partnerUserId].sort().join('_');
            const exists = state.myChats.find(c => c.id === roomId);
            if (!exists) {
                return {
                    myChats: [{ id: roomId, model, partnerId: partnerUserId, messages: [], mutedBy: [] }, ...state.myChats],
                    activeChatId: roomId
                };
            }
            return { activeChatId: roomId };
        }),
    };
};