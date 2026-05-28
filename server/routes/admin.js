import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken'; 
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Dispute from '../models/Dispute.js';
import TopUpRequest from '../models/TopUpRequest.js'; 
import Chat from '../models/Chat.js'; 
import Megaphone from '../models/Megaphone.js';
import { getIO, setActivePromo } from '../sockets/socketManager.js';
import adminMiddleware from '../middlewares/admin.js'; // 🔒 НОВИЙ ІМПОРТ

const getTransporter = () => nodemailer.createTransport({ 
    service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
});

const sendSmartEmail = async (user, subject, textContent) => {
    if (user && user.emailNotifications && user.email) {
        try {
            const html = `
                <div style="background-color:#0a0a0f; color:#ffffff; padding:30px; border-radius:16px; font-family:sans-serif; border: 1px solid #00ffff; max-width: 500px; margin: 0 auto;">
                    <h2 style="color:#00ffff; text-align:center; margin-top:0;">ZEFIRKA PLATFORM</h2>
                    <p style="font-size:16px; line-height:1.6; color:#d4d4d8;">${textContent}</p>
                    <hr style="border-color:#27272a; margin: 20px 0;">
                    <p style="font-size:12px; color:#71717a; text-align:center;">Ви можете вимкнути ці сповіщення в налаштуваннях профілю.</p>
                </div>
            `;
            await getTransporter().sendMail({ from: process.env.EMAIL_USER, to: user.email, subject, html });
        } catch (error) { console.error('Помилка відправки листа:', error); }
    }
};

