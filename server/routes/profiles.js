import express from 'express';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, maxAge, maxPrice, fetishes, hair, body, genders, userId, fetchAll } = req.query;
        let query = {};
        
        // 🔥 СУПЕР ФІКС: Жорстко ігноруємо пусті рядки та слова "undefined", "null", "[]"
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

        // 🟢 ФІКС МОДЕРАЦІЇ: Якщо це запит каталогу (не адмінка і не особистий кабінет)
        if (fetchAll !== 'true' && !isValid(userId)) {
            query.isApproved = true; 
        }

        // 🚀 Виводимо в консоль терміналу, що саме сервер зараз шукає (для контролю)
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

router.post('/', async (req, res) => { 
    console.log("📥 [MONGOOSE] ДАНІ, ЩО ПРИЙШЛИ З ФРОНТЕНДУ:", JSON.stringify(req.body, null, 2));
    try { 
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Не передано userId' });
        }

        // 🔥 КРОК 3: НАДІЙНИЙ ЗАХИСТ НА БЕКЕНДІ (Матриця лімітів)
        // Динамічний імпорт User, щоб не було помилок циклічної залежності
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ success: false, message: 'Юзера не знайдено' });

        let maxProfiles = 1; // Безкоштовно
        if (user.vipPackage === 'diamond') maxProfiles = 10;
        else if (user.vipPackage === 'premium') maxProfiles = 5;
        else if (user.vipPackage === 'start') maxProfiles = 3;

        // Рахуємо, скільки анкет вже є у цієї моделі
        const currentProfilesCount = await Profile.countDocuments({ userId: user._id });

        if (currentProfilesCount >= maxProfiles) {
            console.log(`⛔ [БЕКЕНД] Блокування створення! Ліміт: ${maxProfiles}, Вже є: ${currentProfilesCount}`);
            return res.status(400).json({ 
                success: false, 
                message: `Ліміт вичерпано! Максимум анкет для вашого статусу: ${maxProfiles}` 
            });
        }

        // Якщо все ок - зберігаємо анкету
        const newProfile = new Profile(req.body);
        const savedProfile = await newProfile.save();
        console.log("✅ [MONGOOSE] АНКЕТА ЗБЕРЕЖЕНА! Фотки в базі:", savedProfile.photos);
        res.status(201).json({ success: true, data: savedProfile }); 
    } catch (error) { 
        console.error("❌ [MONGOOSE] ПОМИЛКА ЗБЕРЕЖЕННЯ В БД:", error);
        res.status(400).json({ success: false, message: error.message }); 
    } 
});

router.put('/:id', async (req, res) => { 
    try { 
        const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated }); 
    } catch (error) { 
        res.status(500).json({ success: false }); 
    } 
});

router.delete('/:id', async (req, res) => { 
    try { 
        await Profile.findByIdAndDelete(req.params.id); 
        res.json({ success: true }); 
    } catch (error) { 
        res.status(500).json({ success: false }); 
    } 
});

export default router;