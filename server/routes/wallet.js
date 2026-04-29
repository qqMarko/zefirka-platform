import express from 'express';
import nodemailer from 'nodemailer'; 
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import TopUpRequest from '../models/TopUpRequest.js'; 
import { getIO } from '../sockets/socketManager.js'; // 🚀

const getTransporter = () => nodemailer.createTransport({ 
    service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
});

const sendSmartEmail = async (user, subject, textContent) => {
    if (user && user.emailNotifications && user.email) {
        try {
            const html = `
                <div style="background-color:#0a0a0f; color:#ffffff; padding:30px; border-radius:16px; font-family:sans-serif; border: 1px solid #ffd700; max-width: 500px; margin: 0 auto;">
                    <h2 style="color:#ffd700; text-align:center; margin-top:0;">ZEFIRKA FINANCE</h2>
                    <p style="font-size:16px; line-height:1.6; color:#d4d4d8;">${textContent}</p>
                    <hr style="border-color:#27272a; margin: 20px 0;">
                    <p style="font-size:12px; color:#71717a; text-align:center;">Ви можете вимкнути ці сповіщення в налаштуваннях профілю.</p>
                </div>
            `;
            await getTransporter().sendMail({ from: process.env.EMAIL_USER, to: user.email, subject, html });
        } catch (error) { console.error('Помилка відправки листа:', error); }
    }
};

