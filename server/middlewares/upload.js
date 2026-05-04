import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// 1. CLOUDINARY ДЛЯ ФОТО ПРОФІЛІВ
// ==========================================
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const profileStorage = new CloudinaryStorage({ 
    cloudinary: cloudinary, 
    params: { 
        folder: 'zefirka_profiles', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], 
        transformation: [{ width: 800, crop: 'limit' }] 
    } 
});

export const uploadProfile = multer({ storage: profileStorage });

// ==========================================
// 2. ЛОКАЛЬНЕ СХОВИЩЕ ДЛЯ ЧАТІВ
// ==========================================
const chatUploadsDir = 'uploads/chat/';
if (!fs.existsSync(chatUploadsDir)) {
    fs.mkdirSync(chatUploadsDir, { recursive: true });
}

const chatStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, chatUploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

export const uploadChat = multer({ 
    storage: chatStorage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 МБ
});

// ==========================================
// 3. ЛОКАЛЬНЕ СХОВИЩЕ ДЛЯ АРБІТРАЖУ
// ==========================================
const disputeUploadsDir = 'uploads/disputes/';
if (!fs.existsSync(disputeUploadsDir)) {
    fs.mkdirSync(disputeUploadsDir, { recursive: true });
}

const disputeStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, disputeUploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

export const uploadDispute = multer({ 
    storage: disputeStorage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20 МБ
});