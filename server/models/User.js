import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' }, 
    password: { type: String, required: true },
    role: { type: String, enum: ['model', 'client', 'admin'], default: 'model' },
    balance: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 100 },
    trustPercentage: { type: Number, default: 100 },
    
    // 🟢 ЧАС ОСТАННЬОЇ АКТИВНОСТІ НА ПЛАТФОРМІ
    lastActive: { type: Date, default: Date.now },
    
    // 🟢 НАЛАШТУВАННЯ СПОВІЩЕНЬ
    pushEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },

    // 🔐 ДВОФАКТОРНА АВТЕНТИФІКАЦІЯ
    twoFactorEnabled: { type: Boolean, default: false },
    
    notifications: [{
        text: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        date: { type: Date, default: Date.now }
    }],

    // 🚀 КИШЕНЯ ДЛЯ БЕЗКОШТОВНИХ РУЧНИХ ПІДНЯТТІВ (З VIP-ПАКЕТІВ)
    freeBumps: { type: Number, default: 0 },

    // 🔑 ДЛЯ ВІДНОВЛЕННЯ ПАРОЛЯ
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // 💎 ВІДСТЕЖЕННЯ VIP СТАТУСУ (ДОДАНО ДЛЯ ФРОНТЕНДУ ТА ТАЙМЕРА)
    vipPackage: { type: String, default: 'none' }, // 'start', 'premium', 'diamond' тощо
    vipExpiresAt: { type: Date, default: null },
    vipPurchasedAt: { type: Date, default: null }, // 📅 дата купівлі поточного VIP

    // 🎯 ПЕРСОНАЛЬНА МАРКЕТИНГОВА ЗНИЖКА НА АПГРЕЙД
    upgradeDiscount: {
        forPackage: { type: String, default: null },    // 'premium' або 'diamond'
        discountPercent: { type: Number, default: 0 },
        expiresAt: { type: Date, default: null }
    },

    // 📱 ВІДСТЕЖЕННЯ СЕАНСІВ ТА ПРИСТРОЇВ
    sessions: [{
        token: { type: String, required: true },
        device: { type: String, required: true }, // Назва браузера/ОС (напр. "Chrome on Windows")
        ip: { type: String },                     // IP адреса
        lastActive: { type: Date, default: Date.now }
    }]
    
}, { 
    timestamps: true 
});

export default mongoose.model('User', userSchema);