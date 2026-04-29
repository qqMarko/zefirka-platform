// src/api/chat.js

// Імітація завантаження всіх діалогів користувача
export const fetchMyChats = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, data: [] }); // Поки що повертаємо порожній масив
        }, 600);
    });
};

// Імітація відправки одного повідомлення
export const sendMessageToApi = async (chatId, text, attachedImg = null) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Сервер повертає готове повідомлення з часом та ID
            const newMsg = { 
                id: Date.now(), 
                text: text, 
                img: attachedImg,
                sender: 'me', 
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
            };
            resolve({ success: true, message: newMsg });
        }, 300);
    });
};