export default (io, bot, sendNotification) => {
    const router = express.Router();

    router.get('/balance/:userId', async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) return res.status(404).json({ success: false });
            
            let tScore = user.trustScore;
            if (tScore === null || tScore === undefined || isNaN(tScore)) { 
                tScore = 100; user.trustScore = 100; await user.save().catch(e => console.log(e)); 
            }
            res.json({ 
                success: true, 
                balance: user.balance || 0, 
                isBanned: user.isBanned || false, 
                trustScore: tScore, 
                freeBumps: user.freeBumps || 0,
                vipPackage: user.vipPackage || 'none',      
                vipExpiresAt: user.vipExpiresAt || null     
            });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    router.post('/buy-vip', async (req, res) => {
        try {
            const { userId, amount, packageId } = req.body;
            const user = await User.findById(userId);
            if (!user || user.balance < amount) return res.status(400).json({ success: false, message: 'Недостатньо коштів' });

            user.balance -= amount;
            
            const now = new Date();
            const vipExpire = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
            
            let notifText = '';
            let emailText = '';

            if (user.role === 'model') { 
                if (packageId === 'bump') {
                    const bumpExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
                    await Profile.updateMany({ userId: user._id }, { $set: { bumpedAt: now, bumpExpiresAt: bumpExpire } }); 
                    notifText = `🚀 Вашу анкету успішно піднято в ТОП на 24 години!`;
                    emailText = `Ви успішно придбали <b>Разове підняття в ТОП</b> за ${amount} UAH. Ваша анкета буде знаходитись на перших позиціях рівно 24 години! 🚀`;
                } else {
                    let vLevel = 0; let vipName = ''; let bonusBumps = 0;
                    
                    if (packageId === 'diamond' || packageId === 'vip_3' || amount === 7500) { vLevel = 3; vipName = 'DIAMOND'; bonusBumps = 25; }
                    else if (packageId === 'premium' || packageId === 'vip_2' || amount === 4000) { vLevel = 2; vipName = 'PREMIUM'; bonusBumps = 10; }
                    else if (packageId === 'start' || packageId === 'vip_1' || amount === 2000) { vLevel = 1; vipName = 'START'; bonusBumps = 5; }

                    await Profile.updateMany({ userId: user._id }, { $set: { vLevel: vLevel, vipExpiresAt: vipExpire } }); 
                    
                    user.vipPackage = packageId;
                    user.vipExpiresAt = vipExpire;
                    user.freeBumps = (user.freeBumps || 0) + bonusBumps;
                    
                    notifText = `💎 Ви придбали статус "${vipName}"! Вам нараховано ${bonusBumps} безкоштовних ручних підняттів.`;
                    emailText = `Дякуємо за покупку! 🎉<br><br>Ви успішно придбали VIP-статус <b>"${vipName}"</b> на 30 днів за ${amount} UAH.<br>Вам також нараховано <b>${bonusBumps}</b> безкоштовних ручних підняттів у подарунок!`;
                }
            } 
            else if (user.role === 'client') {
                let vipName = '';
                if (packageId === 'concierge') { vipName = 'CONCIERGE VIP'; }
                else if (packageId === 'priority_chat') { vipName = 'PRIORITY CHAT'; }
                else if (packageId === 'premium_client') { vipName = 'PREMIUM GUEST'; }

                user.vipPackage = packageId;
                user.vipExpiresAt = vipExpire;

                notifText = `🛡 Ви успішно активували статус "${vipName}" на 30 днів!`;
                emailText = `Дякуємо за покупку! 🎉<br><br>Ви успішно придбали клієнтський статус <b>"${vipName}"</b> на 30 днів за ${amount} UAH. Насолоджуйтесь преміальними можливостями платформи!`;
            }
            
            if (notifText && user.pushEnabled !== false) {
                const newNotif = { text: notifText, isRead: false, date: now };
                user.notifications.push(newNotif);
                
                if (typeof io !== 'undefined') {
                    io.emit(`new_notification_${userId}`, newNotif);
                }
            }

            if (emailText) await sendSmartEmail(user, '💎 Електронний чек ZEFIRKA', emailText);
            
            await user.save();

            // 🚀 СИГНАЛ: ХТОСЬ КУПИВ VIP (Оновлюємо каталог усім)
            const ioInstance = getIO();
            if (ioInstance) ioInstance.emit('global_sync', { action: 'reload_catalog' });
            
            res.json({ 
                success: true, 
                balance: user.balance, 
                freeBumps: user.freeBumps,
                vipPackage: user.vipPackage, 
                vipExpiresAt: user.vipExpiresAt 
            });
            
        } catch (error) { 
            console.error('🔥 КРИТИЧНА ПОМИЛКА BUY-VIP:', error); 
            res.status(500).json({ success: false, message: 'Помилка сервера' }); 
        }
    });

    router.post('/use-free-bump', async (req, res) => {
        try {
            const { userId } = req.body;
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
            if (user.freeBumps <= 0) return res.status(400).json({ success: false, message: 'У вас немає безкоштовних підняттів' });

            user.freeBumps -= 1;
            await user.save();

            const now = new Date();
            const bumpExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
            await Profile.updateMany({ userId: user._id }, { $set: { bumpedAt: now, bumpExpiresAt: bumpExpire } });

            sendNotification(user._id, `🚀 Ви успішно використали ручне підняття! Анкету виведено в ТОП. Залишилось: ${user.freeBumps} шт.`);
            await sendSmartEmail(user, '🚀 Анкету піднято в ТОП', `Ви успішно використали 1 безкоштовне підняття. Ваша анкета піднята на перші позиції!<br>У вас залишилось безкоштовних підняттів: <b>${user.freeBumps} шт.</b>`);

            // 🚀 СИГНАЛ: АНКЕТУ ПІДНЯТО (Всі миттєво бачать її в ТОПі)
            const ioInstance = getIO();
            if (ioInstance) ioInstance.emit('global_sync', { action: 'reload_catalog' });

            res.json({ success: true, freeBumps: user.freeBumps, message: 'Анкету успішно піднято в ТОП!' });
        } catch (error) {
            console.error("Bump error:", error);
            res.status(500).json({ success: false });
        }
    });

    router.post('/topup-request', async (req, res) => {
        try {
            const { userId, amount, method, currencyEq, receiptImage, txHash } = req.body;
            
            await TopUpRequest.create({
                userId, amount, method, currencyEq, receiptImage, txHash, status: 'pending'
            });

            const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;
            if (TELEGRAM_TOKEN && ADMIN_ID && bot) {
                try {
                    const caption = `💰 НОВЕ ПОПОВНЕННЯ!\n\nЮзер ID: ${userId}\nСума: ${amount} ₴ (~$${currencyEq} USD)\nМетод: ${method}\nХеш / Квитанція: ${txHash || 'Не вказано'}\n\nЗайдіть в Адмінку для підтвердження!`;
                    const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, "");
                    const buffer = Buffer.from(base64Data, 'base64');
                    await bot.sendPhoto(ADMIN_ID, buffer, { caption });
                } catch(e) { console.error("Telegram notification failed", e); }
            }
            
            const user = await User.findById(userId);
            await sendSmartEmail(user, '⏳ Заявка на поповнення в обробці', `Ваша заявка на поповнення балансу на суму <b>${amount} UAH</b> успішно передана адміністратору.<br>Очікуйте зарахування коштів найближчим часом!`);

            res.json({ success: true });
        } catch (error) { 
            console.error('Помилка topup-request:', error);
            res.status(500).json({ success: false }); 
        }
    });

    return router;
};