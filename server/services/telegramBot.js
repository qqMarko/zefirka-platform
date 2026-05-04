import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';

// 🚀 Пам'ять для закріплених запитів (userId -> { adminId, adminName })
const ticketLocks = new Map();

export const initTelegramBot = (io, sendNotification) => {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;
    let bot = null;

    if (!TELEGRAM_TOKEN) return { bot, ADMIN_ID };

    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
    bot.ticketLocks = ticketLocks;
    
    bot.on('polling_error', (error) => {
        console.error('⚠️ ПОМИЛКА ТЕЛЕГРАМ БОТА (але сервер працює далі):', error.message);
    });

    bot.onText(/\/start/, (msg) => { 
        if(msg.chat.id.toString() === ADMIN_ID) bot.sendMessage(ADMIN_ID, "✅ Бот-Helpdesk увімкнено! Чекаю на запити."); 
    });

    // 🚀 ОБРОБКА ВІДПОВІДЕЙ АДМІНІВ
    bot.on('message', (msg) => {
        if (msg.chat.id.toString() !== ADMIN_ID || !msg.reply_to_message) return; 
        
        const originalText = msg.reply_to_message.text || msg.reply_to_message.caption;
        if (!originalText) return;
        
        const match = originalText.match(/ID Юзера: \[(.*?)\]/);
        if (match && match[1]) {
            const userId = match[1];

            // ⚠️ Перевірка: чи не закріплений цей тікет за іншим адміном?
            const lock = ticketLocks.get(userId);
            if (lock && lock.adminId !== msg.from.id) {
                bot.sendMessage(ADMIN_ID, `⚠️ @${msg.from.username}, цим запитом вже займається **${lock.adminName}**! Не дублюйте відповіді.`, { reply_to_message_id: msg.message_id, parse_mode: 'Markdown' });
                return;
            }

            io.emit(`support_reply_${userId}`, { text: msg.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), sender: 'agent' });
            bot.sendMessage(ADMIN_ID, `✅ Відповідь успішно надіслано юзеру!`);
        }
    });

    // 🚀 ОБРОБКА КНОПОК "ВЗЯТИ В РОБОТУ", "ЗАКРИТИ", "ОПЛАТИ"
    bot.on('callback_query', async (query) => {
        const data = query.data; 
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;

        // --- ЛОГІКА ВЗЯТТЯ ТІКЕТА ---
        if (data.startsWith('claim_')) {
            const userId = data.split('_')[1];
            const adminId = query.from.id;
            const adminName = query.from.first_name || query.from.username || 'Агент';

            if (ticketLocks.has(userId)) {
                const currentLock = ticketLocks.get(userId);
                if (currentLock.adminId !== adminId) {
                    return bot.answerCallbackQuery(query.id, { text: `❌ Запит вже взяв в роботу ${currentLock.adminName}`, show_alert: true });
                }
                return bot.answerCallbackQuery(query.id, { text: `✅ Ви вже працюєте над цим запитом.` });
            }

            // Закріплюємо за адміном
            ticketLocks.set(userId, { adminId, adminName });
            
            const newText = query.message.text ? 
                `${query.message.text}\n\n✅ В роботі: ${adminName}` : 
                `${query.message.caption}\n\n✅ В роботі: ${adminName}`;

            const closeKeyboard = { inline_keyboard: [[{ text: "🔒 Закрити запит", callback_data: `close_${userId}` }]] };

            if (query.message.text) bot.editMessageText(newText, { chat_id: chatId, message_id: messageId, reply_markup: closeKeyboard });
            else bot.editMessageCaption(newText, { chat_id: chatId, message_id: messageId, reply_markup: closeKeyboard });
            
            bot.answerCallbackQuery(query.id, { text: `✅ Ви взяли запит в роботу!` });
        }

        // --- ЛОГІКА ЗАКРИТТЯ ТІКЕТА ---
        if (data.startsWith('close_')) {
            const userId = data.split('_')[1];
            const adminId = query.from.id;
            const lock = ticketLocks.get(userId);

            if (!lock) return bot.answerCallbackQuery(query.id, { text: `⚠️ Запит вже закрито або не був взятий в роботу.` });
            if (lock.adminId !== adminId) return bot.answerCallbackQuery(query.id, { text: `❌ Тільки ${lock.adminName} може закрити цей запит.`, show_alert: true });

            // Знімаємо закріплення
            ticketLocks.delete(userId);

            // 🚀 СИГНАЛ КЛІЄНТУ НА ФРОНТЕНД
            io.emit(`support_reply_${userId}`, { 
                text: `🔒 Запит було закрито агентом ${lock.adminName}. Дякуємо за звернення!`, 
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                sender: 'agent' 
            });

            const newText = query.message.text ? 
                query.message.text.replace(/✅ В роботі: .*/, `🔒 Запит закрито (${lock.adminName})`) : 
                query.message.caption.replace(/✅ В роботі: .*/, `🔒 Запит закрито (${lock.adminName})`);

            if (query.message.text) bot.editMessageText(newText, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
            else bot.editMessageCaption(newText, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
            
            bot.answerCallbackQuery(query.id, { text: `✅ Запит закрито!` });
        }

        // --- ЛОГІКА ОПЛАТ ---
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
                        
                        // 🚀 МИТТЄВЕ ОНОВЛЕННЯ БАЛАНСУ ЮЗЕРУ
                        io.emit(`instant_sync_${userId}`, { action: 'update_data' });

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