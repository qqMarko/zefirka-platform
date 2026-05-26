import express from 'express';
import Dispute from '../models/Dispute.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { uploadDispute } from '../middlewares/upload.js';

export default (io, sendNotification) => {
    const router = express.Router();

    // ⚖️ СТВОРЕННЯ СКАРГИ
    router.post('/disputes', uploadDispute.array('screenshots', 5), async (req, res) => {
        try {
            const rawId = req.body.accusedId || "";
            const match = rawId.match(/[0-9a-fA-F]{24}/);
            if (!match) return res.status(400).json({ success: false, message: 'Невірний формат ID' });
            
            let targetUserId = match[0];
            const profile = await Profile.findById(targetUserId).catch(() => null);
            if (profile) targetUserId = String(profile.userId);

            const screenshotPaths = req.files ? req.files.map(file => `/uploads/disputes/${file.filename}`) : [];

            const newDispute = new Dispute({ 
                initiatorId: req.body.initiatorId, 
                accusedId: targetUserId, 
                accusedName: req.body.accusedName, 
                reason: req.body.reason,
                screenshots: screenshotPaths,
                messages: [{ 
                    senderId: req.body.initiatorId, 
                    senderRole: 'user', 
                    text: req.body.reason, 
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                }] 
            });
            const savedDispute = await newDispute.save();
            
            io.emit(`new_dispute_${targetUserId}`, savedDispute);
            if (typeof sendNotification === 'function') {
                sendNotification(targetUserId, `⚖️ На вас відкрито скаргу в Арбітражі! Причина: ${req.body.reason}`);
            }
            
            res.status(201).json({ success: true, dispute: savedDispute });
        } catch (error) { 
            console.error("🔥 ПОМИЛКА АРБІТРАЖУ:", error);
            res.status(500).json({ success: false, message: 'Помилка сервера при створенні скарги' }); 
        }
    });

    // 📋 ОТРИМАННЯ СКАРГ ЮЗЕРА
    router.get('/disputes/user/:userId', async (req, res) => { 
        try { 
            const disputes = await Dispute.find({ $or: [{ initiatorId: req.params.userId }, { accusedId: req.params.userId }] }).sort({ updatedAt: -1 });
            res.json({ success: true, data: disputes }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    // 👑 АДМІНСЬКІ СКАРГИ
    router.get('/admin/disputes', async (req, res) => {
        try {
            const disputes = await Dispute.find({ status: 'open' }).lean();
            const priorityMap = { 'diamond': 3, 'concierge': 3, 'premium': 2, 'priority': 2, 'guest': 1, 'start': 1, 'basic': 0 };

            const disputesWithPriority = await Promise.all(disputes.map(async (d) => {
                // Виправлено: шукаємо по _id, не по userId (такого поля немає в схемі)
                const initiator = await User.findById(d.initiatorId).catch(() => null);
                const pkg = (initiator?.vipPackage || 'basic').toLowerCase();
                return { ...d, initiatorPackage: pkg, priority: priorityMap[pkg] || 0 };
            }));

            const sortedDisputes = disputesWithPriority.sort((a, b) => {
                if (b.priority !== a.priority) return b.priority - a.priority;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            res.json({ success: true, data: sortedDisputes });
        } catch (err) {
            console.error("Помилка завантаження скарг для адміна:", err);
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    // 🔍 ПЕРЕВІРКА АКТИВНОЇ СКАРГИ
    router.get('/disputes/check-active/:userId', async (req, res) => {
        try {
            const activeDispute = await Dispute.findOne({ accusedId: req.params.userId, status: 'open' });
            if (activeDispute) res.json({ active: true, dispute: activeDispute });
            else res.json({ active: false });
        } catch (error) {
            res.status(500).json({ active: false, message: 'Помилка перевірки' });
        }
    });

    router.post('/disputes/:id/resolve', async (req, res) => {
        try {
            // Гарантуємо наявність тексту вироку
            const finalVerdict = req.body.verdict || 'Спір вирішено адміністрацією.';

            const dispute = await Dispute.findByIdAndUpdate(
                req.params.id, 
                { status: 'closed', verdict: finalVerdict },
                { new: true, runValidators: false } 
            );
            
            if (!dispute) return res.status(404).json({success: false});
            
            // 🔥 Передаємо текст вироку в сокети
            if (io) io.to(`dispute_${dispute._id}`).emit('dispute_closed', { 
                id: dispute._id, 
                verdict: finalVerdict 
            });
            
            // 🔥 Використовуємо finalVerdict для пуш-сповіщень (щоб уникнути undefined)
            try {
                if (typeof sendNotification === 'function') {
                    sendNotification(dispute.initiatorId, `⚖️ Спір закрито. Вирок: ${finalVerdict}`);
                    sendNotification(dispute.accusedId, `⚖️ Спір закрито. Вирок: ${finalVerdict}`);
                }
            } catch (err) { console.error("Notification Error:", err); }

            res.json({ success: true, dispute });
        } catch (e) { 
            console.error(e);
            res.status(500).json({success:false}); 
        }
    });

    return router;
};