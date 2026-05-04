import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const getTransporter = () => nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
});

export const sendSmartEmail = async (user, subject, textContent) => {
    if (user && user.emailNotifications && user.email) {
        try {
            const html = `
                <div style="background-color:#0a0a0f; color:#ffffff; padding:30px; border-radius:16px; font-family:sans-serif; border: 1px solid #ff4081; max-width: 500px; margin: 0 auto;">
                    <h2 style="color:#ff4081; text-align:center; margin-top:0;">ZEFIRKA CHAT</h2>
                    <p style="font-size:16px; line-height:1.6; color:#d4d4d8;">${textContent}</p>
                    <hr style="border-color:#27272a; margin: 20px 0;">
                    <p style="font-size:12px; color:#71717a; text-align:center;">Ви можете вимкнути ці сповіщення в налаштуваннях профілю.</p>
                </div>
            `;
            await getTransporter().sendMail({ from: process.env.EMAIL_USER, to: user.email, subject, html });
            console.log(`✉️ Лист успішно відправлено: ${user.email}`);
        } catch (error) { 
            console.error('Помилка відправки листа:', error); 
        }
    }
};