export default (sendNotification) => {
    const router = express.Router();

    // 🔒 ВСІ МАРШРУТИ НИЖЧЕ ЗАХИЩЕНІ adminMiddleware
    // Тобто запит пройде далі тільки якщо в заголовку є токен адміністратора

    // ================= КОРИСТУВАЧІ =================
    router.get('/users', adminMiddleware, async (req, res) => { 
        try { 
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            res.json({ success: true, data: users }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    router.post('/users/:id/toggle-ban', adminMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
            
            user.isBanned = !user.isBanned; 
            await user.save();
            
            const io = getIO();
            if (io) io.emit(`instant_sync_${user._id}`, { action: user.isBanned ? 'ban' : 'unban' });

            if (user.isBanned) { 
                await Profile.deleteMany({ userId: user._id });
                if (io) io.emit('global_sync', { action: 'reload_catalog' });
                if(sendNotification) sendNotification(user._id, `🛑 Ваш акаунт було заблоковано адміністратором.`); 
                await sendSmartEmail(user, '🛑 Акаунт заблоковано', 'Ваш акаунт на платформі ZEFIRKA було заблоковано адміністратором за порушення правил. Усі ваші анкети видалено з каталогу.');
            }
            res.json({ success: true, isBanned: user.isBanned });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/users/:id/balance', adminMiddleware, async (req, res) => {
        try {
            const { amount } = req.body;
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false });
            
            user.balance += amount;
            let tScore = user.trustScore;
            if (tScore === null || tScore === undefined || isNaN(tScore)) tScore = 100;
            
            if (amount < 0) {
                tScore = Math.max(0, tScore - 20);
                if(sendNotification) sendNotification(user._id, `💸 Адміністратор виписав вам штраф: ${amount} UAH. Ваш рейтинг довіри знижено.`);
                await sendSmartEmail(user, '💸 Штраф та зниження рейтингу', `Адміністратор виписав вам штраф у розмірі <b>${Math.abs(amount)} UAH</b>. Ваш рейтинг довіри також було знижено.`);
            } else {
                if(sendNotification) sendNotification(user._id, `💳 Ваш баланс успішно поповнено на ${amount} UAH!`);
                await sendSmartEmail(user, '💳 Поповнення балансу', `Ваш баланс на платформі успішно поповнено на <b>${amount} UAH</b> адміністратором. Бажаємо приємного користування!`);
            }
            
            user.trustScore = tScore;
            user.trustPercentage = tScore;
            await user.save();

            const io = getIO();
            if (io) io.emit(`instant_sync_${user._id}`, { action: 'update_data' });

            res.json({ success: true, balance: user.balance, trustScore: user.trustScore });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/users/:id/update-trust', adminMiddleware, async (req, res) => {
        try {
            const { score } = req.body;
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            const newScore = Math.max(0, Math.min(100, (user.trustScore || 100) + Number(score)));
            user.trustScore = newScore;
            user.trustPercentage = newScore;
            await user.save();

            const io = getIO();
            if (io) io.emit(`instant_sync_${user._id}`, { action: 'update_data' });

            res.json({ success: true, trustScore: user.trustScore });
        } catch (err) { res.status(500).json({ success: false }); }
    });

    router.post('/users/:id/trust', adminMiddleware, async (req, res) => {
        try {
            const { trustScore } = req.body;
            const score = Number(trustScore);

            if (isNaN(score) || score < 0 || score > 100) {
                return res.status(400).json({ success: false, message: 'Відсоток довіри має бути від 0 до 100' });
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { trustScore: score, trustPercentage: score },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
            }

            const io = getIO();
            if (io) io.emit(`instant_sync_${updatedUser._id}`, { action: 'update_data' });

            res.json({ success: true, message: 'Успішно оновлено', user: updatedUser });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    router.post('/users/:id/shadow-login', adminMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.json({ success: true, token, userId: user._id, role: user.role, email: user.email });
        } catch (error) { 
            res.status(500).json({ success: false }); 
        }
    });

    // ================= АНКЕТИ =================
    router.post('/profiles/:id/verify', adminMiddleware, async (req, res) => { 
        try { 
            const profile = await Profile.findByIdAndUpdate(req.params.id, { vLevel: req.body.vLevel }, { new: true });
            const io = getIO();
            if (io) io.emit('global_sync', { action: 'reload_catalog' });
            res.json({ success: true, profile: profile }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    // ✅ ВСТАНОВИТИ ВЕРИФІКАЦІЮ (photo / video / none) — окремо від VIP
    router.post('/profiles/:id/set-verification', adminMiddleware, async (req, res) => {
        try {
            const { verification } = req.body; // 'photo' | 'video' | 'none'
            if (!['photo', 'video', 'none'].includes(verification)) {
                return res.status(400).json({ success: false, message: 'Невірний тип верифікації' });
            }
            const profile = await Profile.findByIdAndUpdate(
                req.params.id,
                { verification, verifiedAt: verification === 'none' ? null : new Date() },
                { new: true }
            );
            if (!profile) return res.status(404).json({ success: false });

            const io = getIO();
            if (io) io.emit('global_sync', { action: 'reload_catalog' });

            if (verification !== 'none' && sendNotification) {
                const label = verification === 'video' ? 'Відео (золота)' : 'Фото (срібна)';
                sendNotification(profile.userId, `✅ Вашу анкету "${profile.name}" верифіковано! Тип: ${label} галочка.`);
            }
            res.json({ success: true, profile });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/profiles/:id/approve', adminMiddleware, async (req, res) => {
        try {
            await mongoose.connection.collection('profiles').updateOne(
                { _id: new mongoose.Types.ObjectId(req.params.id) },
                { $set: { isApproved: true } }
            );

            const profile = await Profile.findById(req.params.id);
            const io = getIO();
            if (io) io.emit('global_sync', { action: 'reload_catalog' });

            if (profile) {
                if(sendNotification) sendNotification(profile.userId, `✅ Вашу анкету "${profile.name}" схвалено модератором і опубліковано в каталозі!`);
                const user = await User.findById(profile.userId);
                await sendSmartEmail(user, '🎉 Анкету опубліковано!', `Вітаємо! Вашу анкету <b>"${profile.name}"</b> успішно перевірено модератором і опубліковано в загальному каталозі.`);
            }

            res.json({ success: true, profile: { ...profile?.toObject(), isApproved: true } });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // ================= ЧАТИ =================
    router.get('/chats', adminMiddleware, async (req, res) => {
        try {
            const chats = await Chat.find().sort({ updatedAt: -1 });
            res.json({ success: true, data: chats });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // ================= ФІНАНСИ =================
    router.get('/topups', adminMiddleware, async (req, res) => {
        try {
            const requests = await TopUpRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
            res.json({ success: true, data: requests });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/topups/:id/approve', adminMiddleware, async (req, res) => {
        try {
            const topup = await TopUpRequest.findById(req.params.id);
            if (!topup || topup.status !== 'pending') return res.status(400).json({ success: false });

            const user = await User.findById(topup.userId);
            if (user) {
                user.balance += topup.amount;
                await user.save();
                if(sendNotification) sendNotification(user._id, `💳 Ваш баланс поповнено на ${topup.amount} ₴! Заявка схвалена.`);
                await sendSmartEmail(user, '💳 Поповнення успішне', `Ваш баланс успішно поповнено на <b>${topup.amount} UAH</b>.`);
                
                const io = getIO();
                if (io) io.emit(`instant_sync_${user._id}`, { action: 'update_data' });
            }

            topup.status = 'approved';
            await topup.save();
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/topups/:id/reject', adminMiddleware, async (req, res) => {
        try {
            const topup = await TopUpRequest.findById(req.params.id);
            if (!topup || topup.status !== 'pending') return res.status(400).json({ success: false });

            topup.status = 'rejected';
            await topup.save();

            const user = await User.findById(topup.userId);
            if (user && sendNotification) {
                sendNotification(user._id, `❌ Ваша заявка на поповнення (${topup.amount} ₴) була відхилена адміністратором.`);
            }
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // ================= СПОРИ =================
    router.get('/disputes', adminMiddleware, async (req, res) => { 
        try { 
            const disputes = await Dispute.find().sort({ createdAt: -1 });
            res.json({ success: true, data: disputes }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    router.post('/disputes/:id/resolve', adminMiddleware, async (req, res) => { 
        try { 
            await Dispute.findByIdAndDelete(req.params.id); 
            res.json({ success: true }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    router.delete('/disputes/:id', adminMiddleware, async (req, res) => {
        try {
            const dispute = await Dispute.findByIdAndDelete(req.params.id);
            if (!dispute) return res.status(404).json({ success: false, message: 'Спір не знайдено' });
            res.json({ success: true, message: 'Спір успішно видалено' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    // ================= РУПОР =================
    router.get('/megaphone/status', async (req, res) => {
        // Цей маршрут PUBLIC — фронтенд читає статус рупора без логіну (щоб показати банер)
        try {
            let settings = await Megaphone.findOne({});
            if (!settings) {
                settings = { message: '', vipDiscountPercent: 0, bumpDiscountPercent: 0, isActive: false };
            }
            res.status(200).json({ success: true, settings });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    // Підтримка старого URL для зворотної сумісності
    router.post('/broadcast', adminMiddleware, async (req, res, next) => {
        req.url = '/megaphone/broadcast';
        next('route');
    });

    router.post('/megaphone/broadcast', adminMiddleware, async (req, res) => {
        try {
            const { 
                message, text, target, 
                vipDiscountPercent = 0, bumpDiscountPercent = 0, 
                activeVipPackages = [], isActive = true 
            } = req.body;
            const broadcastText = message || text || '';
            if (!broadcastText && isActive) return res.status(400).json({ success: false, message: 'Порожній текст' });

            const settings = await Megaphone.findOneAndUpdate(
                {}, 
                { message: broadcastText, vipDiscountPercent, bumpDiscountPercent, activeVipPackages, isActive },
                { new: true, upsert: true }
            );

            const io = getIO();
            if (io) io.emit('megaphone_update', settings);

            setActivePromo({ text: broadcastText, discount: vipDiscountPercent });

            let query = {};
            if (target === 'model' || target === 'client') query.role = target;

            const users = await User.find(query);
            let sentCount = 0;
            for (const user of users) {
                if (!user.isBanned && sendNotification) {
                    sendNotification(user._id, `📢 ${broadcastText}`);
                    sentCount++;
                }
            }

            res.json({ success: true, count: sentCount, settings });
        } catch (error) { 
            res.status(500).json({ success: false }); 
        }
    });

    router.post('/megaphone/toggle', adminMiddleware, async (req, res) => {
        try {
            const { isActive } = req.body;
            const settings = await Megaphone.findOneAndUpdate(
                {},
                { isActive: !!isActive },
                { new: true, upsert: true }
            );
            const io = getIO();
            if (io) io.emit('megaphone_update', settings);
            if (!isActive) setActivePromo({ text: '', discount: 0 });
            res.json({ success: true, isActive: settings.isActive });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    router.post('/clear-broadcast', adminMiddleware, async (req, res) => {
        try {
            setActivePromo({ text: '', discount: 0 });
            
            const settings = await Megaphone.findOneAndUpdate(
                {}, 
                { message: '', vipDiscountPercent: 0, bumpDiscountPercent: 0, isActive: false },
                { new: true, upsert: true }
            );

            const io = getIO();
            if (io) io.emit('megaphone_update', settings);

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    });

    // ✅ ВЕРИФІКАЦІЯ ВСІХ АНКЕТ ЮЗЕРА
    router.post('/users/:id/set-verification-all', adminMiddleware, async (req, res) => {
        try {
            const { verification } = req.body;
            if (!['photo','video','none'].includes(verification)) return res.status(400).json({ success: false, message: 'Невірний тип' });
            const result = await Profile.updateMany(
                { userId: req.params.id },
                { verification, verifiedAt: verification === 'none' ? null : new Date() }
            );
            const io = getIO();
            if (io) io.emit('global_sync', { action: 'reload_catalog' });
            res.json({ success: true, modified: result.modifiedCount });
        } catch (error) { res.status(500).json({ success: false, message: 'Помилка сервера' }); }
    });

    // 👑 ВИДАТИ VIP
    router.post('/grant-vip/:userId', adminMiddleware, async (req, res) => {
        try {
            const { packageId } = req.body;
            const MODEL_LEVEL = { start: 1, premium: 2, diamond: 3 };
            const valid = ['start','premium','diamond','premium_client','priority_chat','concierge'];
            if (!valid.includes(packageId)) return res.status(400).json({ success: false, message: 'Невідомий пакет' });

            const user = await User.findById(req.params.userId);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            user.vipPackage = packageId;
            user.vipPurchasedAt = new Date();
            user.vipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await user.save();

            if (MODEL_LEVEL[packageId]) {
                await Profile.updateMany({ userId: user._id }, { $set: { vLevel: MODEL_LEVEL[packageId], vipExpiresAt: user.vipExpiresAt } });
            }

            const io = getIO();
            if (io) {
                io.emit(`instant_sync_${user._id}`, { action: 'update_data' });
                io.emit('global_sync', { action: 'reload_catalog' });
            }
            res.json({ success: true, vipPackage: user.vipPackage });
        } catch (error) { res.status(500).json({ success: false, message: 'Помилка сервера' }); }
    });

    router.post('/remove-vip/:userId', adminMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            user.vipPackage = 'none';
            user.vipExpiresAt = null;
            user.vipPurchasedAt = null;
            user.upgradeDiscount = { forPackage: null, discountPercent: 0, expiresAt: null };
            await user.save();

            // 🔥 СКИДАЄМО vLevel НА ВСІХ АНКЕТАХ ЮЗЕРА
            await Profile.updateMany(
                { userId: user._id },
                { $set: { vLevel: 0, vipExpiresAt: null } }
            );

            const io = getIO();
            if (io) {
                io.emit(`instant_sync_${user._id}`, { action: 'update_data' });
                io.emit('global_sync', { action: 'reload_catalog' });
            }

            res.json({ success: true, message: 'VIP статус успішно знято!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    return router;
};