import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    text: { type: String, default: '' }, // Зробили default: '', бо повідомлення може бути просто фоткою без тексту
    time: { type: String, required: true },
    
    // 🔥 НОВІ ПОЛЯ ДЛЯ МЕДІА
    type: { type: String, enum: ['text', 'image', 'video', 'audio'], default: 'text' }, 
    mediaUrl: { type: String, default: null } 
}, { _id: true });

const chatSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true }, 
    participants: [{ type: String, required: true }], 
    modelProfile: { type: Object }, 
    messages: [messageSchema], 
    
    // 🚀 ДОДАЛИ: Список ID юзерів, які ВИМКНУЛИ сповіщення для цього чату
    mutedBy: [{ type: String }] 
    
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);