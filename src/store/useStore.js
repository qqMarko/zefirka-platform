import { create } from 'zustand';
import io from 'socket.io-client';
import { createAuthSlice } from './slices/authSlice';
import { createNotificationsSlice } from './slices/notificationsSlice';
import { createCatalogSlice } from './slices/catalogSlice';
import { createChatsSlice } from './slices/chatsSlice';
import { createSocketSlice } from './slices/socketSlice';

// WebSocket
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

const useStore = create((set, get) => ({
    // ── Початковий стан ──
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
    currentLang: 'UA',

    // ── Slices ──
    ...createAuthSlice(socket, set, get),
    ...createNotificationsSlice(set, get),
    ...createCatalogSlice(set, get),
    ...createChatsSlice(set, get),
    ...createSocketSlice(socket, set, get),
}));

// Ініціалізація після завантаження
if (socket.connected) useStore.getState().setupGlobalSocket();
else socket.once('connect', () => useStore.getState().setupGlobalSocket());

if (savedUserId) useStore.getState().loadChats(savedUserId);

export default useStore;