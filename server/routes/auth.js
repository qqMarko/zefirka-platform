import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { UAParser } from 'ua-parser-js'; 
import User from '../models/User.js';
import authMiddleware from '../middlewares/auth.js';
import { getIO } from '../sockets/socketManager.js'; // 🚀 ОБОВ'ЯЗКОВО ДЛЯ СОКЕТІВ

const router = express.Router();
const otpStore = new Map();

const getTransporter = () => nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
});

const getJwtSecret = () => process.env.JWT_SECRET || 'super_secret_key';

const getDeviceInfo = (req) => {
    try {
        const uaString = req.headers['user-agent'] || '';
        const parser = new UAParser(uaString);
        const result = parser.getResult();
        
        const browser = result.browser?.name || 'Невідомий браузер';
        const os = result.os?.name || 'Невідома ОС';
        
        const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
        const ip = rawIp.split(',')[0].trim() || 'Невідомий IP';
        
        return { device: `${browser} • ${os}`, ip };
    } catch (error) {
        return { device: 'Невідомий пристрій', ip: 'Невідомий IP' };
    }
};

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
        
        const { device, ip } = getDeviceInfo(req);
        savedUser.sessions.push({ token, device, ip, lastActive: new Date() });
        await savedUser.save();

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
        
        const { device, ip } = getDeviceInfo(req);
        user.sessions.push({ token, device, ip, lastActive: new Date() });
        if (user.sessions.length > 10) user.sessions.shift(); 
        await user.save();

        res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled } });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

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
        
        const { device, ip } = getDeviceInfo(req);
        user.sessions.push({ token, device, ip, lastActive: new Date() });
        if (user.sessions.length > 10) user.sessions.shift();
        await user.save();

        res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled } });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// 🚫 ЗАВЕРШИТИ ВСІ ІНШІ СЕАНСИ
// ==========================================
router.post('/logout-all', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Немає заголовка авторизації' });
        }

        const token = authHeader.split(' ')[1];
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ success: false, message: 'Токен порожній або не знайдений' });
        }

        const decoded = jwt.verify(token, getJwtSecret());

        const result = await User.updateOne(
            { _id: decoded.id },
            { $pull: { sessions: { token: { $ne: token } } } } 
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
        }

        const io = getIO();
        if (io) {
            io.emit(`force_logout_${decoded.id}`, { keepToken: token });
        }

        res.json({ success: true, message: 'Всі інші сеанси успішно завершено' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

// ==========================================
// 🔴 ЗАВЕРШИТИ КОНКРЕТНИЙ СЕАНС (ОДИН)
// ==========================================
router.post('/logout-session', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Немає заголовка авторизації' });
        }

        const currentToken = authHeader.split(' ')[1];
        const { sessionToken } = req.body;

        if (!sessionToken) return res.status(400).json({ success: false, message: 'Не вказано сеанс для видалення' });

        const decoded = jwt.verify(currentToken, getJwtSecret());

        // Видаляємо з бази конкретний токен
        await User.updateOne(
            { _id: decoded.id },
            { $pull: { sessions: { token: sessionToken } } }
        );

        // Відправляємо сигнал САМЕ ТОМУ пристрою, щоб він вийшов
        const io = getIO();
        if (io) {
            io.emit(`kill_session_${decoded.id}`, { removedToken: sessionToken });
        }

        res.json({ success: true, message: 'Сеанс успішно завершено' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
        res.json({ success: true, sessions: user.sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка отримання сесій' });
    }
});

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
        user.sessions = []; 
        await user.save();

        res.json({ success: true, message: 'Пароль успішно змінено!' });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

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