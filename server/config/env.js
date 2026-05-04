import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шукаємо файл .env у головній папці проєкту (на рівень вище від server)
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('✅ Змінні оточення (.env) завантажено!');