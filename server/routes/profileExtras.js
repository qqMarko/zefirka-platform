import express from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

export default (sendNotification) => {
    const router = express.Router();

    // 📊 ТРЕКІНГ ПЕРЕГЛЯДІВ
    router.post('/profiles/:id/track', async (req, res) => {
        try {
            const { action } = req.body; 
            const today = new Date().toISOString().split('T')[0]; 
            
            const profile = await Profile.findById(req.params.id);
            if (!profile) return res.status(404).json({ success: false });

            profile.views = profile.views || 0;
            profile.clicks = profile.clicks || 0;

            if (action === 'click') profile.clicks += 1;
            else profile.views += 1;

            const currentDaily = profile.dailyStats || {};
            if (!currentDaily[today]) currentDaily[today] = { views: 0, clicks: 0 };
            
            if (action === 'click') currentDaily[today].clicks = (currentDaily[today].clicks || 0) + 1;
            else currentDaily[today].views = (currentDaily[today].views || 0) + 1;

            profile.dailyStats = currentDaily;
            profile.markModified('dailyStats'); 
            
            await profile.save();
            res.json({ success: true });
        } catch (error) { 
            console.error("🔥 ПОМИЛКА ТРЕКІНГУ:", error);
            res.status(500).json({ success: false }); 
        }
    });

    // ⭐ ВІДГУКИ: ДОДАВАННЯ
    router.post('/profiles/:id/reviews', async (req, res) => {
        try {
            const { clientId, clientName, rating, text } = req.body;
            const profileId = req.params.id;

            // 🟢 1. ШУКАЄМО КЛІЄНТА В БАЗІ ЮЗЕРІВ (щоб перевірити його VIP-статус)
            const clientUser = await User.findById(clientId);
            
            // 🟢 ДОЗВОЛЕНІ СТАТУСИ ДЛЯ ВІДГУКІВ
            const allowedVips = ['priority', 'concierge'];

            if (!clientUser || !allowedVips.includes(clientUser.vipPackage?.toLowerCase())) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Тільки клієнти зі статусом PRIORITY або CONCIERGE можуть залишати відгуки!' 
                });
            }

            const modelProfile = await Profile.findById(profileId);
            if (!modelProfile) return res.status(404).json({ success: false, message: 'Анкету не знайдено' });

            // Захист від дублювання — порівнюємо як рядки щоб уникнути ObjectId vs String
            const alreadyReviewed = modelProfile.reviews.some(
                r => String(r.clientId) === String(clientId)
            );
            if (alreadyReviewed) return res.status(400).json({ success: false, message: 'Ви вже залишали відгук цій моделі!' });

            // Захист від накрутки — один клієнт не може залишати >10 відгуків всього по платформі за добу
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const allProfiles = await Profile.find({ 'reviews.clientId': clientId, 'reviews.date': { $gte: oneDayAgo } });
            const reviewsToday = allProfiles.reduce((count, p) => {
                return count + p.reviews.filter(r => String(r.clientId) === String(clientId) && new Date(r.date) >= oneDayAgo).length;
            }, 0);
            if (reviewsToday >= 5) return res.status(429).json({ success: false, message: 'Ліміт відгуків на сьогодні вичерпано (5 на добу)' });

           // 🟢 ПЕРЕВІРКА АКТИВНОГО VIP-СТАТУСУ МОДЕЛІ ДЛЯ МОДЕРАЦІЇ ВІДГУКУ
            let isReviewApproved = true; 
            const modelUser = await User.findById(modelProfile.userId);
            
            if (modelUser) {
                const modelVip = modelUser.vipPackage ? modelUser.vipPackage.toLowerCase() : '';
                
                // Якщо це преміум або діамант
                if (modelVip === 'premium' || modelVip === 'diamond') {
                    
                    // Перевіряємо, чи цей VIP досі АКТИВНИЙ (не прострочений)
                    const expireDate = modelUser.vipExpiresAt || modelProfile.vipExpiresAt;
                    const isVipActive = !expireDate || new Date(expireDate) > new Date();
                    
                    if (isVipActive) {
                        isReviewApproved = false; // Відправляємо на модерацію ТІЛЬКИ якщо статус активний
                    }
                }
            }

            const newReview = { clientId, clientName: clientName || 'Premium Client', rating: Number(rating), text, status: isReviewApproved ? 'approved' : 'pending' };
            modelProfile.reviews.push(newReview);

            const approvedReviews = modelProfile.reviews.filter(r => r.status !== 'pending');
            modelProfile.totalReviews = approvedReviews.length;
            if (approvedReviews.length > 0) {
                const totalStars = approvedReviews.reduce((sum, rev) => sum + rev.rating, 0);
                modelProfile.averageRating = Number((totalStars / approvedReviews.length).toFixed(1)); 
            }

            await modelProfile.save();

            if (isReviewApproved) sendNotification(modelProfile.userId, `⭐ Ви отримали новий відгук (${rating} зірок)!`);
            else sendNotification(modelProfile.userId, `🛡️ Новий відгук відправлено на модерацію (його поки не видно).`);

            res.json({ success: true, averageRating: modelProfile.averageRating, totalReviews: modelProfile.totalReviews, review: newReview, isPending: !isReviewApproved });
        } catch (error) {
            console.error("🔥 ПОМИЛКА ВІДГУКІВ:", error);
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    // 🗑 ВІДГУКИ: ВИДАЛЕННЯ
    router.delete('/profiles/:id/reviews/:reviewId', async (req, res) => {
        try {
            const { userId } = req.body; 
            const profileId = req.params.id;
            const reviewId = req.params.reviewId;

            const profile = await Profile.findById(profileId);
            if (!profile) return res.status(404).json({ success: false, message: 'Анкету не знайдено' });

            const user = await User.findById(userId);
            const isOwner = String(profile.userId) === String(userId);
            const isDiamond = user?.vipPackage === 'diamond';
            
            if (!(isOwner && isDiamond) && user?.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Тільки моделі зі статусом DIAMOND можуть видаляти відгуки!' });
            }

            profile.reviews = profile.reviews.filter(r => String(r._id) !== String(reviewId));
            
            const approvedReviews = profile.reviews.filter(r => r.status !== 'pending');
            profile.totalReviews = approvedReviews.length;
            if (approvedReviews.length > 0) {
                const totalStars = approvedReviews.reduce((sum, rev) => sum + rev.rating, 0);
                profile.averageRating = Number((totalStars / approvedReviews.length).toFixed(1));
            } else profile.averageRating = 0;

            await profile.save();
            res.json({ success: true, averageRating: profile.averageRating, totalReviews: profile.totalReviews });
        } catch (error) { res.status(500).json({ success: false, message: 'Помилка сервера' }); }
    });

    // 📈 ОТРИМАННЯ СТАТИСТИКИ
    router.get('/stats/:userId', async (req, res) => {
        try {
            const profiles = await Profile.find({ userId: req.params.userId });
            let totalViews = 0; let totalClicks = 0;
            const combinedDaily = {};

            profiles.forEach(p => {
                totalViews += p.views || 0;
                totalClicks += p.clicks || 0;
                if (p.dailyStats) {
                    Object.keys(p.dailyStats).forEach(date => {
                        if (!combinedDaily[date]) combinedDaily[date] = { views: 0, clicks: 0 };
                        combinedDaily[date].views += p.dailyStats[date].views;
                        combinedDaily[date].clicks += p.dailyStats[date].clicks;
                    });
                }
            });

            const sortedDates = Object.keys(combinedDaily).sort().slice(-7);
            const chartData = sortedDates.map(date => ({
                date: date.substring(5).replace('-', '.'), 
                views: combinedDaily[date].views,
                clicks: combinedDaily[date].clicks
            }));

            res.json({ success: true, totalViews, totalClicks, chartData });
        } catch (error) { res.status(500).json({ success: false }); }
    });

    return router;
};