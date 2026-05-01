import React, { useState } from 'react';
import { Megaphone, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBroadcast = () => {
    const [broadcastText, setBroadcastText] = useState('');
    const [broadcastTarget, setBroadcastTarget] = useState('all');
    
    // Нові стани для системи знижок
    const [vipDiscountPercent, setVipDiscountPercent] = useState(0);
    const [bumpDiscountPercent, setBumpDiscountPercent] = useState(0);
    const [isActive, setIsActive] = useState(true);
    
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const handleBroadcast = async () => {
        if (!broadcastText.trim()) return toast.error('Введіть текст розсилки!');
        if (!window.confirm('🚀 Відправити це повідомлення та застосувати налаштування знижок?')) return;
        
        setIsBroadcasting(true);
        const loadingToast = toast.loading('Розсилаємо повідомлення...');
        
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: broadcastText, 
                    target: broadcastTarget,
                    vipDiscountPercent: Number(vipDiscountPercent),
                    bumpDiscountPercent: Number(bumpDiscountPercent),
                    isActive: isActive
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ Успішно доставлено ${data.count} користувачам та оновлено сайт!`, { id: loadingToast });
                // За бажанням можна очистити форму після відправки
                // setBroadcastText('');
                // setVipDiscountPercent(0);
                // setBumpDiscountPercent(0);
            } else {
                toast.error('Помилка розсилки', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Мережева помилка', { id: loadingToast });
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleClearBroadcast = async () => {
        if (!window.confirm('🗑 Скинути рупор та вимкнути всі знижки?')) return;
        
        const loadingToast = toast.loading('Очищення...');
        try {
            const res = await fetch('/api/admin/clear-broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Рупор очищено, знижки вимкнено!', { id: loadingToast });
                setBroadcastText('');
                setVipDiscountPercent(0);
                setBumpDiscountPercent(0);
                setIsActive(false);
            }
        } catch (error) {
            toast.error('Помилка очищення', { id: loadingToast });
        }
    };

    return (
        <div className="fade-in-up">
            <h2 style={{ color: '#e91e63', margin: '0 0 25px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Megaphone size={28}/> Масова Розсилка та Рупор
            </h2>
            
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

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Текст повідомлення</label>
                    <textarea 
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="Наприклад: Знижка -20% на VIP-пакети тільки сьогодні!"
                        style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none', fontSize: '15px', minHeight: '120px', resize: 'vertical' }}
                    />
                </div>

                {/* Налаштування знижок */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Знижка на VIP (%)</label>
                        <input 
                            type="number" 
                            min="0" max="100"
                            value={vipDiscountPercent} 
                            onChange={(e) => setVipDiscountPercent(e.target.value)}
                            style={{ width: '100%', padding: '14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none', fontSize: '15px' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Знижка на Підняття (%)</label>
                        <input 
                            type="number" 
                            min="0" max="100"
                            value={bumpDiscountPercent} 
                            onChange={(e) => setBumpDiscountPercent(e.target.value)}
                            style={{ width: '100%', padding: '14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none', fontSize: '15px' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                        type="checkbox" 
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#e91e63', cursor: 'pointer' }}
                    />
                    <label htmlFor="isActive" style={{ color: 'white', fontSize: '15px', cursor: 'pointer', userSelect: 'none' }}>
                        Увімкнути відображення рупора та знижок на сайті
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleBroadcast}
                        disabled={isBroadcasting}
                        style={{ flex: 2, padding: '15px', background: 'linear-gradient(90deg, #e91e63, #ff4b91)', border: 'none', color: 'white', borderRadius: '12px', cursor: isBroadcasting ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 5px 20px rgba(233, 30, 99, 0.4)', opacity: isBroadcasting ? 0.7 : 1 }} 
                        className={!isBroadcasting ? "menu-hover" : ""}
                    >
                        {isBroadcasting ? <RefreshCw className="spin" size={20}/> : <Send size={20}/>}
                        ВІДПРАВИТИ РУПОРОМ
                    </button>
                    
                    <button 
                        onClick={handleClearBroadcast}
                        disabled={isBroadcasting}
                        style={{ flex: 1, padding: '15px', background: '#222', border: '1px solid rgba(255,255,255,0.1)', color: '#ff4b91', borderRadius: '12px', cursor: isBroadcasting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
                        className="menu-hover"
                    >
                        Скинути
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminBroadcast;