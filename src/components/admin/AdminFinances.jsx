import React from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminFinances = ({ topUps, fetchUsers, users, setFullImage, authFetch }) => {

    const handleApproveTopUp = async (id, amount) => {
        if (!window.confirm(`Зарахувати ${amount} ₴ юзеру?`)) return;
        try {
            const res = await authFetch(`/api/admin/topups/${id}/approve`, { method: 'POST' });
            if (res.ok) { toast.success('✅ Кошти зараховано!'); fetchUsers(); }
        } catch (error) { toast.error('Помилка'); }
    };

    const handleRejectTopUp = async (id) => {
        if (!window.confirm('Відхилити цей чек? Юзер не отримає гроші.')) return;
        try {
            const res = await authFetch(`/api/admin/topups/${id}/reject`, { method: 'POST' });
            if (res.ok) { toast.success('❌ Заявку відхилено'); fetchUsers(); }
        } catch (error) { toast.error('Помилка'); }
    };

    return (
        <div className="fade-in-up">
            <h2 style={{ color: 'white', margin: '0 0 25px 0', fontSize: '24px' }}>Фінансові заявки</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {topUps.length === 0 ? <div style={{ color: '#666' }}>Немає нових оплат</div> : 
                    topUps.map(tq => {
                        const userEmail = users.find(u => u._id === tq.userId)?.email || 'Невідомий юзер';
                        return (
                            <div key={tq._id} style={{ background: '#0a0a0f', padding: '20px', borderRadius: '16px', border: '1px solid rgba(76, 175, 80, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                    <div style={{ overflow: 'hidden', paddingRight: '10px' }}>
                                        <div style={{ fontWeight: 'bold', color: 'white', fontSize: '16px', wordBreak: 'break-all' }}>{userEmail}</div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Метод: {tq.method.toUpperCase()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', color: '#4caf50', fontWeight: '900', fontSize: '24px', whiteSpace: 'nowrap' }}>+{tq.amount} ₴</div>
                                </div>
                                
                                {tq.receiptImage ? (
                                    <div onClick={() => setFullImage(tq.receiptImage)} style={{ cursor: 'zoom-in', width: '100%', height: '200px', background: '#111', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #333' }}>
                                        <img src={tq.receiptImage} alt="Чек" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: '60px', background: '#111', borderRadius: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontStyle: 'italic', fontSize: '12px' }}>Скріншот не додано</div>
                                )}

                                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px', wordBreak: 'break-all', background: '#111', padding: '10px', borderRadius: '8px' }}>
                                    <span style={{ color: '#666' }}>Хеш / Комент:</span> <br/><span style={{ color: '#fff' }}>{tq.txHash || 'Немає даних'}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={() => handleApproveTopUp(tq._id, tq.amount)} style={{ flex: 3, padding: '14px', background: '#4caf50', border: 'none', color: '#000', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(76,175,80,0.3)' }} className="menu-hover">
                                        <Check size={20}/> Зарахувати гроші
                                    </button>
                                    <button onClick={() => handleRejectTopUp(tq._id)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="menu-hover">
                                        <X size={20}/> Відхилити
                                    </button>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    );
};

export default AdminFinances;