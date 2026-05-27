// ═══════════════════════════════════════════════════════════════════
// ЄДИНЕ ДЖЕРЕЛО ІСТИНИ ДЛЯ ВСІХ ЛІМІТІВ ПО VIP-РІВНЮ
// ───────────────────────────────────────────────────────────────────
// vLevel:  0 = FREE   1 = START   2 = PREMIUM   3 = DIAMOND
// vipPackage (рядок) мапиться на vLevel через PACKAGE_TO_LEVEL.
// Використовується і для анкет, і для фото — щоб не було розбіжностей.
// ═══════════════════════════════════════════════════════════════════

// Мапа: назва пакету (як зберігає buy-vip) → числовий рівень
export const PACKAGE_TO_LEVEL = {
    none: 0,
    start: 1,
    vip_1: 1,
    premium: 2,
    vip_2: 2,
    diamond: 3,
    vip_3: 3,
};

// Ліміт кількості АНКЕТ на акаунт за рівнем
export const PROFILE_LIMITS = { 0: 1, 1: 3, 2: 5, 3: 10 };

// Ліміт кількості ФОТО в одній анкеті за рівнем
export const PHOTO_LIMITS = { 0: 5, 1: 5, 2: 5, 3: 5 }; // фото однаково для всіх рівнів

// Хелпер: vipPackage (рядок) → vLevel (число)
export const packageToLevel = (vipPackage) => {
    if (!vipPackage) return 0;
    return PACKAGE_TO_LEVEL[String(vipPackage).toLowerCase()] ?? 0;
};

// Хелпери прямого доступу
export const getProfileLimit = (level) => PROFILE_LIMITS[level] ?? PROFILE_LIMITS[0];
export const getPhotoLimit   = (level) => PHOTO_LIMITS[level]   ?? PHOTO_LIMITS[0];