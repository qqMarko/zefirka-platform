import useStore from '../store/useStore';

// Беремо посилання на сервер із нашого .env файлу, або використовуємо IP для телефону
const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.101:5000/api';

export const apiClient = async (endpoint, options = {}) => {
    // 1. Дістаємо токен безпеки з глобального сховища
    const token = useStore.getState().token;
    
    // 2. Базові заголовки
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 3. Якщо користувач залогінений — чіпляємо його токен-паспорт
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Якщо відправляємо файл (фото), браузер сам має поставити правильний Content-Type
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        // 4. Робимо запит на сервер
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // 5. ГЛОБАЛЬНИЙ ЗАХИСТ: Якщо токен протух або невірний (Помилка 401)
        if (response.status === 401) {
            console.error('Токен недійсний! Виходимо з акаунту...');
            useStore.getState().logout(); // Очищаємо дані
            window.location.href = '/'; // Викидаємо на головну
            throw new Error('Unauthorized');
        }

        // Повертаємо дані
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Помилка API:', error);
        throw error;
    }
};