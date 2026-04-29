import cron from 'node-cron';
import Profile from '../models/Profile.js';

export const initCronJobs = (sendNotification) => {
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            
            // 1. Перевірка VIP
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
        } catch (error) { 
            console.error("Cron Error:", error); 
        }
    });
    console.log('⏳ Фонова задача (Cron Jobs) запущена!');
};