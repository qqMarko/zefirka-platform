import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// Шаблони швидких відповідей
const QUICK_REPLIES = {
    hi:   '👋 Доброго дня! Дякуємо за звернення до підтримки Zefirka. Чим можемо допомогти?',
    docs: '📎 Будь ласка, надайте докази (скріншоти переписки, чеки, фото), якщо ваше звернення стосується шахрайства чи обману. Без доказів ми не зможемо розглянути скаргу.',
    wait: '⏳ Дякуємо за звернення! Ваш запит прийнято, наш спеціаліст опрацює його найближчим часом.',
    thanks: '🙏 Дякуємо за звернення! Якщо виникнуть інші питання — звертайтесь, ми завжди на зв\'язку.',
    rules: '📜 Нагадуємо правила платформи: заборонено шахрайство, образи, передоплата поза системою та фейкові анкети. Порушення ведуть до блокування акаунту.',
    warn: '⚠️ Це офіційне попередження від адміністрації Zefirka. Ваші дії порушують правила платформи. У разі повторення акаунт буде заблоковано.',

    // 📸 Інструкції для верифікації
    req_photo: '🥈 БАЗОВА ВЕРИФІКАЦІЯ (Фото)\n\nЩоб отримати срібну галочку, надішліть нам сюди:\n\n1️⃣ Селфі, де ви тримаєте аркуш паперу\n2️⃣ На аркуші від руки напишіть: «Zefirka» + сьогоднішню дату\n3️⃣ Обличчя має бути чітко видно\n\nФото перевіряється протягом 24 годин. Воно НЕ публікується — лише для підтвердження особи.',

    req_video: '🥇 ПОВНА ВЕРИФІКАЦІЯ (Відео)\n\nЩоб отримати золоту галочку (максимальна довіра + до 300% більше переглядів), надішліть сюди:\n\n1️⃣ Коротке відео (5-10 сек)\n2️⃣ Назвіть вголос своє ім\'я з анкети та слово «Zefirka»\n3️⃣ Покажіть аркуш з сьогоднішньою датою\n4️⃣ Обличчя чітко видно, без масок/фільтрів\n\nВідео перевіряється протягом 24 годин і НЕ публікується — лише для підтвердження.',
};

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
        if(msg.chat.id.toString() === ADMIN_ID) {
            bot.sendMessage(ADMIN_ID, 
                "✅ Бот-Helpdesk увімкнено!\n\n" +
                "📋 КОМАНДИ (відповідайте Reply на тікет юзера):\n\n" +
                "⚡ Швидкі відповіді:\n" +
                "/hi — привітання\n" +
                "/docs — попросити докази (шахрайство)\n" +
                "/wait — запит прийнято\n" +
                "/thanks — подяка\n" +
                "/rules — нагадати правила\n" +
                "/warn — попередження\n\n" +
                "📸 Інструкції верифікації (що надіслати):\n" +
                "/req_photo — як пройти базову (фото)\n" +
                "/req_video — як пройти повну (відео)\n\n" +
                "✅ Видати верифікацію:\n" +
                "/verify_photo — 🥈 базова (фото)\n" +
                "/verify_video — 🥇 повна (відео)\n" +
                "/verify_off — зняти верифікацію\n\n" +
                "🛠 Керування юзером:\n" +
                "/userinfo — інфо про юзера\n" +
                "/ban — заблокувати\n" +
                "/unban — розблокувати\n" +
                "/give 500 — нарахувати ₴ (мінус = списати)\n\n" +
                "📋 /mytickets — мої активні тікети\n\n" +
                "ℹ️ Натисніть «Взяти в роботу» на тікеті — він закріпиться за вами, інші адміни не зможуть відповідати цьому юзеру."
            ); 
        }
    });

    // Витягнути userId з тікета (з повідомлення на яке відповідають)
    const extractUserId = (msg) => {
        if (!msg.reply_to_message) return null;
        const txt = msg.reply_to_message.text || msg.reply_to_message.caption || '';
        const m = txt.match(/ID Юзера: \[(.*?)\]/);
        return m && m[1] ? m[1] : null;
    };

    // ⚡ ШВИДКІ ВІДПОВІДІ
    bot.onText(/^\/(hi|docs|wait|thanks|rules|warn|req_photo|req_video)$/, (msg, match) => {
        if (msg.chat.id.toString() !== ADMIN_ID) return;
        const userId = extractUserId(msg);
        if (!userId) return bot.sendMessage(ADMIN_ID, '⚠️ Відповідайте цією командою на повідомлення тікета юзера (Reply).', { reply_to_message_id: msg.message_id });
        const text = QUICK_REPLIES[match[1]];
        io.emit(`support_reply_${userId}`, { text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), sender: 'agent' });
        bot.sendMessage(ADMIN_ID, `✅ Швидку відповідь «${match[1]}» надіслано юзеру.`, { reply_to_message_id: msg.message_id });
    });

    // ✅ ВЕРИФІКАЦІЯ МОДЕЛІ
    bot.onText(/^\/verify_(photo|video|off)$/, async (msg, match) => {
        if (msg.chat.id.toString() !== ADMIN_ID) return;
        const userId = extractUserId(msg);
        if (!userId) return bot.sendMessage(ADMIN_ID, '⚠️ Відповідайте цією командою на тікет моделі (Reply).', { reply_to_message_id: msg.message_id });

        const verification = match[1] === 'off' ? 'none' : match[1];
        try {
            // Знаходимо анкети цього юзера і ставимо верифікацію
            const result = await Profile.updateMany(
                { userId },
                { verification, verifiedAt: verification === 'none' ? null : new Date() }
            );
            if (result.matchedCount === 0) {
                return bot.sendMessage(ADMIN_ID, `⚠️ У юзера ${userId} не знайдено анкет.`, { reply_to_message_id: msg.message_id });
            }
            io.emit('global_sync', { action: 'reload_catalog' });

            const labels = { photo: '🥈 Базова (фото)', video: '🥇 Повна (відео)', none: '❌ Знято' };
            io.emit(`instant_sync_${userId}`, { action: 'update_data' });
            if (verification !== 'none' && typeof sendNotification === 'function') {
                sendNotification(userId, `✅ Вашу анкету верифіковано! Статус: ${labels[verification]} галочка.`);
            } else if (typeof sendNotification === 'function') {
                sendNotification(userId, `ℹ️ Верифікацію вашої анкети знято адміністратором.`);
            }
            bot.sendMessage(ADMIN_ID, `✅ Верифікацію «${labels[verification]}» застосовано до ${result.modifiedCount} анкет(и) юзера ${userId}.`, { reply_to_message_id: msg.message_id });
        } catch (err) {
            console.error('Помилка верифікації ТГ:', err);
            bot.sendMessage(ADMIN_ID, `❌ Помилка: ${err.message}`, { reply_to_message_id: msg.message_id });
        }
    });

    // 👤 ІНФО ПРО ЮЗЕРА
    bot.onText(/^\/userinfo$/, async (msg) => {
        if (msg.chat.id.toString() !== ADMIN_ID) return;
        const userId = extractUserId(msg);
        if (!userId) return bot.sendMessage(ADMIN_ID, '⚠️ Reply на тікет юзера + /userinfo', { reply_to_message_id: msg.message_id });
        try {
            const user = await User.findById(userId);
            if (!user) return bot.sendMessage(ADMIN_ID, `⚠️ Юзера ${userId} не знайдено.`, { reply_to_message_id: msg.message_id });
            const profilesCount = await Profile.countDocuments({ userId });
            const info = `👤 ІНФО ПРО ЮЗЕРА\n\n` +
                `📧 Email: ${user.email || '—'}\n` +
                `🆔 ID: ${user._id}\n` +
                `💰 Баланс: ${user.balance || 0} ₴\n` +
                `👑 VIP: ${user.vipPackage || 'немає'}\n` +
                `🎭 Роль: ${user.role || 'client'}\n` +
                `📋 Анкет: ${profilesCount}\n` +
                `🚫 Бан: ${user.isBanned ? 'ТАК' : 'ні'}\n` +
                `📅 Реєстрація: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('uk-UA') : '—'}`;
            bot.sendMessage(ADMIN_ID, info, { reply_to_message_id: msg.message_id });
        } catch (err) { bot.sendMessage(ADMIN_ID, `❌ ${err.message}`, { reply_to_message_id: msg.message_id }); }
    });

    // 🚫 БАН / РОЗБАН
    bot.onText(/^\/(ban|unban)$/, async (msg, match) => {
        if (msg.chat.id.toString() !== ADMIN_ID) return;
        const userId = extractUserId(msg);
        if (!userId) return bot.sendMessage(ADMIN_ID, '⚠️ Reply на тікет юзера + команда', { reply_to_message_id: msg.message_id });
        try {
            const banned = match[1] === 'ban';
            const user = await User.findByIdAndUpdate(userId, { isBanned: banned }, { new: true });
            if (!user) return bot.sendMessage(ADMIN_ID, `⚠️ Юзера не знайдено.`, { reply_to_message_id: msg.message_id });
            io.emit(`instant_sync_${userId}`, { action: 'update_data' });
            if (typeof sendNotification === 'function' && banned) sendNotification(userId, '🚫 Ваш акаунт заблоковано адміністрацією за порушення правил.');
            bot.sendMessage(ADMIN_ID, `${banned ? '🚫 Юзера ЗАБЛОКОВАНО' : '✅ Юзера РОЗБЛОКОВАНО'}: ${user.email || userId}`, { reply_to_message_id: msg.message_id });
        } catch (err) { bot.sendMessage(ADMIN_ID, `❌ ${err.message}`, { reply_to_message_id: msg.message_id }); }
    });

    // 💰 НАРАХУВАТИ БАЛАНС: /give 500  (або /give -200 щоб списати)
    bot.onText(/^\/give (-?\d+)$/, async (msg, match) => {
        if (msg.chat.id.toString() !== ADMIN_ID) return;
        const userId = extractUserId(msg);
        if (!userId) return bot.sendMessage(ADMIN_ID, '⚠️ Reply на тікет юзера + /give <сума>', { reply_to_message_id: msg.message_id });
        try {
            const amount = parseInt(match[1]);
            const user = await User.findById(userId);
            if (!user) return bot.sendMessage(ADMIN_ID, `⚠️ Юзера не знайдено.`, { reply_to_message_id: msg.message_id });
            user.balance = (user.balance || 0) + amount;
            if (user.balance < 0) user.balance = 0;
            await user.save();
            io.emit(`instant_sync_${userId}`, { action: 'update_data' });
            if (typeof sendNotification === 'function') {
                sendNotification(userId, amount >= 0 ? `💳 Вам нараховано ${amount} ₴ адміністрацією.` : `💳 З вашого балансу списано ${Math.abs(amount)} ₴.`);
            }
            bot.sendMessage(ADMIN_ID, `✅ Баланс змінено на ${amount} ₴. Новий баланс: ${user.balance} ₴`, { reply_to_message_id: msg.message_id });
        } catch (err) { bot.sendMessage(ADMIN_ID, `❌ ${err.message}`, { reply_to_message_id: msg.message_id }); }
    });

    // 🚀 ОБРОБКА ВІДПОВІДЕЙ АДМІНІВ
    bot.on('message', (msg) => {
        if (msg.chat.id.toString() !== ADMIN_ID || !msg.reply_to_message) return; 
        // Ігноруємо команди (вони обробляються окремими onText-хендлерами)
        if (msg.text && msg.text.startsWith('/')) return;
        
        const originalText = msg.reply_to_message.text || msg.reply_to_message.caption;
        if (!originalText) return;
        
        const match = originalText.match(/ID Юзера: \[(.*?)\]/);
        if (match && match[1]) {
            const userId = match[1];
            const adminId = msg.from.id;
            const adminName = msg.from.first_name || msg.from.username || 'Агент';

            const lock = ticketLocks.get(userId);

            // ⚠️ Закріплений за ІНШИМ адміном — блокуємо
            if (lock && lock.adminId !== adminId) {
                bot.sendMessage(ADMIN_ID, `🚫 @${msg.from.username || adminName}, цим юзером займається ${lock.adminName}! Не втручайтесь у чужий діалог.`, { reply_to_message_id: msg.message_id });
                return;
            }

            // 🆕 Тікет ще нічий — закріплюємо за тим, хто відповів першим
            if (!lock) {
                ticketLocks.set(userId, { adminId, adminName, takenAt: Date.now() });
                io.emit(`support_agent_joined_${userId}`, { adminName, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
                bot.sendMessage(ADMIN_ID, `✅ Тікет автоматично закріплено за вами (${adminName}).`, { reply_to_message_id: msg.message_id });
            }

            io.emit(`support_reply_${userId}`, { text: msg.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), sender: 'agent' });
            bot.sendMessage(ADMIN_ID, `✅ Відповідь надіслано юзеру.`);
        }
    });

    // 📋 МОЇ ТІКЕТИ
    bot.onText(/^\/mytickets$/, (msg) => {
        if (msg.chat.id.toString() !== ADMIN_ID) return;
        const adminId = msg.from.id;
        const mine = [];
        for (const [userId, lock] of ticketLocks.entries()) {
            if (lock.adminId === adminId) {
                const mins = Math.round((Date.now() - (lock.takenAt || Date.now())) / 60000);
                mine.push(`• Юзер ${userId} — ${mins} хв тому`);
            }
        }
        const text = mine.length
            ? `📋 ВАШІ АКТИВНІ ТІКЕТИ (${mine.length}):\n\n${mine.join('\n')}\n\nВсього активних: ${ticketLocks.size}`
            : `📭 У вас немає активних тікетів.\nВсього активних в системі: ${ticketLocks.size}`;
        bot.sendMessage(ADMIN_ID, text, { reply_to_message_id: msg.message_id });
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
            ticketLocks.set(userId, { adminId, adminName, takenAt: Date.now() });
            // 📣 Повідомляємо юзера в чаті підтримки що адмін підключився
            io.emit(`support_agent_joined_${userId}`, { adminName, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
            
            const newText = query.message.text ? 
                `${query.message.text}\n\n✅ В роботі: ${adminName}` : 
                `${query.message.caption}\n\n✅ В роботі: ${adminName}`;

            const closeKeyboard = { inline_keyboard: [[
                { text: "🔒 Закрити запит", callback_data: `close_${userId}` },
                { text: "↩️ Звільнити", callback_data: `release_${userId}` }
            ]] };

            if (query.message.text) bot.editMessageText(newText, { chat_id: chatId, message_id: messageId, reply_markup: closeKeyboard });
            else bot.editMessageCaption(newText, { chat_id: chatId, message_id: messageId, reply_markup: closeKeyboard });
            
            bot.answerCallbackQuery(query.id, { text: `✅ Ви взяли запит в роботу! Тільки ви відповідаєте цьому юзеру.` });
        }

        // --- ЗВІЛЬНИТИ ТІКЕТ (передати назад у чергу) ---
        if (data.startsWith('release_')) {
            const userId = data.split('_')[1];
            const lock = ticketLocks.get(userId);
            if (!lock) return bot.answerCallbackQuery(query.id, { text: `⚠️ Тікет не закріплений.` });
            if (lock.adminId !== query.from.id) {
                return bot.answerCallbackQuery(query.id, { text: `❌ Тільки ${lock.adminName} може звільнити цей тікет.`, show_alert: true });
            }
            ticketLocks.delete(userId);
            const baseText = (query.message.text || query.message.caption).replace(/\n\n✅ В роботі: .*/s, '');
            const claimKb = { inline_keyboard: [[{ text: "✋ Взяти в роботу", callback_data: `claim_${userId}` }]] };
            const releasedText = baseText + `\n\n↩️ Тікет звільнено — доступний іншим`;
            if (query.message.text) bot.editMessageText(releasedText, { chat_id: chatId, message_id: messageId, reply_markup: claimKb });
            else bot.editMessageCaption(releasedText, { chat_id: chatId, message_id: messageId, reply_markup: claimKb });
            bot.answerCallbackQuery(query.id, { text: `↩️ Тікет звільнено.` });
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
            // 🧹 Сигнал що сесію завершено — фронт очистить збережену переписку
            io.emit(`support_closed_${userId}`);

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