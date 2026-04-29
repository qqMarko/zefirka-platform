import express from 'express';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { uploadChat } from '../middlewares/upload.js';

export default (bot, ADMIN_ID) => {
    const router = express.Router();

    router.get('/chats/:userId', async (req, res) => {
        try {
            const chats = await Chat.find({ participants: req.params.userId }).sort({ updatedAt: -1 });
            res.status(200).json({ success: true, data: chats });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.delete('/chats/:roomId/clear', async (req, res) => {
        try {
            const chat = await Chat.findOne({ roomId: req.params.roomId });
            if (chat) { chat.messages = []; await chat.save(); }
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.delete('/chats/:roomId/delete', async (req, res) => {
        try {
            await Chat.findOneAndDelete({ roomId: req.params.roomId });
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/chats/:roomId/mute', async (req, res) => {
        try {
            const { userId, mute } = req.body;
            const chat = await Chat.findOne({ roomId: req.params.roomId });
            if (chat) {
                if (mute && !chat.mutedBy.includes(userId)) chat.mutedBy.push(userId);
                else if (!mute) chat.mutedBy = chat.mutedBy.filter(id => id !== userId);
                await chat.save();
                res.json({ success: true, mutedBy: chat.mutedBy });
            } else res.status(404).json({ success: false });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/chat/upload', uploadChat.single('media'), (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, message: 'Файл не знайдено' });
        res.json({ success: true, mediaUrl: `/uploads/chat/${req.file.filename}` });
    });

    // 🆘 ПІДТРИМКА: РОЗУМНА МАРШРУТИЗАЦІЯ
    router.post('/support/send', async (req, res) => {
        try {
            const { userId, text, userEmail, image } = req.body;
            
            let priorityTag = '⏳ [Звичайна черга]';
            try {
                const user = await User.findById(userId);
                if (user && ['premium', 'diamond', 'priority', 'concierge'].includes(user.vipPackage)) {
                    priorityTag = '⚡ [VIP Пріоритет]';
                }
            } catch(e) {}

            let messageToAdmin = '';
            let replyMarkup = undefined;

            // 🚀 ПЕРЕВІРЯЄМО: Чи тікет ВЖЕ взятий кимось в роботу?
            if (bot && bot.ticketLocks && bot.ticketLocks.has(userId)) {
                const lock = bot.ticketLocks.get(userId);
                // Формуємо повідомлення без кнопки "Взяти в роботу"
                messageToAdmin = `💬 Доповнення до тікета\nID Юзера: [${userId}]\n(Веде діалог: ${lock.adminName})\n\nПовідомлення:\n${text}`;
            } else {
                // Це повністю нове звернення
                messageToAdmin = `🚨 Нове звернення!\n\n${priorityTag}\nID Юзера: [${userId}]\nEmail: ${userEmail || 'Гість'}\n\nПовідомлення:\n${text}`;
                replyMarkup = {
                    inline_keyboard: [[{ text: "✋ Взяти в роботу", callback_data: `claim_${userId}` }]]
                };
            }

            const sendOptions = replyMarkup ? { reply_markup: replyMarkup } : {};

            if (image && bot) {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                await bot.sendPhoto(ADMIN_ID, buffer, { caption: messageToAdmin, ...sendOptions });
            } else if (bot) { 
                await bot.sendMessage(ADMIN_ID, messageToAdmin, sendOptions); 
            }
            res.json({ success: true });
        } catch (error) { 
            console.error("Помилка відправки в підтримку:", error);
            res.status(500).json({ success: false }); 
        }
    });

    return router;
};