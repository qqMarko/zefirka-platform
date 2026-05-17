import express from 'express';
import Profile from '../models/Profile.js';
import { getIO } from '../sockets/socketManager.js'; 
import authMiddleware from '../middlewares/auth.js'; 

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, maxAge, maxPrice, fetishes, hair, body, genders, userId, fetchAll } = req.query;
        let query = {};
        
        const isValid = (val) => val && val !== 'undefined' && val !== 'null' && val !== '' && val !== '[]';

        if (isValid(maxAge)) query.age = { $lte: Number(maxAge) };
        if (isValid(maxPrice)) query.priceFrom = { $lte: Number(maxPrice) };
        
        if (isValid(fetishes)) query.fetishes = { $in: fetishes.split(',') };
        if (isValid(hair)) query.hairColor = { $in: hair.split(',') };
        if (isValid(body)) query.bodyType = { $in: body.split(',') };
        if (isValid(genders)) query.gender = { $in: genders.split(',') };
        
        if (isValid(userId)) {
            query.userId = userId;
        }

        if (fetchAll !== 'true' && !isValid(userId)) {
            query.isApproved = true; 
        }

        const sortLogic = { vLevel: -1, bumpedAt: -1, createdAt: -1 };

        if (fetchAll === 'true') {
            const profiles = await Profile.find(query)
                .sort(sortLogic)
                // 🚀 ПІДТЯГУЄМО lastActive ДЛЯ ПЕРЕВІРКИ ОНЛАЙНУ
                .populate('userId', 'trustScore lastActive');
                
            return res.json({ success: true, data: profiles, totalItems: profiles.length, totalPages: 1 });
        }
        
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        
        const totalItems = await Profile.countDocuments(query); 
        
        const profiles = await Profile.find(query)
            .sort(sortLogic)
            .skip(skip)
            .limit(limitNumber)
            // 🚀 ПІДТЯГУЄМО lastActive ДЛЯ ПЕРЕВІРКИ ОНЛАЙНУ
            .populate('userId', 'trustScore lastActive');
        
        res.json({ success: true, data: profiles, totalItems, totalPages: Math.ceil(totalItems / limitNumber) || 1, currentPage: pageNumber });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

router.post('/', authMiddleware, async (req, res) => { 
    try { 
        const userId = req.body.userId || req.user.id;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Не передано userId' });
        }

        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ success: false, message: 'Юзера не знайдено' });

        let maxProfiles = 1; 
        if (user.vipPackage === 'diamond') maxProfiles = 10;
        else if (user.vipPackage === 'premium') maxProfiles = 5;
        else if (user.vipPackage === 'start') maxProfiles = 3;

        const currentProfilesCount = await Profile.countDocuments({ userId: user._id });

        if (currentProfilesCount >= maxProfiles) {
            return res.status(400).json({ 
                success: false, 
                message: `Ліміт вичерпано! Максимум анкет для вашого статусу: ${maxProfiles}` 
            });
        }

        const newProfile = new Profile({ ...req.body, userId: userId }); // Примусово ставимо userId з токена
        const savedProfile = await newProfile.save();
        
        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.status(201).json({ success: true, data: savedProfile }); 
    } catch (error) { 
        res.status(400).json({ success: false, message: error.message }); 
    } 
});

router.put('/:id', authMiddleware, async (req, res) => { 
    try { 
        // 🟢 Перевірка на власника
        const profile = await Profile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ success: false, message: "Анкету не знайдено" });
        }

        if (String(profile.userId) !== String(req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Ви не можете редагувати чужу анкету" });
        }

        const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.json({ success: true, data: updated }); 
    } catch (error) { 
        console.error("Помилка оновлення анкети:", error);
        res.status(500).json({ success: false, message: "Помилка сервера" }); 
    } 
});

router.delete('/:id', authMiddleware, async (req, res) => { 
    try { 
        console.log(`[DELETE] Запит на видалення анкети з ID: "${req.params.id}"`);
        
        // 1. Захист від битих запитів з фронтенду
        if (!req.params.id || req.params.id === 'undefined' || req.params.id === '[object Object]') {
            return res.status(400).json({ success: false, message: "Помилка фронтенду: передано неправильний ID анкети" });
        }

        // 2. Знаходимо анкету
        const profile = await Profile.findById(req.params.id);
        
        if (!profile) {
            console.log(`[DELETE] Анкету ${req.params.id} не знайдено в базі.`);
            // ВАЖЛИВО: віддаємо 400, щоб не викликати Logout на фронті
            return res.status(400).json({ success: false, message: "Анкету вже видалено або не знайдено" });
        }

        // 3. БЕЗПЕЧНА ПЕРЕВІРКА ПРАВ: витягуємо ID з токена у всіх можливих форматах
        const requestUserId = String(req.user?.id || req.user?._id || req.user?.userId);
        const profileOwnerId = String(profile.userId?._id || profile.userId);

        console.log(`[DELETE] Хто видаляє: ${requestUserId} | Власник: ${profileOwnerId}`);

        if (profileOwnerId !== requestUserId && req.user?.role !== 'admin') {
            console.log(`❌ Блокування: Спроба видалити чужу анкету!`);
            // ВАЖЛИВО: Ставимо статус 400 (Bad Request), а не 403, щоб фронтенд НЕ робив Logout
            return res.status(400).json({ success: false, message: "Ви не можете видалити чужу анкету" });
        }

        // 4. Видаляємо
        await Profile.findByIdAndDelete(req.params.id); 

        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        console.log(`✅ Анкета успішно видалена`);
        res.json({ success: true, message: "Анкету успішно видалено" }); 

    } catch (error) { 
        console.error("❌ Помилка видалення анкети:", error.message);
        // ВАЖЛИВО: Віддаємо статус 400 замість 500, щоб при краші бази вас не викидало з акаунту
        res.status(400).json({ success: false, message: "Помилка сервера при видаленні: " + error.message }); 
    } 
});

export default router;