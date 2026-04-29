import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
    initiatorId: { type: String, required: true }, // Хто подав скаргу
    accusedId: { type: String, required: true },   // На кого подали скаргу
    accusedName: { type: String, default: 'Невідомо' }, // Ім'я обвинуваченого
    reason: { type: String, required: true },      // Причина (суть скарги)
    screenshots: [{ type: String }],               // Масив URL/імен файлів скріншотів доказів
    status: { type: String, enum: ['open', 'resolved'], default: 'open' }, // Статус
    accusedJoined: { type: Boolean, default: false }, // Чи зайшов обвинувачений у чат арбітражу (для штрафів)
    messages: [{
        senderId: String,
        senderRole: String,
        text: String,
        time: String,
        timestamp: Number, 
        image: String,      
    }]
}, { timestamps: true });

export default mongoose.model('Dispute', disputeSchema);