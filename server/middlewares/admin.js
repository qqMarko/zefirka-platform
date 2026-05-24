import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 🛡️ Цей мідлвар перевіряє:
// 1. Чи є взагалі токен (чи людина залогінена)
// 2. Чи є в токені роль 'admin' (щоб звичайний юзер не зайшов в адмінку)
const adminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Немає доступу. Токен відсутній.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Перевіряємо що роль = 'admin'
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ заборонено. Потрібні права адміністратора.' });
        }

        // Перевіряємо що юзер реально існує в БД
        const user = await User.findById(decoded.id);
        if (!user || user.isBanned) {
            return res.status(403).json({ success: false, message: 'Адміністратора не знайдено або акаунт заблоковано.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Невалідний або прострочений токен.' });
    }
};

export default adminMiddleware;