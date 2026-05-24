import './config/env.js';
import mongoose from 'mongoose';
import User from './models/User.js';

const email = 'holikov.m13@gmail.com'; // змінити

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
);

if (user) {
    console.log(`✅ Роль змінено: ${user.email} → ${user.role}`);
} else {
    console.log('❌ Користувача не знайдено');
}

await mongoose.disconnect();