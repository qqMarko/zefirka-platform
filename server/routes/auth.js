import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();
const otpStore = new Map();

// 🟢 ЛІНИВЕ ЗАВАНТАЖЕННЯ ТРАНСПОРТЕРА
const getTransporter = () => nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
});

const getJwtSecret = () => process.env.JWT_SECRET || 'super_secret_key';

router.post('/register-init', async (req, res) => {
    try {
        const { email, password, phone, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Пошта зареєстрована' });
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, { otpCode, password, phone, role, expires: Date.now() + 10 * 60 * 1000 }); 
        
        await getTransporter().sendMail({ 
            from: process.env.EMAIL_USER, 
            to: email, 
            subject: 'Ваш код ZEFIRKA', 
            html: `<h1 style="background:#111;color:#00ffff;padding:15px;text-align:center">${otpCode}</h1>` 
        });
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: 'Помилка пошти' }); 
    }
});

router.post('/register-verify', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const stored = otpStore.get(email);
        if (!stored || Date.now() > stored.expires || stored.otpCode !== otp) {
            return res.status(400).json({ success: false, message: 'Невірний код' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(stored.password, salt);
        const newUser = new User({ 
            email, 
            phone: stored.phone, 
            password: hashedPassword, 
            role: stored.role || 'model', 
            isVerified: true, 
            trustScore: 80,
            twoFactorEnabled: false
        });
        
        const savedUser = await newUser.save();
        otpStore.delete(email); 
        
        const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, getJwtSecret(), { expiresIn: '7d' });
        res.status(201).json({ success: true, token, user: { id: savedUser._id, email: savedUser.email, role: savedUser.role, twoFactorEnabled: savedUser.twoFactorEnabled } });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: 'Невірна пошта/пароль' });
        }
        if (user.isBanned) return res.status(403).json({ success: false, message: 'Заблоковано' });
        
        // 🔐 ЯКЩО УВІМКНЕНО 2FA - ВІДПРАВЛЯЄМО КОД
        if (user.twoFactorEnabled) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(email + '_2fa', { otpCode, id: user._id, role: user.role, expires: Date.now() + 5 * 60 * 1000 });
            
            await getTransporter().sendMail({ 
                from: process.env.EMAIL_USER, 
                to: email, 
                subject: 'Код для входу ZEFIRKA (2FA)', 
                html: `<h1 style="background:#111;color:#00ffff;padding:15px;text-align:center">${otpCode}</h1>
                       <p style="text-align:center;">Нікому не передавайте цей код.</p>` 
            });

            return res.status(200).json({ success: true, require2FA: true, message: 'Код відправлено на пошту' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
        res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled } });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

// ==========================================
// 🔐 ПІДТВЕРДЖЕННЯ 2FA ПРИ ЛОГІНІ
// ==========================================
router.post('/verify-2fa-login', async (req, res) => {
    try {
        const { email, code } = req.body;
        const stored = otpStore.get(email + '_2fa');
        
        if (!stored || Date.now() > stored.expires || stored.otpCode !== code) {
            return res.status(400).json({ success: false, message: 'Невірний або прострочений код' });
        }

        const user = await User.findById(stored.id);
        otpStore.delete(email + '_2fa'); 

        const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
        // 🔥 ОСЬ ЦЕЙ РЯДОК БУВ ПРОБЛЕМНИМ - ТЕПЕР ВІН 100% ВІДДАЄ ОБ'ЄКТ USER
        res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled } });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// 🔐 УВІМКНЕННЯ / ВИМКНЕННЯ 2FA
// ==========================================
router.post('/toggle-2fa', async (req, res) => {
    try {
        const { userId, enabled } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

        user.twoFactorEnabled = enabled;
        await user.save();

        res.json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

router.post('/change-password', async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

        const cleanOld = String(oldPassword).trim();
        const cleanNew = String(newPassword).trim();

        let isMatch = false;
        if (user.password && user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(cleanOld, user.password);
        } else {
            isMatch = (cleanOld === String(user.password).trim());
        }

        if (!isMatch) return res.status(400).json({ success: false, message: 'Невірний поточний пароль' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(cleanNew, salt);
        await user.save();

        res.json({ success: true, message: 'Пароль успішно змінено' });
    } catch (error) { 
        res.status(500).json({ success: false, message: `Помилка сервера: ${error.message}` }); 
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Відновлення пароля ZEFIRKA',
            html: `<h1 style="background:#111;color:#ff9800;padding:15px;text-align:center">Код відновлення: ${resetCode}</h1>`
        });
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: 'Помилка відправки листа' }); 
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await User.findOne({ email, resetPasswordToken: code, resetPasswordExpires: { $gt: Date.now() } });
        
        if (!user) return res.status(400).json({ success: false, message: 'Невірний або прострочений код' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Пароль успішно змінено!' });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

// ==========================================
// 📧 УВІМКНЕННЯ / ВИМКНЕННЯ EMAIL-СПОВІЩЕНЬ
// ==========================================
router.post('/toggle-email-notif', async (req, res) => {
    try {
        const { userId, enabled } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

        user.emailNotifications = enabled;
        await user.save();

        res.json({ success: true, emailNotifications: user.emailNotifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

export default router;