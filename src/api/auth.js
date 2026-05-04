// src/api/auth.js

const API_URL = 'http://192.168.0.103:5000/api/auth';

// РЕЄСТРАЦІЯ
export const registerUser = async (email, password, role) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Сервер недоступний' };
    }
};

// ЛОГІН
export const loginUser = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Сервер недоступний' };
    }

    // ==========================================
// 🔑 ЗМІНА ПАРОЛЯ В НАЛАШТУВАННЯХ
// ==========================================
router.post('/change-password', async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Користувача не знайдено' });

        const cleanOld = String(oldPassword).trim();
        const cleanNew = String(newPassword).trim();

        let isMatch = false;
        // Розумна перевірка: якщо хеш - перевіряємо через bcrypt, якщо старий тестовий - як текст
        if (user.password && user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(cleanOld, user.password);
        } else {
            isMatch = (cleanOld === String(user.password).trim());
        }

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Дійсно невірний поточний пароль' });
        }

        // Хешуємо новий
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(cleanNew, salt);
        await user.save();

        res.json({ success: true, message: 'Пароль успішно змінено' });
    } catch (error) { 
        console.error("🔥 ПОМИЛКА ЗМІНИ ПАРОЛЯ:", error);
        // ТЕПЕР ФРОНТЕНД ТОЧНО ПОКАЖЕ, ЯКЩО БЕКЕНД ВПАВ
        res.status(500).json({ success: false, message: `Помилка сервера: ${error.message}` }); 
    }
});

};