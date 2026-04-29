import React, { useState } from 'react';
import { Megaphone, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBroadcast = () => {
    const [broadcastText, setBroadcastText] = useState('');
    const [broadcastTarget, setBroadcastTarget] = useState('all');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const handleBroadcast = async () => {
        if (!broadcastText.trim()) return toast.error('Введіть текст розсилки!');
        if (!window.confirm('🚀 Відправити це повідомлення вибраній аудиторії?')) return;
        
        setIsBroadcasting(true);
        const loadingToast = toast.loading('Розсилаємо повідомлення...');
        
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: broadcastText, target: broadcastTarget })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ Успішно доставлено ${data.count} користувачам!`, { id: loadingToast });
                setBroadcastText('');
            } else {
                toast.error('Помилка розсилки', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Мережева помилка', { id: loadingToast });
        } finally {
            setIsBroadcasting(false);
        }
    };

    return (
        <div className="fade-in-up">
            <h2 style={{ color: '#e91e63', margin: '0 0 25px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><Megaphone size={28}/> Масова Розсилка</h2>
            
            <div style={{ background: '#0a0a0f', padding: '30px', borderRadius: '16px', border: '1px solid rgba(233, 30, 99, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxWidth: '600px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Кому відправляємо?</label>
                    <select 
                        value={broadcastTarget} 
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        style={{ width: '100%', padding: '14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none', fontSize: '15px' }}
                    >
                        <option value="all">Всі користувачі (Моделі + Клієнти)</option>
                        <option value="model">Тільки Моделі</option>
                        <option value="client">Тільки Клієнти</option>
                    </select>
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Текст повідомлення</label>
                    <textarea 
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="Наприклад: Знижка -50% на VIP-пакети тільки сьогодні!"
                        style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none', fontSize: '15px', minHeight: '150px', resize: 'vertical' }}
                    />
                </div>

                <button 
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #e91e63, #ff4b91)', border: 'none', color: 'white', borderRadius: '12px', cursor: isBroadcasting ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 5px 20px rgba(233, 30, 99, 0.4)', opacity: isBroadcasting ? 0.7 : 1 }} 
                    className={!isBroadcasting ? "menu-hover" : ""}
                >
                    {isBroadcasting ? <RefreshCw className="spin" size={20}/> : <Send size={20}/>}
                    ВІДПРАВИТИ РУПОРОМ
                </button>
            </div>
        </div>
    );
};

export default AdminBroadcast;