import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';

export const initTelegramBot = (io, sendNotification) => {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;
    let bot = null;

    if (!TELEGRAM_TOKEN) return { bot, ADMIN_ID };

    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
    
    bot.onText(/\/start/, (msg) => { 
        if(msg.chat.id.toString() === ADMIN_ID) bot.sendMessage(ADMIN_ID, "✅ Бот увімкнено! Чекаю на чеки та звернення."); 
    });

    bot.on('message', (msg) => {
        if (msg.chat.id.toString() !== ADMIN_ID || !msg.reply_to_message) return; 
        const originalText = msg.reply_to_message.text || msg.reply_to_message.caption;
        if (!originalText) return;
        const match = originalText.match(/ID Юзера: \[(.*?)\]/);
        if (match && match[1]) {
            io.emit(`support_reply_${match[1]}`, { text: msg.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), sender: 'agent' });
            bot.sendMessage(ADMIN_ID, `✅ Відповідь надіслано!`);
        }
    });

    bot.on('callback_query', async (query) => {
        const data = query.data; 
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;

        if (data.startsWith('pay_')) {
            const parts = data.split('_');
            const action = parts[1]; 
            const userId = parts[2];
            const amount = parseFloat(parts[3]);

            try {
                if (action === 'approve') {
                    const user = await User.findById(userId);
                    if (user) {
                        user.balance += amount;
                        await user.save();
                        sendNotification(userId, `💳 Ваш баланс успішно поповнено на ${amount} ₴!`);
                        bot.editMessageCaption(`✅ ОПЛАТУ ПІДТВЕРДЖЕНО\nЮзеру нараховано ${amount} ₴\nID: ${userId}`, { chat_id: chatId, message_id: messageId });
                    }
                } else if (action === 'reject') {
                    sendNotification(userId, `❌ Ваше поповнення на ${amount} ₴ було відхилено адміністратором. Зверніться у підтримку.`);
                    bot.editMessageCaption(`❌ ОПЛАТУ ВІДХИЛЕНО\nСума: ${amount} ₴\nID: ${userId}`, { chat_id: chatId, message_id: messageId });
                }
            } catch (err) { console.error("Помилка ТГ:", err); }
        }
    });

    return { bot, ADMIN_ID };
};