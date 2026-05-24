import React from 'react';
import { Gavel, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminArbiter = ({ adminDisputes, setViewDispute, setAdminDisputes }) => {

    // Функція для видалення спору
    const handleDeleteDispute = async (id, e) => {
        e.stopPropagation(); 
        if (!window.confirm("Ви впевнені, що хочете видалити цей спір назавжди?")) return;

        const loadingId = toast.loading('Видалення...');
        try {
            // Звертаємося до вашого бекенду для видалення
            const res = await fetch(`/api/admin/disputes/${id}`, { method: 'DELETE' });
            
            if (res.ok) {
                toast.success('Спір видалено', { id: loadingId });
                // Миттєво прибираємо спір з екрану
                if (setAdminDisputes) {
                    setAdminDisputes(prev => prev.filter(d => d._id !== id));
                }
            } else {
                toast.error('Помилка видалення', { id: loadingId });
            }
        } catch (err) {
            toast.error('Помилка сервера', { id: loadingId });
        }
    };

    return (
        // Прибрано height: 100vh, щоб батьківський AdminPanel міг нормально скролити цей список
        <div style={{ paddingBottom: '50px' }}>
            {/* Заголовок */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Gavel color="#ff4444" size={24} />
                <h2 style={{ color: '#ff4444', margin: 0, fontSize: '20px' }}>Активні спори (Пріоритетна черга)</h2>
            </div>

            {/* Контейнер карток */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {adminDisputes.length === 0 ? (
                    <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                        Список спорів порожній
                    </div>
                ) : (
                    adminDisputes.map(dispute => (
                        <div key={dispute._id} style={{
                            background: '#0a0a0f',
                            border: '1px solid #1a1a1a',
                            borderLeft: '4px solid #ff4444',
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {/* Інформація про спір */}
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', marginBottom: '8px', fontSize: '15px' }}>
                                    <strong style={{ color: '#888' }}>Подав:</strong> <span style={{ color: '#ff4444', fontWeight: 'bold' }}>{dispute.initiatorId || dispute.initiatorName}</span> <span style={{ background: '#333', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginLeft: '10px' }}>BASIC</span>
                                </div>
                                <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                                    Обвинувачений: {dispute.accusedId || dispute.accusedName}
                                </div>
                                <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>
                                    <strong style={{ color: '#888' }}>Суть:</strong> {dispute.reason || 'Опис відсутній'}
                                </div>
                            </div>

                            {/* Кнопки дій */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                                {/* Кнопка видалення (Смітник) */}
                                <button 
                                    onClick={(e) => handleDeleteDispute(dispute._id, e)}
                                    style={{ background: '#222', border: '1px solid #333', cursor: 'pointer', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Видалити спір з бази"
                                >
                                    <Trash2 size={22} color="#ff4444" />
                                </button>

                                {/* Кнопка входу в арбітр */}
                                <button 
                                    onClick={() => setViewDispute(dispute)}
                                    style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
                                >
                                    Увійти як Арбітр
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminArbiter;