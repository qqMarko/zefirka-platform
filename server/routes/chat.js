import express from 'express';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { uploadChat } from '../middlewares/upload.js';
import authMiddleware from '../middlewares/auth.js';

ffmpeg.setFfmpegPath(ffmpegPath);

export default (bot, ADMIN_ID) => {
    const router = express.Router();

    router.get('/chats/:userId', authMiddleware, async (req, res) => {
        try {
            // 🔒 Юзер може запитувати ТІЛЬКИ свої чати
            if (String(req.user.id) !== String(req.params.userId) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Доступ заборонено' });
            }
            const chats = await Chat.find({ participants: req.params.userId }).sort({ updatedAt: -1 });

            // 👑 Підтягуємо актуальний VIP-пакет кожного партнера для правильного бейджу
            const VIP_PRIORITY_MAP = { concierge: 3, priority_chat: 2, premium_client: 1 };
            const now = new Date();
            const chatsWithPriority = await Promise.all(chats.map(async (chat) => {
                const partnerId = chat.participants.find(p => String(p) !== String(req.params.userId));
                let partnerPriority = 0;
                if (partnerId) {
                    try {
                        const partner = await User.findById(partnerId).select('vipPackage vipExpiresAt').lean();
                        if (partner && partner.vipPackage && partner.vipPackage !== 'none') {
                            const isActive = partner.vipExpiresAt && new Date(partner.vipExpiresAt) > now;
                            if (isActive) partnerPriority = VIP_PRIORITY_MAP[partner.vipPackage] || 0;
                        }
                    } catch(e) { /* не критично */ }
                }
                return { ...chat.toObject(), partnerPriority };
            }));

            res.status(200).json({ success: true, data: chatsWithPriority });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.delete('/chats/:roomId/clear', authMiddleware, async (req, res) => {
        try {
            const chat = await Chat.findOne({ roomId: req.params.roomId });
            if (!chat) return res.status(404).json({ success: false, message: 'Чат не знайдено' });
            // 🔒 Тільки учасник чату може очистити його
            const isParticipant = chat.participants.some(p => String(p) === String(req.user.id));
            if (!isParticipant && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Ви не є учасником цього чату' });
            }
            chat.messages = [];
            await chat.save();
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.delete('/chats/:roomId/delete', authMiddleware, async (req, res) => {
        try {
            const chat = await Chat.findOne({ roomId: req.params.roomId });
            if (!chat) return res.status(404).json({ success: false, message: 'Чат не знайдено' });
            // 🔒 Тільки учасник чату може видалити його
            const isParticipant = chat.participants.some(p => String(p) === String(req.user.id));
            if (!isParticipant && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Ви не є учасником цього чату' });
            }
            await Chat.findOneAndDelete({ roomId: req.params.roomId });
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/chats/:roomId/mute', authMiddleware, async (req, res) => {
        try {
            // 🔒 userId з токена, не з body
            const userId = req.user.id;
            const { mute } = req.body;
            const chat = await Chat.findOne({ roomId: req.params.roomId });
            if (!chat) return res.status(404).json({ success: false });
            // 🔒 Тільки учасник може керувати своїм mute
            const isParticipant = chat.participants.some(p => String(p) === String(userId));
            if (!isParticipant) return res.status(403).json({ success: false, message: 'Ви не є учасником цього чату' });

            if (mute && !chat.mutedBy.includes(userId)) chat.mutedBy.push(userId);
            else if (!mute) chat.mutedBy = chat.mutedBy.filter(id => String(id) !== String(userId));
            await chat.save();
            res.json({ success: true, mutedBy: chat.mutedBy });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/chat/upload', authMiddleware, uploadChat.single('media'), async (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, message: 'Файл не знайдено' });

        // Голосові конвертуємо в mp3 — універсальний формат, грає навіть на старих iPhone
        if ((req.file.mimetype || '').startsWith('audio') || /voice_/i.test(req.file.filename)) {
            const inputPath = req.file.path;
            const mp3Name = req.file.filename.replace(/\.[^.]+$/, '') + '.mp3';
            const outputPath = path.join(path.dirname(inputPath), mp3Name);
            try {
                await new Promise((resolve, reject) => {
                    ffmpeg(inputPath)
                        .toFormat('mp3')
                        .audioCodec('libmp3lame')
                        .audioBitrate('96k')
                        .on('end', resolve)
                        .on('error', reject)
                        .save(outputPath);
                });
                fs.unlink(inputPath, () => {}); // видаляємо оригінал
                return res.json({ success: true, mediaUrl: `/uploads/chat/${mp3Name}` });
            } catch (err) {
                console.error('❌ Помилка конвертації аудіо:', err.message);
                // якщо конвертація не вдалась — віддаємо оригінал
                return res.json({ success: true, mediaUrl: `/uploads/chat/${req.file.filename}` });
            }
        }

        res.json({ success: true, mediaUrl: `/uploads/chat/${req.file.filename}` });
    });

    // 🆘 ПІДТРИМКА: гостьовий доступ дозволено, але якщо є токен — userId беремо з нього
    router.post('/support/send', async (req, res) => {
        try {
            let userId = req.body.userId;
            // Якщо є валідний токен — довіряємо ЙОМУ, а не body (захист від підміни ID)
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const jwt = (await import('jsonwebtoken')).default;
                    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'super_secret_key');
                    userId = decoded.id;
                } catch (e) { /* невалідний токен — лишаємо як гостя */ }
            }
            const { text, userEmail, image } = req.body;
            
            let priorityTag = '⏳ [Звичайна черга]';
            let vipInfo = 'Без VIP';
            let priorityLevel = 0;
            try {
                const user = await User.findById(userId);
                if (user) {
                    const VIP_LEVEL = { concierge: 4, diamond: 4, priority_chat: 3, premium: 3, premium_client: 2, start: 1 };
                    priorityLevel = VIP_LEVEL[user.vipPackage?.toLowerCase()] || 0;
                    vipInfo = user.vipPackage && user.vipPackage !== 'none' ? user.vipPackage.toUpperCase() : 'Без VIP';
                    if (priorityLevel >= 3) priorityTag = '⚡ [VIP Пріоритет]';
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
                messageToAdmin = `🚨 Нове звернення!\n\n${priorityTag}\n👑 VIP: ${vipInfo}  •  🎯 Пріоритет: ${priorityLevel}/4\nID Юзера: [${userId}]\nEmail: ${userEmail || 'Гість'}\n\nПовідомлення:\n${text}`;
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