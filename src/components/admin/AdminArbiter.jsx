import React from 'react';
import { Gavel } from 'lucide-react';

const AdminArbiter = ({ adminDisputes, setViewDispute }) => {
    return (
        <div className="arbiter-window fade-in-up">
            <h2 style={{ color: '#ff4444', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900' }}>
                <Gavel size={28} color="#ff4444" /> Активні спори (Пріоритетна черга)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {adminDisputes.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#0a0a0f', borderRadius: '16px' }}>
                        Немає активних спорів
                    </div>
                ) : (
                    adminDisputes.map(d => (
                        <div key={d._id} style={{ 
                            padding: '20px', background: '#0a0a0f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                            borderLeft: `5px solid ${d.priority === 3 ? '#00ffff' : d.priority === 2 ? '#ffc107' : '#ff4444'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Подав: <span style={{color: '#ff4444'}}>{d.initiatorId}</span> 
                                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {d.initiatorPackage?.toUpperCase() || 'BASIC'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Обвинувачений: {d.accusedId}</div>
                                <p style={{ marginTop: '12px', fontSize: '13px', color: '#ccc', lineHeight: '1.5', maxWidth: '600px' }}>
                                    <strong>Суть:</strong> {d.reason}
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => setViewDispute(d)} 
                                style={{ background: '#ff4444', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                                className="menu-hover"
                            >
                                Увійти як Арбітр
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminArbiter;