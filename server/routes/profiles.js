import express from 'express';
import Profile from '../models/Profile.js';
import { getIO } from '../sockets/socketManager.js'; 
import authMiddleware from '../middlewares/auth.js'; 

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// АЛГОРИТМ СОРТУВАННЯ КАТАЛОГУ
// ───────────────────────────────────────────────────────────────────
// РІВНІ (vLevel):  3=DIAMOND  2=PREMIUM  1=START  0=FREE
//
// Порядок у межах рівня:
//   1. Активні бампи (bumpExpiresAt > now)  → сортуються по bumpedAt DESC
//      НОВІ анкети того ж рівня НЕ можуть їх перебити протягом 24h
//   2. Свіжі анкети без бампу (< 6 год)    → createdAt DESC
//   3. Старі анкети без бампу (≥ 6 год)    → ротація кожні 6 год
//      (всі отримують рівномірний трафік, не одні й ті самі завжди зверху)
//
// Порядок між рівнями: DIAMOND > PREMIUM > START > FREE
// ═══════════════════════════════════════════════════════════════════

const FRESH_WINDOW_MS  = 6  * 60 * 60 * 1000; // 6 год — «нова» анкета
const ROTATION_PERIOD  = 6  * 60 * 60 * 1000; // ротація кожні 6 год

/** Детермінований псевдо-рандом (LCG) для стабільного shuffle за seed */
function seededRand(seed) {
    let s = seed >>> 0;
    return () => {
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        s ^= (s >>> 16);
        return (s >>> 0) / 0x100000000;
    };
}

