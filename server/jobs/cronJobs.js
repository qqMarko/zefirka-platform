import cron from 'node-cron';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

// Маппінг: поточний пакет → наступний + знижка
const UPGRADE_MAP = {
    start:   { nextPackage: 'premium', discountPercent: 20, daysAfterPurchase: 7 },
    premium: { nextPackage: 'diamond', discountPercent: 15, daysAfterPurchase: 7 },
};
// Знижка діє 7 днів з моменту нарахування
const DISCOUNT_VALIDITY_DAYS = 7;

export const initCronJobs = (sendNotification) => {

    // ────────────────────────────────────────────────────────────────
    // Кожну годину: перевіряємо VIP та підняття
    // ────────────────────────────────────────────────────────────────
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            
            // 1. Перевірка закінчення VIP у Profile
            const expiredVips = await Profile.find({ vLevel: { $gt: 0 }, vipExpiresAt: { $lte: now } });
            if (expiredVips.length > 0) {
                const ids = expiredVips.map(p => p._id);
                const userIds = [...new Set(expiredVips.map(p => p.userId))];
                await Profile.updateMany({ _id: { $in: ids } }, { $set: { vLevel: 0, vipExpiresAt: null } });
                userIds.forEach(uid => sendNotification(uid, `⚠️ Термін дії вашого VIP-статусу закінчився.`));
            }

            // 2. Перевірка одноразових підняттів
            const expiredBumps = await Profile.find({ bumpExpiresAt: { $lte: now } });
            if (expiredBumps.length > 0) {
                const ids = expiredBumps.map(p => p._id);
                await Profile.updateMany({ _id: { $in: ids } }, { $set: { bumpedAt: null, bumpExpiresAt: null } });
            }

            // 3. Очищення VIP у User-моделі після закінчення
            const expiredVipUsers = await User.find({
                vipPackage: { $ne: 'none' },
                vipExpiresAt: { $lte: now }
            });
            for (const u of expiredVipUsers) {
                u.vipPackage = 'none';
                u.vipExpiresAt = null;
                u.vipPurchasedAt = null;
                await u.save();
            }

        } catch (error) { 
            console.error("Cron Error (hourly):", error); 
        }
    });

    // ────────────────────────────────────────────────────────────────
    // Кожні 6 годин: маркетинг — автоматичні знижки на апгрейд VIP
    // ────────────────────────────────────────────────────────────────
    cron.schedule('0 */6 * * *', async () => {
        try {
            const now = new Date();

            for (const [currentPkg, config] of Object.entries(UPGRADE_MAP)) {
                const triggerDate = new Date(now.getTime() - config.daysAfterPurchase * 24 * 60 * 60 * 1000);
                const discountExpiresAt = new Date(now.getTime() + DISCOUNT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

                // Шукаємо юзерів які:
                // - мають поточний VIP
                // - купили його >= N днів тому
                // - VIP ще активний
                // - ще не мають знижки на апгрейд
                const eligibleUsers = await User.find({
                    vipPackage: currentPkg,
                    vipPurchasedAt: { $lte: triggerDate },
                    vipExpiresAt: { $gt: now },
                    $or: [
                        { 'upgradeDiscount.forPackage': null },
                        { 'upgradeDiscount.forPackage': { $exists: false } },
                        { 'upgradeDiscount.expiresAt': { $lte: now } } // попередня знижка прострочена
                    ]
                });

                for (const user of eligibleUsers) {
                    user.upgradeDiscount = {
                        forPackage: config.nextPackage,
                        discountPercent: config.discountPercent,
                        expiresAt: discountExpiresAt
                    };
                    await user.save();

                    const packageNames = { premium: 'PREMIUM', diamond: 'DIAMOND' };
                    const nextName = packageNames[config.nextPackage] || config.nextPackage.toUpperCase();
                    sendNotification(
                        user._id,
                        `🎁 Спеціальна пропозиція! Оновіть до ${nextName} зі знижкою -${config.discountPercent}% протягом ${DISCOUNT_VALIDITY_DAYS} днів. Відкрийте меню VIP-пакетів!`
                    );
                }

                if (eligibleUsers.length > 0) {
                    console.log(`✅ Маркетинг: нараховано знижку на ${config.nextPackage} для ${eligibleUsers.length} юзерів (${currentPkg} → ${config.nextPackage})`);
                }
            }

            // Очищаємо прострочені персональні знижки
            await User.updateMany(
                { 'upgradeDiscount.expiresAt': { $lte: now } },
                { $set: { 'upgradeDiscount.forPackage': null, 'upgradeDiscount.discountPercent': 0, 'upgradeDiscount.expiresAt': null } }
            );

        } catch (error) {
            console.error("Cron Error (marketing):", error);
        }
    });

    console.log('⏳ Фонова задача (Cron Jobs) запущена!');
};