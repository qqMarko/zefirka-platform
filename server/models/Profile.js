import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    title: { type: String },
    bio: { type: String },
    age: { type: Number },
    height: { type: String },
    weight: { type: Number },
    
    priceFrom: { type: Number },
    priceTo: { type: Number }, // 🟢 ДОДАНО ДРУГУ ЦІНУ
    
    gender: { type: String },
    bodyType: { type: String },
    hairColor: { type: String },
    fetishes: [{ type: String }],
    
    contactType: { type: String },
    contactTypes: [{ type: String }], // 🟢 ДОДАНО МАСИВ ДЛЯ ДЕКІЛЬКОХ СОЦМЕРЕЖ
    contact: { type: String },
    
    // 📸 ОСЬ ТЕ ПОЛЕ, ЯКОГО НЕ ВИСТАЧАЛО І ЯКЕ БЛОКУВАЛО ФОТКИ!
    photos: [{ type: String }], 
    
    isApproved: { type: Boolean, default: false }, // Для модерації
    vLevel: { type: Number, default: 0 },
    // ✅ ВЕРИФІКАЦІЯ (окремо від VIP): none | photo | video
    verification: { type: String, enum: ['none', 'photo', 'video'], default: 'none' },
    verifiedAt: { type: Date },
    vipExpiresAt: { type: Date },
    bumpedAt: { type: Date },
    bumpExpiresAt: { type: Date },

    // 📊 СТАТИСТИКА
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dailyStats: { type: Object, default: {} },
    // Дедуплікація: { "viewerKey": "2026-05-27" } — останній день коли зараховано
    viewedBy: { type: Object, default: {} },
    clickedBy: { type: Object, default: {} },

    // ⭐ СИСТЕМА ВІДГУКІВ ТА РЕЙТИНГІВ
    averageRating: { type: Number, default: 0 }, 
    totalReviews: { type: Number, default: 0 },  
    reviews: [{
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        clientName: { type: String }, 
        rating: { type: Number, required: true, min: 1, max: 5 }, 
        text: { type: String }, 
        date: { type: Date, default: Date.now },
        status: { type: String, default: 'approved' } 
    }],
    
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);