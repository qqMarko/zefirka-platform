import express from 'express';
import Chat from '../models/Chat.js';
import { uploadChat } from '../middlewares/upload.js';

export default (bot, ADMIN_ID) => {
    const router = express.Router();

    // 💬 ОТРИМАННЯ ЧАТІВ
    router.get('/chats/:userId', async (req, res) => {
        try {
            const chats = await Chat.find({ participants: req.params.userId }).sort({ updatedAt: -1 });
            res.status(200).json({ success: true, data: chats });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // 🗑 ОЧИЩЕННЯ ТА ВИДАЛЕННЯ ЧАТУ
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

    // 🔕 MUTE ЧАТУ
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

    // 📁 ЗАВАНТАЖЕННЯ МЕДІА В ЧАТ
    router.post('/chat/upload', uploadChat.single('media'), (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, message: 'Файл не знайдено' });
        res.json({ success: true, mediaUrl: `/uploads/chat/${req.file.filename}` });
    });

    // 🆘 ПІДТРИМКА
    router.post('/support/send', async (req, res) => {
        try {
            const { userId, text, userEmail, image } = req.body;
            const messageToAdmin = `🚨 Нове звернення!\n\nID Юзера: [${userId}]\nEmail: ${userEmail || 'Гість'}\n\nПовідомлення:\n${text}`;
            if (image && bot) {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                await bot.sendPhoto(ADMIN_ID, buffer, { caption: messageToAdmin });
            } else if (bot) { 
                await bot.sendMessage(ADMIN_ID, messageToAdmin); 
            }
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    return router;
};