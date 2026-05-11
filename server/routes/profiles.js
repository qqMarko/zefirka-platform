import express from 'express';
import Profile from '../models/Profile.js';
import { getIO } from '../sockets/socketManager.js'; 
import authMiddleware from '../middlewares/auth.js'; 

const router = express.Router();

// 🟢 GET залишаємо БЕЗ authMiddleware, щоб каталог анкет могли бачити неавторизовані юзери
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

        console.log("🔍 Бекенд шукає анкети за запитом:", query); 

        const sortLogic = { vLevel: -1, bumpedAt: -1, createdAt: -1 };

        if (fetchAll === 'true') {
            const profiles = await Profile.find(query).sort(sortLogic);
            return res.json({ success: true, data: profiles, totalItems: profiles.length, totalPages: 1 });
        }
        
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        
        const totalItems = await Profile.countDocuments(query); 
        const profiles = await Profile.find(query).sort(sortLogic).skip(skip).limit(limitNumber);
        
        res.json({ success: true, data: profiles, totalItems, totalPages: Math.ceil(totalItems / limitNumber) || 1, currentPage: pageNumber });
    } catch (error) { 
        console.error("❌ Помилка каталогу:", error);
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// 🔐 POST ЗАХИЩЕНО authMiddleware
router.post('/', authMiddleware, async (req, res) => { 
    console.log("📥 [MONGOOSE] ДАНІ, ЩО ПРИЙШЛИ З ФРОНТЕНДУ:", JSON.stringify(req.body, null, 2));
    try { 
        // Використовуємо req.user.id з токена для більшої безпеки, або req.body.userId як фолбек
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
            console.log(`⛔ [БЕКЕНД] Блокування створення! Ліміт: ${maxProfiles}, Вже є: ${currentProfilesCount}`);
            return res.status(400).json({ 
                success: false, 
                message: `Ліміт вичерпано! Максимум анкет для вашого статусу: ${maxProfiles}` 
            });
        }

        const newProfile = new Profile(req.body);
        const savedProfile = await newProfile.save();
        
        // 🚀 СИГНАЛ: НОВА АНКЕТА (Для адмінки)
        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        console.log("✅ [MONGOOSE] АНКЕТА ЗБЕРЕЖЕНА! Фотки в базі:", savedProfile.photos);
        res.status(201).json({ success: true, data: savedProfile }); 
    } catch (error) { 
        console.error("❌ [MONGOOSE] ПОМИЛКА ЗБЕРЕЖЕННЯ В БД:", error);
        res.status(400).json({ success: false, message: error.message }); 
    } 
});

// 🔐 PUT ЗАХИЩЕНО authMiddleware
router.put('/:id', authMiddleware, async (req, res) => { 
    try { 
        const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        // 🚀 СИГНАЛ: АНКЕТА ОНОВЛЕНА
        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.json({ success: true, data: updated }); 
    } catch (error) { 
        res.status(500).json({ success: false }); 
    } 
});

// 🔐 DELETE ЗАХИЩЕНО authMiddleware
router.delete('/:id', authMiddleware, async (req, res) => { 
    try { 
        await Profile.findByIdAndDelete(req.params.id); 

        // 🚀 СИГНАЛ: АНКЕТА ВИДАЛЕНА
        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.json({ success: true }); 
    } catch (error) { 
        res.status(500).json({ success: false }); 
    } 
});

export default router;