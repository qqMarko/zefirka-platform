import Chat from '../models/Chat.js';
import Dispute from '../models/Dispute.js';
import User from '../models/User.js';
import { sendSmartEmail } from '../services/emailService.js';

const onlineUsers = new Map();
const pendingEmails = new Map();

export const initSockets = (io) => {
    io.on('connection', (socket) => {
        
        socket.on('user_connected', (userId) => {
            const idStr = String(userId);
            onlineUsers.set(idStr, socket.id);
            io.emit('user_status_change', { userId: idStr, status: 'online' });
            socket.emit('sync_online_users', Array.from(onlineUsers.keys()));

            if (pendingEmails.has(idStr)) {
                clearTimeout(pendingEmails.get(idStr));
                pendingEmails.delete(idStr);
                console.log(`🛑 [EMAIL] Юзер ${idStr} зайшов на сайт. Відправку листа скасовано.`);
            }
        });

        socket.on('user_away', (userId) => {
            if (onlineUsers.has(String(userId))) {
                onlineUsers.delete(String(userId));
                io.emit('user_status_change', { userId: String(userId), status: 'offline', lastSeen: new Date() });
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
        
        socket.on('send_message', async (data) => {
            try {
                let chat = await Chat.findOne({ roomId: data.roomId });
                if (!chat) { chat = new Chat({ roomId: data.roomId, participants: [data.senderId, data.partnerId], modelProfile: data.modelProfile, messages: [] }); }
                const newMsg = { senderId: data.senderId, text: data.text, time: data.time, type: data.type || 'text', mediaUrl: data.mediaUrl || null};
                chat.messages.push(newMsg); 
                await chat.save();
                
                socket.to(data.roomId).emit('receive_message', { roomId: data.roomId, message: newMsg });
                
                const partnerIdStr = String(data.partnerId);
                const isMuted = chat.mutedBy && chat.mutedBy.includes(partnerIdStr);
                
                if (!isMuted) {
                    io.emit(`receive_direct_message_${partnerIdStr}`, { roomId: data.roomId, message: newMsg });
                    
                    const isOnline = onlineUsers.has(partnerIdStr);
                    if (!isOnline) {
                        if (!pendingEmails.has(partnerIdStr)) {
                            console.log(`⏱️ [EMAIL] Юзер ${partnerIdStr} офлайн. Запускаємо таймер...`);
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
                        timestamp: Date.now(), // 🚀 ДОДАНО ТОЧНИЙ ЧАС ДЛЯ ТАЙМЕРА
                        image: data.image || null // 🚀 ДОДАНО ПІДТРИМКУ ФОТО
                    };
                    dispute.messages.push(newMsg); 
                    await dispute.save();
                    io.to(`dispute_${data.disputeId}`).emit('receive_dispute_message', newMsg);
                }
            } catch (error) { console.error("🔥 ПОМИЛКА DISPUTE:", error); }
        });

        socket.on('disconnect', () => {
            let disconnectedUserId = null;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                io.emit('user_status_change', { userId: disconnectedUserId, status: 'offline', lastSeen: new Date() });
            }
        });
    });
};