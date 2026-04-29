import './config/env.js'; // 🚀 ЗАВАНТАЖЕННЯ .ENV НАЙПЕРШИМ
import express from 'express';
import http from 'http'; 
import { Server } from 'socket.io'; 
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import winston from 'winston';

// 🟢 МОДЕЛІ БД
import User from './models/User.js'; 

// 🟢 РОУТИ
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import adminRoutes from './routes/admin.js';
import walletRoutes from './routes/wallet.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';               // НОВЕ
import disputeRoutes from './routes/disputeRoutes.js';   // НОВЕ
import profileExtraRoutes from './routes/profileExtras.js'; // НОВЕ

// 🚀 МІДЛВАРИ ТА СЕРВІСИ
import { uploadProfile } from './middlewares/upload.js';
import { initTelegramBot } from './services/telegramBot.js';
import { initSockets } from './sockets/socketManager.js';
import { initCronJobs } from './jobs/cronJobs.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const PORT = process.env.PORT || 5000;

// ==========================================
// 🛡️ ЛОГУВАННЯ ТА БЕЗПЕКА
// ==========================================
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
if (process.env.NODE_ENV !== 'production') logger.add(new winston.transports.Console({ format: winston.format.simple() }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use(helmet({ crossOriginResourcePolicy: false })); 
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static('uploads')); 

app.use((req, res, next) => { 
    if (process.env.NODE_ENV !== 'production') console.log(`📡 Радар: [${req.method}] ${req.url}`); 
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next(); 
});

// ==========================================
// 📦 БАЗА ДАНИХ
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 База даних підключена!'))
    .catch((err) => console.error('❌ ПОМИЛКА БД:\n', err.message));

// ==========================================
// 🔔 СИСТЕМА СПОВІЩЕНЬ (Глобальна)
// ==========================================
const sendNotification = async (userId, text) => {
    try {
        const user = await User.findById(userId);
        if (user && user.pushEnabled !== false) {
            const newNotif = { text, isRead: false, date: new Date() };
            user.notifications.push(newNotif);
            await user.save();
            io.emit(`new_notification_${userId}`, newNotif); 
        }
    } catch (error) { console.error('Notification Error:', error); }
};

// ==========================================
// 🚀 ІНІЦІАЛІЗАЦІЯ СЕРВІСІВ (Telegram, Sockets, Cron)
// ==========================================
const { bot, ADMIN_ID } = initTelegramBot(io, sendNotification);
initSockets(io);
initCronJobs(sendNotification);

// ==========================================
// 🔗 ОСНОВНІ РОУТИ
// ==========================================
// 1. Стандартні роути
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes(sendNotification));
app.use('/api/wallet', walletRoutes(io, bot, sendNotification));

// 2. Наші нові винесені роути (монтуємо їх на корінь /api)
app.use('/api', chatRoutes(bot, ADMIN_ID));
app.use('/api', disputeRoutes(io, sendNotification));
app.use('/api', profileExtraRoutes(sendNotification));

// 3. Єдиний залишковий роут для завантаження фотографії анкети
app.post('/api/upload', uploadProfile.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Файл не знайдено' });
    res.json({ success: true, url: req.file.path });
});

// ==========================================
// 🟢 СТАРТ СЕРВЕРА
// ==========================================
server.listen(PORT, '0.0.0.0', () => console.log(`✅ Сервер запущено на порту ${PORT}!`));