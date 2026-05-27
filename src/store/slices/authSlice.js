// Auth, balance, user — основний стан
export const createAuthSlice = (socket, set, get) => {
    const BASE_URL = '/api';

    return {
        setBalance: (amount) => set({ balance: amount }),
        setUser: (userData) => set({ user: { ...get().user, ...userData } }),

        hasDisputeAccess: () => {
            const { user } = get();
            const allowedPackages = ['premium', 'diamond', 'premium_client', 'priority_chat', 'concierge'];
            return allowedPackages.includes(user.vipPackage?.toLowerCase());
        },

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
            } catch (err) { console.error("Помилка балансу", err); }
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

            if (socket.connected) get().setupGlobalSocket();
            else socket.once('connect', () => get().setupGlobalSocket());
            get().loadChats(id);
        },

        logout: () => {
            ['zefirka_token','zefirka_userId','zefirka_role','zefirka_email','zefirka_banned_device','zefirka_2fa','zefirka_emailNotif']
                .forEach(k => localStorage.removeItem(k));

            set({
                isLoggedIn: false, userUniqueId: '', userRole: 'model', email: '', token: null,
                myChats: [], activeChatId: null, balance: 0, isBannedStatus: false, trustScore: 100,
                notifications: [], unreadNotifs: 0, user: { freeBumps: 0, vipPackage: 'none', vipExpiresAt: null }
            });
        },

        setRole: (role) => set({ userRole: role }),
        setLang: (lang) => set({ currentLang: lang }),

        showAuth: false, setShowAuth: (show) => set({ showAuth: show }),
        showCreateModal: false, setShowCreateModal: (show) => set({ showCreateModal: show }),
        showWalletModal: false, setShowWalletModal: (show) => set({ showWalletModal: show }),
        showVipModal: false, setShowVipModal: (show) => set({ showVipModal: show }),
    };
};