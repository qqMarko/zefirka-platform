import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    priceFrom: { type: Number, default: 500 }, 
    gender: { type: String, required: true },
    bio: { type: String, default: '' },
    photos: [{ type: String }],
    isNSFW: { type: Boolean, default: false },
    
    hairColor: { type: String, default: '' },
    bodyType: { type: String, default: '' },
    fetishes: [{ type: String }],

    vLevel: { type: Number, default: 0 }, 
    vipExpiresAt: { type: Date, default: null },
    bumpedAt: { type: Date, default: null },
    bumpExpiresAt: { type: Date, default: null },
    
    trustScore: { type: Number, default: 100 }, 
    isVerified: { type: Boolean, default: false },

    // 🔥 НАЙГОЛОВНІШЕ ПОЛЕ ДЛЯ МОДЕРАЦІЇ
    isApproved: { type: Boolean, default: false } 
}, { 
    timestamps: true 
});

export default mongoose.model('Profile', profileSchema);