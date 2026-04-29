// src/api/catalog.js
import { initialModels } from '../data/mockData';

// Імітація завантаження каталогу з бекенду
export const fetchCatalog = async (filters, page = 1) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Поки що беремо дані з LocalStorage (як імітацію БД)
            const saved = localStorage.getItem('zefirka_models_v2');
            let models = saved ? JSON.parse(saved) : initialModels || [];
            
            // На реальному бекенді фільтрація буде відбуватися SQL-запитом
            resolve({ success: true, data: models });
        }, 800); // Імітуємо 0.8 сек завантаження бази
    });
};

// Імітація додавання анкети в "Улюблені" на сервері
export const toggleFavoriteOnServer = async (modelId) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, message: 'Статус улюбленого змінено' });
        }, 300);
    });
};