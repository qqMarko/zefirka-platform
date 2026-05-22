import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken'; 
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Dispute from '../models/Dispute.js';
import TopUpRequest from '../models/TopUpRequest.js'; 
import Chat from '../models/Chat.js'; 
import Megaphone from '../models/Megaphone.js'; // 🔥 Підключили модель Рупора
import { getIO, setActivePromo } from '../sockets/socketManager.js';

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

    // ================= КОРИСТУВАЧІ =================
    router.get('/users', async (req, res) => { 
        try { 
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            res.json({ success: true, data: users }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    router.post('/users/:id/toggle-ban', async (req, res) => {
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

    router.post('/users/:id/balance', async (req, res) => {
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
            user.trustPercentage = tScore; // Синхронізація
            await user.save();

            const io = getIO();
            if (io) io.emit(`instant_sync_${user._id}`, { action: 'update_data' });

            res.json({ success: true, balance: user.balance, trustScore: user.trustScore });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // Додавання/віднімання довіри
    router.post('/users/:id/update-trust', async (req, res) => {
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

    // 🟢 НОВИЙ МАРШРУТ: Встановлення точного відсотка довіри (для адмін-панелі)
    router.post('/users/:id/trust', async (req, res) => {
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
            console.error('Помилка при зміні довіри:', error);
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    router.post('/users/:id/shadow-login', async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.json({ success: true, token, userId: user._id, role: user.role, email: user.email });
        } catch (error) { 
            console.error("Shadow login error:", error);
            res.status(500).json({ success: false }); 
        }
    });

    // ================= АНКЕТИ =================
    router.post('/profiles/:id/verify', async (req, res) => { 
        try { 
            const profile = await Profile.findByIdAndUpdate(req.params.id, { vLevel: req.body.vLevel }, { new: true });
            const io = getIO();
            if (io) io.emit('global_sync', { action: 'reload_catalog' });
            res.json({ success: true, profile: profile }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    router.post('/profiles/:id/approve', async (req, res) => {
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
                await sendSmartEmail(user, '🎉 Анкету опубліковано!', `Вітаємо! Вашу анкету <b>"${profile.name}"</b> успішно перевірено модератором і опубліковано в загальному каталозі. Тепер клієнти можуть вас бачити!`);
            }

            res.json({ success: true, profile: { ...profile?.toObject(), isApproved: true } });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // ================= PANOPTICON (ЧАТИ) =================
    router.get('/chats', async (req, res) => {
        try {
            const chats = await Chat.find().sort({ updatedAt: -1 });
            res.json({ success: true, data: chats });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // ================= ФІНАНСИ (ЧЕКИ) =================
    router.get('/topups', async (req, res) => {
        try {
            const requests = await TopUpRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
            res.json({ success: true, data: requests });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/topups/:id/approve', async (req, res) => {
        try {
            const topup = await TopUpRequest.findById(req.params.id);
            if (!topup || topup.status !== 'pending') return res.status(400).json({ success: false });

            const user = await User.findById(topup.userId);
            if (user) {
                user.balance += topup.amount;
                await user.save();
                if(sendNotification) sendNotification(user._id, `💳 Ваш баланс поповнено на ${topup.amount} ₴! Заявка схвалена.`);
                await sendSmartEmail(user, '💳 Поповнення успішне', `Ваш баланс успішно поповнено на <b>${topup.amount} UAH</b>. Кошти вже на вашому рахунку!`);
                
                const io = getIO();
                if (io) io.emit(`instant_sync_${user._id}`, { action: 'update_data' });
            }

            topup.status = 'approved';
            await topup.save();
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/topups/:id/reject', async (req, res) => {
        try {
            const topup = await TopUpRequest.findById(req.params.id);
            if (!topup || topup.status !== 'pending') return res.status(400).json({ success: false });

            topup.status = 'rejected';
            await topup.save();

            const user = await User.findById(topup.userId);
            if (user && sendNotification) {
                sendNotification(user._id, `❌ Ваша заявка на поповнення (${topup.amount} ₴) була відхилена адміністратором. Перевірте квитанцію.`);
            }
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // ================= СПОРИ =================
    router.get('/disputes', async (req, res) => { 
        try { 
            const disputes = await Dispute.find().sort({ createdAt: -1 });
            res.json({ success: true, data: disputes }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    router.post('/disputes/:id/resolve', async (req, res) => { 
        try { 
            await Dispute.findByIdAndDelete(req.params.id); 
            res.json({ success: true }); 
        } catch (error) { res.status(500).json({ success: false }); } 
    });

    // ================= 🔥 РУПОР ЗІ ЗНИЖКАМИ (ВСТАНОВЛЕНО ТУТ) =================
    
    // Отримання стану рупора для фронтенду
    router.get('/megaphone/status', async (req, res) => {
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

    // Оновлення рупора (стара логіка + нова логіка зі знижками)
    router.post('/broadcast', async (req, res) => {
        try {
            // Отримуємо нові змінні (текст, знижки)
            const { text, target, vipDiscountPercent = 0, bumpDiscountPercent = 0, isActive = true } = req.body;
            if (!text) return res.status(400).json({ success: false, message: 'Порожній текст' });

            // 1. Оновлюємо базу даних рупора
            const settings = await Megaphone.findOneAndUpdate(
                {}, 
                { 
                  message: text, 
                  vipDiscountPercent: vipDiscountPercent, 
                  bumpDiscountPercent: bumpDiscountPercent, 
                  isActive: isActive 
                },
                { new: true, upsert: true }
            );

            // 2. Розсилаємо сигнал всім клієнтам на сайті миттєво
            const io = getIO();
            if (io) {
                io.emit('megaphone_update', settings);
            }

            // 3. Стара логіка: розсилка особистих сповіщень конкретній групі юзерів
            setActivePromo({ text, discount: vipDiscountPercent }); // якщо ця функція десь потрібна ще

            let query = {};
            if (target === 'model' || target === 'client') {
                query.role = target;
            }

            const users = await User.find(query);
            let sentCount = 0;

            for (const user of users) {
                if (!user.isBanned && sendNotification) {
                    sendNotification(user._id, `📢 ${text}`);
                    sentCount++;
                }
            }

            res.json({ success: true, count: sentCount, settings });
        } catch (error) { 
            console.error('Broadcast error:', error);
            res.status(500).json({ success: false }); 
        }
    });

    // Очищення рупора
    router.post('/clear-broadcast', async (req, res) => {
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

    // 🗑 ЗНЯТТЯ VIP СТАТУСУ
    router.post('/remove-vip/:userId', async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

            user.vipPackage = 'none';
            user.vipExpiresAt = null;
            await user.save();

            const io = getIO();
            if (io) {
                io.emit(`instant_sync_${user._id}`, { action: 'update_data' });
                io.emit('global_sync', { action: 'reload_catalog' });
            }

            res.json({ success: true, message: 'VIP статус успішно знято!' });
        } catch (error) {
            console.error("🔥 Помилка зняття VIP:", error);
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    return router;
};