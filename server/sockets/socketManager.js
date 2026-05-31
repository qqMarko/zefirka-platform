import Chat from '../models/Chat.js';
import Dispute from '../models/Dispute.js';
import User from '../models/User.js';
import { sendSmartEmail } from '../services/emailService.js';

const onlineUsers = new Map();
const pendingEmails = new Map();

// 🚀 Створюємо змінну для зберігання інстансу сокетів
let ioInstance; 

// 🚀 ГЛОБАЛЬНА ПАМ'ЯТЬ: Зберігає текст рупора та розмір знижки
let activePromo = { text: '', discount: 0 }; 

// Функція для оновлення промо з адмінки
export const setActivePromo = (promo) => {
    activePromo = promo;
    if (ioInstance) ioInstance.emit('global_promo', activePromo);
};

export const initSockets = (io) => {
    ioInstance = io; // 🚀 Зберігаємо io при старті сервера

    io.on('connection', (socket) => {
        console.log(`🔌 Новий сокет: ${socket.id}`);
        
        // Як тільки хтось заходить на сайт - відправляємо йому поточну знижку
        socket.emit('global_promo', activePromo);

        socket.on('user_connected', async (userId) => {
            const idStr = String(userId);
            console.log(`✅ user_connected отримано: userId=${idStr}, socket=${socket.id}`);
            onlineUsers.set(idStr, socket.id);
            io.emit('user_status_change', { userId: idStr, status: 'online' });
            console.log(`📡 user_status_change відправлено для: ${idStr}`);
            socket.emit('sync_online_users', Array.from(onlineUsers.keys()));

            try { await User.findByIdAndUpdate(idStr, { lastActive: new Date() }); }
            catch (e) { console.error('Помилка оновлення lastActive при підключенні:', e.message); }

            if (pendingEmails.has(idStr)) {
                clearTimeout(pendingEmails.get(idStr));
                pendingEmails.delete(idStr);
            }

            // 🔔 СПОВІЩЕННЯ: якщо це МОДЕЛЬ — повідомляємо PRIORITY/CONCIERGE клієнтів
            // які додали цю модель в обране
            try {
                const connectedUser = await User.findById(idStr).select('role').lean();
                if (connectedUser?.role === 'model') {
                    // Шукаємо профіль цієї моделі
                    const Profile = (await import('../models/Profile.js')).default;
                    const modelProfile = await Profile.findOne({ userId: idStr }).select('_id').lean();
                    if (modelProfile) {
                        // Знаходимо PRIORITY/CONCIERGE клієнтів що мають цю модель в обраних
                        const VIP_NOTIFY = ['priority_chat', 'concierge'];
                        const interestedClients = await User.find({
                            role: 'client',
                            vipPackage: { $in: VIP_NOTIFY },
                            vipExpiresAt: { $gt: new Date() },
                            favorites: modelProfile._id
                        }).select('_id').lean();

                        interestedClients.forEach(client => {
                            const clientSocketId = onlineUsers.get(String(client._id));
                            if (clientSocketId) {
                                io.to(clientSocketId).emit('favorite_model_online', {
                                    modelUserId: idStr,
                                    modelProfileId: String(modelProfile._id)
                                });
                            }
                        });
                    }
                }
            } catch (e) { console.error('Помилка сповіщення про онлайн моделі:', e.message); }
        });

        socket.on('user_away', async (userId) => {
            const idStr = String(userId);
            if (onlineUsers.has(idStr)) {
                onlineUsers.delete(idStr);
                const now = new Date();
                io.emit('user_status_change', { userId: idStr, status: 'offline', lastSeen: now });
                
                // 🟢 Фіксуємо AFK/вихід у базу даних
                try {
                    await User.findByIdAndUpdate(idStr, { lastActive: now });
                } catch (e) {
                    console.error('Помилка оновлення lastActive при відході користувача:', e.message);
                }
            }
        });

        socket.on('typing', ({ senderId, receiverId }) => {
            const receiverSocketId = onlineUsers.get(String(receiverId));
            if (receiverSocketId) io.to(receiverSocketId).emit('user_typing', { senderId });
        });

        socket.on('stop_typing', ({ senderId, receiverId }) => {
            const receiverSocketId = onlineUsers.get(String(receiverId));
            if (receiverSocketId) io.to(receiverSocketId).emit('user_stopped_typing', { senderId });
        });

        socket.on('join_room', (roomId) => { socket.join(roomId); });

        // 👁 READ RECEIPTS — партнер відкрив чат, позначаємо повідомлення як прочитані
        socket.on('mark_as_read', async ({ roomId, readerId }) => {
            try {
                const chat = await Chat.findOne({ roomId });
                if (!chat) return;

                // Перевіряємо чи відправник повідомлень має PRIORITY або CONCIERGE
                // (тільки тоді показуємо read receipts)
                const senderId = chat.participants.find(p => String(p) !== String(readerId));
                if (!senderId) return;

                const sender = await User.findById(senderId).select('vipPackage vipExpiresAt').lean();
                const VIP_READ = ['priority_chat', 'concierge'];
                const senderHasReadReceipt = sender && VIP_READ.includes(sender.vipPackage) &&
                    sender.vipExpiresAt && new Date(sender.vipExpiresAt) > new Date();

                if (!senderHasReadReceipt) return;

                const now = new Date();
                let updated = false;
                chat.messages.forEach(msg => {
                    if (String(msg.senderId) === String(senderId) && !msg.readAt) {
                        msg.readAt = now;
                        updated = true;
                    }
                });

                if (updated) {
                    await chat.save();
                    // Повідомляємо відправника що його повідомлення прочитані
                    const senderSocketId = onlineUsers.get(String(senderId));
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('messages_read', {
                            roomId,
                            readAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        });
                    }
                }
            } catch (e) { console.error('Помилка mark_as_read:', e.message); }
        });
        
        socket.on('send_message', async (data) => {
            try {
                // 🚫 Захист від чату з самим собою
                if (String(data.senderId) === String(data.partnerId)) return;
                console.log(`💬 send_message: roomId=${data.roomId}, from=${data.senderId}, to=${data.partnerId}`);
                let chat = await Chat.findOne({ roomId: data.roomId });
                if (!chat) { chat = new Chat({ roomId: data.roomId, participants: [data.senderId, data.partnerId], modelProfile: data.modelProfile, messages: [] }); }

                // 👑 ВИЗНАЧАЄМО VIP-ПРІОРИТЕТ ВІДПРАВНИКА
                // concierge=3, priority_chat=2, premium_client=1, решта=0
                const VIP_PRIORITY_MAP = { concierge: 3, priority_chat: 2, premium_client: 1 };
                let senderPriority = 0;
                try {
                    const senderUser = await User.findById(data.senderId).select('vipPackage vipExpiresAt').lean();
                    if (senderUser && senderUser.vipPackage && senderUser.vipPackage !== 'none') {
                        const isVipActive = senderUser.vipExpiresAt && new Date(senderUser.vipExpiresAt) > new Date();
                        if (isVipActive) {
                            senderPriority = VIP_PRIORITY_MAP[senderUser.vipPackage] || 0;
                        }
                    }
                } catch(e) { console.error('Помилка визначення VIP-пріоритету:', e.message); }

                const newMsg = { senderId: data.senderId, text: data.text, time: data.time, type: data.type || 'text', mediaUrl: data.mediaUrl || null, priority: senderPriority };
                chat.messages.push(newMsg); 
                await chat.save();
                
                socket.to(data.roomId).emit('receive_message', { roomId: data.roomId, message: newMsg });
                
                const partnerIdStr = String(data.partnerId);
                const isMuted = chat.mutedBy && chat.mutedBy.includes(partnerIdStr);
                
                if (!isMuted) {
                    console.log(`📨 emit receive_direct_message_${partnerIdStr}`);
                    io.emit(`receive_direct_message_${partnerIdStr}`, { roomId: data.roomId, message: newMsg });
                    
                    const isOnline = onlineUsers.has(partnerIdStr);
                    if (!isOnline) {
                        if (!pendingEmails.has(partnerIdStr)) {
                            const timer = setTimeout(async () => {
                                if (!onlineUsers.has(partnerIdStr)) {
                                    try {
                                        const receiverUser = await User.findById(partnerIdStr);
                                        const senderName = data.modelProfile && data.modelProfile.name ? data.modelProfile.name : 'Співрозмовник';
                                        await sendSmartEmail(receiverUser, '💬 Нові повідомлення на ZEFIRKA', `У вас є нові непрочитані повідомлення від <b>${senderName}</b>.<br><br>Повертайтесь на платформу, щоб прочитати їх та відповісти!`);
                                    } catch (e) { console.error('Помилка відправки:', e); }
                                }
                                pendingEmails.delete(partnerIdStr);
                            }, 10 * 60 * 1000); 
                            pendingEmails.set(partnerIdStr, timer);
                        }
                    }
                }
            } catch (error) { console.error("🔥 ПОМИЛКА ЧАТУ:", error.message); }
        });

        socket.on('join_dispute', (disputeId) => { socket.join(`dispute_${disputeId}`); });
        
        socket.on('send_dispute_message', async (data) => {
            try {
                const dispute = await Dispute.findById(data.disputeId);
                if (dispute && dispute.status === 'open') {
                    const newMsg = { 
                        senderId: data.senderId, 
                        senderRole: data.senderRole, 
                        text: data.text, 
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        timestamp: Date.now(),
                        image: data.image || null
                    };
                    dispute.messages.push(newMsg); 
                    await dispute.save();
                    io.to(`dispute_${data.disputeId}`).emit('receive_dispute_message', newMsg);
                }
            } catch (error) { console.error("🔥 ПОМИЛКА DISPUTE:", error); }
        });

        socket.on('disconnect', async () => {
            let disconnectedUserId = null;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                const now = new Date();
                io.emit('user_status_change', { userId: disconnectedUserId, status: 'offline', lastSeen: now });
                
                // 🟢 Фіксуємо розрив з'єднання у базі даних
                try {
                    await User.findByIdAndUpdate(disconnectedUserId, { lastActive: now });
                } catch (e) {
                    console.error('Помилка оновлення lastActive при відключенні сокету:', e.message);
                }
            }
        });
    });
};

// 🚀 ЄДИНА ФУНКЦІЯ НА ВЕСЬ ФАЙЛ
export const getIO = () => {
    if (!ioInstance) console.warn("Socket.io ще не ініціалізовано!");
    return ioInstance;
};