// ─────────────────────────────────────────────────────────────────
// ZEFIRKA DESIGN SYSTEM — єдиний джерело стилів для всіх компонентів
// ─────────────────────────────────────────────────────────────────

export const accent = '#e91e63';

// ── КОЛЬОРИ ──────────────────────────────────────────────────────
export const C = {
    bg:        '#07070d',   // фон сторінки
    surface:   '#0e0e18',   // поверхня карток/модалок
    surface2:  '#141422',   // дочірні блоки всередині surface
    surface3:  '#1a1a28',   // hover-стани, активні елементи
    border:    'rgba(255,255,255,0.08)',
    borderMd:  'rgba(255,255,255,0.13)',
    borderHi:  'rgba(255,255,255,0.22)',
    text:      '#ffffff',
    textSub:   '#9999bb',   // підписи, лейбли
    textMuted: '#55556a',   // плейсхолдери, неактивне
    accent,
    accentDim: `${accent}22`,
    accentMid: `${accent}44`,
    accentGlow:`${accent}33`,
    success:   '#4caf50',
    warning:   '#ffc107',
    danger:    '#ff4444',
};

// ── РОЗМІРИ ───────────────────────────────────────────────────────
export const R = {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl:'32px',
};

// ── ТІНІ ─────────────────────────────────────────────────────────
export const shadow = {
    modal:  '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)',
    card:   '0 8px 32px rgba(0,0,0,0.6)',
    glow:   `0 0 24px ${accent}44`,
    glowSm: `0 0 12px ${accent}22`,
};

// ── ЗАГАЛЬНІ СТИЛІ ЕЛЕМЕНТІВ ─────────────────────────────────────

// Оверлей-фон (затемнення за модалкою)
export const overlay = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 9000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
};

// Тіло модалки
export const modalBox = (maxW = '480px', extra = {}) => ({
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: R.xl,
    boxShadow: shadow.modal,
    width: '100%',
    maxWidth: maxW,
    position: 'relative',
    ...extra,
});

// Кнопка головна (accent)
export const btnPrimary = (extra = {}) => ({
    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
    border: 'none',
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: '800',
    fontSize: '14px',
    letterSpacing: '0.3px',
    borderRadius: R.sm,
    padding: '13px 24px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'opacity 0.18s, transform 0.18s',
    boxShadow: `0 4px 18px ${accent}44`,
    ...extra,
});

// Кнопка вторинна (ghost)
export const btnGhost = (extra = {}) => ({
    background: 'transparent',
    border: `1px solid ${C.border}`,
    color: C.textSub,
    fontFamily: 'inherit',
    fontWeight: '700',
    fontSize: '14px',
    borderRadius: R.sm,
    padding: '13px 24px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'border-color 0.18s, color 0.18s',
    ...extra,
});

// Кнопка небезпечна (red)
export const btnDanger = (extra = {}) => ({
    ...btnPrimary(),
    background: 'linear-gradient(135deg, #ff4444, #cc2222)',
    boxShadow: '0 4px 18px rgba(255,68,68,0.35)',
    ...extra,
});

// Поле вводу
export const input = (extra = {}) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 16px',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    color: C.text,
    borderRadius: R.sm,
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.18s',
    ...extra,
});

// Секція-блок всередині модалки
export const section = (extra = {}) => ({
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: R.md,
    padding: '16px',
    ...extra,
});

// Лейбл
export const label = {
    fontSize: '11px',
    fontWeight: '800',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.9px',
    display: 'block',
    marginBottom: '8px',
};

// Заголовок модалки
export const modalTitle = {
    fontSize: '20px',
    fontWeight: '900',
    color: C.text,
    letterSpacing: '-0.3px',
    lineHeight: 1.2,
};

// Кнопка закриття (X)
export const closeBtn = {
    position: 'absolute', top: '16px', right: '16px',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: R.xs,
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: C.textSub,
    transition: 'background 0.18s, color 0.18s',
    zIndex: 2,
    fontFamily: 'inherit',
};

// Separator (горизонтальна лінія)
export const divider = {
    height: '1px',
    background: C.border,
    margin: '0',
    border: 'none',
};