/** Fisher-Yates shuffle з детермінованим seed */
function deterministicShuffle(arr, seed) {
    const result = [...arr];
    const rand = seededRand(seed);
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Головна функція сортування.
 * Повертає масив профілів у правильному порядку.
 */
function buildSortedCatalog(profiles) {
    const now = Date.now();
    // seed змінюється кожні 6 годин → плавна ротація
    const rotationSeed = Math.floor(now / ROTATION_PERIOD);

    // Розбиваємо на 4 рівні
    const tiers = { 3: [], 2: [], 1: [], 0: [] };
    for (const p of profiles) {
        const tier = p.vLevel || 0;
        tiers[tier].push(p);
    }

    const result = [];

    for (const tier of [3, 2, 1, 0]) {
        const group = tiers[tier];
        if (!group.length) continue;

        // ── Бампи (активні) ────────────────────────────────────────
        const bumped = group
            .filter(p => p.bumpedAt && p.bumpExpiresAt && new Date(p.bumpExpiresAt) > now)
            .sort((a, b) => new Date(b.bumpedAt) - new Date(a.bumpedAt));

        const nonBumped = group.filter(
            p => !(p.bumpedAt && p.bumpExpiresAt && new Date(p.bumpExpiresAt) > now)
        );

        // ── Свіжі (< 6 год) — найновіші зверху ────────────────────
        const fresh = nonBumped
            .filter(p => (now - new Date(p.createdAt)) < FRESH_WINDOW_MS)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // ── Старші — ротація кожні 6 год ──────────────────────────
        // Унікальний seed: rotation_period + tier, щоб рівні не крутились синхронно
        const oldProfiles = nonBumped.filter(
            p => (now - new Date(p.createdAt)) >= FRESH_WINDOW_MS
        );
        const shuffled = deterministicShuffle(oldProfiles, rotationSeed * 10 + tier);

        // Збираємо рівень: бампи → свіжі → ротація
        result.push(...bumped, ...fresh, ...shuffled);
    }

    return result;
}

// ───────────────────────────────────────────────────────────────────
// GET /profiles  (каталог + особисті анкети)
// ───────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const {
            page = 1, limit = 12,
            maxAge, maxPrice, fetishes, hair, body, genders,
            userId, fetchAll
        } = req.query;

        const isValid = (val) =>
            val && val !== 'undefined' && val !== 'null' && val !== '' && val !== '[]';

        let query = {};
        if (isValid(maxAge))    query.age       = { $lte: Number(maxAge) };
        if (isValid(maxPrice))  query.priceFrom = { $lte: Number(maxPrice) };
        if (isValid(fetishes))  query.fetishes  = { $in: fetishes.split(',') };
        if (isValid(hair))      query.hairColor = { $in: hair.split(',') };
        if (isValid(body))      query.bodyType  = { $in: body.split(',') };
        if (isValid(genders))   query.gender    = { $in: genders.split(',') };
        if (isValid(userId))    query.userId    = userId;

        // Для публічного каталогу — тільки схвалені анкети
        if (fetchAll !== 'true' && !isValid(userId)) {
            query.isApproved = true;
        }

        // ── Особисті анкети (fetchAll або конкретний userId) ───────
        // Не застосовуємо ротацію — просто рівень + дата
        if (fetchAll === 'true' || isValid(userId)) {
            const profiles = await Profile.find(query)
                .sort({ vLevel: -1, bumpedAt: -1, createdAt: -1 })
                .populate('userId', 'trustScore trustPercentage lastActive');
            return res.json({
                success: true,
                data: profiles,
                totalItems: profiles.length,
                totalPages: 1
            });
        }

        // ── Публічний каталог: сортуємо через алгоритм ─────────────
        const allProfiles = await Profile.find(query)
            .populate('userId', 'trustScore trustPercentage lastActive');

        const sorted = buildSortedCatalog(allProfiles);

        const totalItems  = sorted.length;
        const pageNumber  = Math.max(1, parseInt(page, 10));
        const limitNumber = Math.max(1, parseInt(limit, 10));
        const skip        = (pageNumber - 1) * limitNumber;
        const paginated   = sorted.slice(skip, skip + limitNumber);

        res.json({
            success: true,
            data: paginated,
            totalItems,
            totalPages: Math.ceil(totalItems / limitNumber) || 1,
            currentPage: pageNumber
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ───────────────────────────────────────────────────────────────────
// POST /profiles  (створити анкету)
// ───────────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.body.userId || req.user.id;
        if (!userId)
            return res.status(400).json({ success: false, message: 'Не передано userId' });

        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ success: false, message: 'Юзера не знайдено' });

        let maxProfiles = 1;
        if      (user.vipPackage === 'diamond') maxProfiles = 10;
        else if (user.vipPackage === 'premium') maxProfiles = 5;
        else if (user.vipPackage === 'start')   maxProfiles = 3;

        const currentCount = await Profile.countDocuments({ userId: user._id });
        if (currentCount >= maxProfiles) {
            return res.status(400).json({
                success: false,
                message: `Ліміт вичерпано! Максимум анкет: ${maxProfiles}`
            });
        }

        const newProfile  = new Profile({ ...req.body, userId });
        const savedProfile = await newProfile.save();

        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.status(201).json({ success: true, data: savedProfile });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ───────────────────────────────────────────────────────────────────
// PUT /profiles/:id  (редагувати)
// ───────────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);
        if (!profile)
            return res.status(404).json({ success: false, message: 'Анкету не знайдено' });

        if (String(profile.userId) !== String(req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Ви не можете редагувати чужу анкету' });
        }

        const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });

        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

// ───────────────────────────────────────────────────────────────────
// DELETE /profiles/:id  (видалити)
// ───────────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined')
            return res.status(400).json({ success: false, message: 'Неправильний ID' });

        const profile = await Profile.findById(req.params.id);
        if (!profile)
            return res.status(400).json({ success: false, message: 'Анкету не знайдено' });

        const requestUserId = String(req.user?.id || req.user?._id || req.user?.userId);
        const profileOwnerId = String(profile.userId?._id || profile.userId);

        if (profileOwnerId !== requestUserId && req.user?.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Ви не можете видалити чужу анкету' });
        }

        await Profile.findByIdAndDelete(req.params.id);

        const io = getIO();
        if (io) io.emit('global_sync', { action: 'reload_catalog' });

        res.json({ success: true, message: 'Анкету успішно видалено' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Помилка сервера: ' + error.message });
    }
});

export default router;