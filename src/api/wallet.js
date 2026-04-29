import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

export default (io, bot, sendNotification) => {
    const router = express.Router();

    // 🟢 ОТРИМАННЯ БАЛАНСУ ТА ПІДНЯТТІВ
    router.get('/balance/:userId', async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) return res.status(404).json({ success: false });
            
            let tScore = user.trustScore;
            if (tScore === null || tScore === undefined || isNaN(tScore)) { 
                tScore = 100; user.trustScore = 100; await user.save().catch(e => console.log(e)); 
            }
            res.json({ success: true, balance: user.balance || 0, isBanned: user.isBanned || false, trustScore: tScore, freeBumps: user.freeBumps || 0 });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    // 🟢 ПОКУПКА VIP ТА ПІДНЯТТЯ
    router.post('/buy-vip', async (req, res) => {
        try {
            const { userId, amount, packageId } = req.body;
            const user = await User.findById(userId);
            if (!user || user.balance < amount) return res.status(400).json({ success: false, message: 'Недостатньо коштів' });

            user.balance -= amount;
            const now = new Date();
            let notifText = '';

            if (user.role === 'model') { 
                if (packageId === 'bump') {
                    // 🚀 Одноразове підняття за 150 грн
                    const bumpExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
                    await Profile.updateMany(
                        { userId: user._id }, 
                        { $set: { bumpedAt: now, bumpExpiresAt: bumpExpire } }
                    ); 
                    notifText = `🚀 Вашу анкету успішно піднято в ТОП на 24 години!`;
                } else {
                    // 💎 Покупка VIP пакетів (оновлені ліміти: 7, 15, 25)
                    let vLevel = 0; let vipName = ''; let bonusBumps = 0;
                    
                    if (packageId === 'diamond' || packageId === 'vip_3' || amount === 7500) { vLevel = 3; vipName = 'Діамант'; bonusBumps = 25; }
                    else if (packageId === 'premium' || packageId === 'vip_2' || amount === 4000) { vLevel = 2; vipName = 'Золото'; bonusBumps = 15; }
                    else if (packageId === 'start' || packageId === 'vip_1' || amount === 2000) { vLevel = 1; vipName = 'Срібло'; bonusBumps = 7; }

                    const vipExpire = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
                    await Profile.updateMany(
                        { userId: user._id }, 
                        { $set: { vLevel: vLevel, vipExpiresAt: vipExpire } }
                    ); 
                    // Додаємо бонусні підняття за VIP
                    user.freeBumps += bonusBumps;
                    notifText = `💎 Ви придбали статус "${vipName}"! Вам нараховано ${bonusBumps} безкоштовних ручних підняттів.`;
                }
            }
            
            if (notifText && user.pushEnabled !== false) {
                const newNotif = { text: notifText, isRead: false, date: now };
                user.notifications.push(newNotif);
                io.emit(`new_notification_${userId}`, newNotif);
            }

            await user.save();
            res.json({ success: true, balance: user.balance, freeBumps: user.freeBumps });
        } catch (error) { 
            console.error('🔥 КРИТИЧНА ПОМИЛКА BUY-VIP:', error); 
            res.status(500).json({ success: false, message: 'Помилка сервера' }); 
        }
    });

    // 🟢 ВИКОРИСТАННЯ РУЧНОГО ПІДНЯТТЯ (Кнопка з кабінету)
    router.post('/use-free-bump', async (req, res) => {
        try {
            const { userId } = req.body;
            const user = await User.findById(userId);
            
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
            if (user.freeBumps <= 0) return res.status(400).json({ success: false, message: 'У вас немає безкоштовних підняттів' });

            // Віднімаємо 1 підняття
            user.freeBumps -= 1;
            await user.save();

            // Оновлюємо час в анкеті
            const now = new Date();
            const bumpExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
            
            await Profile.updateMany(
                { userId: user._id }, 
                { $set: { bumpedAt: now, bumpExpiresAt: bumpExpire } }
            );

            sendNotification(user._id, `🚀 Ви успішно використали ручне підняття! Анкету виведено в ТОП. Залишилось: ${user.freeBumps} шт.`);

            res.json({ success: true, freeBumps: user.freeBumps, message: 'Анкету успішно піднято в ТОП!' });
        } catch (error) {
            console.error("Bump error:", error);
            res.status(500).json({ success: false });
        }
    });

    // 🟢 ПОПОВНЕННЯ (ТГ БОТ)
    router.post('/topup-request', async (req, res) => {
        try {
            const { userId, amount, method, currencyEq, receiptImage, txHash } = req.body;
            const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

            if (!TELEGRAM_TOKEN || !ADMIN_ID || !bot) return res.status(500).json({ success: false, message: "Telegram bot is not configured" });

            const caption = `💰 НОВЕ ПОПОВНЕННЯ!\n\nЮзер ID: ${userId}\nСума: ${amount} ₴ (~$${currencyEq} USD)\nМетод: ${method}\nХеш / Квитанція: ${txHash || 'Не вказано (див. фото)'}\n\nОберіть дію:`;
            
            const options = { reply_markup: { inline_keyboard: [ [{ text: '✅ Підтвердити нарахування', callback_data: `pay_approve_${userId}_${amount}` }], [{ text: '❌ Відхилити чек', callback_data: `pay_reject_${userId}_${amount}` }] ] } };

            const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            await bot.sendPhoto(ADMIN_ID, buffer, { caption, ...options });
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    return router;
};