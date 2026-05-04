import mongoose from 'mongoose';

const topUpSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String },
    currencyEq: { type: String },
    receiptImage: { type: String },
    txHash: { type: String },
    status: { type: String, default: 'pending' }, // pending, approved, rejected
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TopUpRequest', topUpSchema);