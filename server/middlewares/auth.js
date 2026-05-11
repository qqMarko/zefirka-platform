import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
    try {
        // Отримуємо токен із заголовка Authorization (формат "Bearer TOKEN")
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Немає доступу. Токен відсутній.' });
        }

        const token = authHeader.split(' ')[1];
        
        // Секретний ключ (має збігатися з тим, що у auth.js)
        const secret = process.env.JWT_SECRET || 'super_secret_key';
        
        // Розшифровуємо токен
        const decoded = jwt.verify(token, secret);
        
        // Шукаємо користувача в БД
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Користувача не знайдено.' });
        }

        // 🛑 ГОЛОВНА ПЕРЕВІРКА СЕАНСІВ:
        // Перевіряємо, чи є цей токен у масиві активних сесій
        const sessionExists = user.sessions.some(session => session.token === token);
        if (!sessionExists) {
            return res.status(401).json({ success: false, message: 'Сеанс завершено або пристрій видалено. Увійдіть знову.' });
        }

        // Оновлюємо час останньої активності для поточної сесії
        const sessionIndex = user.sessions.findIndex(session => session.token === token);
        if (sessionIndex !== -1) {
            user.sessions[sessionIndex].lastActive = new Date();
            await user.save();
        }

        // Передаємо дані користувача далі
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Невалідний або прострочений токен.' });
    }
};

export default authMiddleware;