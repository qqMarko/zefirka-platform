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
    
}, { 
    timestamps: true 
});

export default mongoose.model('User', userSchema);