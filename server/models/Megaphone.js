import mongoose from 'mongoose';

const megaphoneSchema = new mongoose.Schema({
  message: { type: String, default: '' },
  vipDiscountPercent: { type: Number, default: 0 },
  bumpDiscountPercent: { type: Number, default: 0 },
  activeVipPackages: [{ type: String }], // 🔥 масив пакетів зі знижкою
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Megaphone', megaphoneSchema);