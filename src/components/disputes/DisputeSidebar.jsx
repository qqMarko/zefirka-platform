import React, { useState } from 'react';
import { Plus, MessageSquare, History, Trash2 } from 'lucide-react'; // Додано Trash2
import { socket } from '../../store/useStore';

// Додано проп onDeleteDispute
const DisputeSidebar = ({ disputes, activeDispute, setActiveDispute, setIsCreatingDispute, userRole, setVerdictResultModal, accent, onDeleteDispute }) => {
    const [viewMode, setViewMode] = useState('active'); 
    const filteredDisputes = disputes.filter(d => viewMode === 'active' ? d.status === 'open' : d.status === 'closed');

    return (
        <div style={{ width: '300px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', background: '#0a0a0f', flexShrink: 0 }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', background: '#111', borderRadius: '10px', padding: '4px' }}>
                    <button onClick={() => setViewMode('active')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: viewMode === 'active' ? accent : 'transparent', color: viewMode === 'active' ? '#000' : '#888', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <MessageSquare size={16}/> Активні
                    </button>
                    <button onClick={() => setViewMode('archive')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: viewMode === 'archive' ? accent : 'transparent', color: viewMode === 'archive' ? '#000' : '#888', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <History size={16}/> Архів
                    </button>
                </div>
                
                {/* Кнопка створення спору показується тільки якщо це не адмін */}
                {userRole !== 'admin' && (
                    <button onClick={() => { setActiveDispute(null); setIsCreatingDispute(true); }} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px dashed ${accent}`, color: accent, borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }} className="menu-hover">
                        <Plus size={18} /> Відкрити спір
                    </button>
                )}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {filteredDisputes.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#555', fontSize: '13px' }}>Немає {viewMode === 'active' ? 'активних спорів' : 'закритих спорів'}</div>
                ) : (
                    filteredDisputes.map(d => (
                        <div 
                            key={d._id} 
                            onClick={() => { 
                                setIsCreatingDispute(false); 
                                setActiveDispute(d); 
                                if(d.status === 'closed' && userRole !== 'admin') setVerdictResultModal(d.verdict || 'Спір вирішено.');
                                socket.emit('join_dispute', d._id); 
                            }}
                            style={{ 
                                padding: '15px', 
                                borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                cursor: 'pointer', 
                                background: activeDispute?._id === d._id ? `${accent}15` : 'transparent', 
                                borderLeft: activeDispute?._id === d._id ? `3px solid ${accent}` : '3px solid transparent',
                                display: 'flex', // Додано для вирівнювання іконки смітника
                                justifyContent: 'space-between', 
                                alignItems: 'center'
                            }}
                            className="menu-hover"
                        >
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>Проти: {d.accusedName || d.accusedId.substring(0,8)}</div>
                                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>{new Date(d.createdAt).toLocaleDateString()}</div>
                            </div>

                            {/* Іконка видалення тільки для адміна */}
                            {userRole === 'admin' && (
                                <Trash2 
                                    size={18} 
                                    color="#ff4444" 
                                    style={{ cursor: 'pointer', opacity: 0.7, transition: '0.2s' }}
                                    onClick={(e) => onDeleteDispute(d._id, e)}
                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                    onMouseLeave={(e) => e.target.style.opacity = 0.7}
                                    title="Видалити спір назавжди"
                                />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DisputeSidebar;