import React from 'react';
import { Eye, MessageSquare } from 'lucide-react';

const AdminPanopticon = ({ allChats, setViewChat }) => {
    return (
        <div className="fade-in-up">
            <h2 style={{ color: '#ff4444', margin: '0 0 25px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><Eye size={28}/> Panopticon (Глобальне стеження)</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {allChats.length === 0 ? <div style={{ color: '#666' }}>Немає активних переписок</div> : 
                    allChats.map(chat => (
                        <div key={chat._id} style={{ background: '#0a0a0f', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,68,68,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                <span style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '16px' }}>Кімната: {chat.roomId.slice(-8)}</span>
                                <span style={{ color: '#888', fontSize: '14px', background: '#222', padding: '2px 8px', borderRadius: '12px' }}>{chat.messages?.length || 0} повідомлень</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', wordBreak: 'break-all', background: '#111', padding: '15px', borderRadius: '12px', lineHeight: '1.6' }}>
                                <div style={{ color: '#888', marginBottom: '5px' }}>Учасники:</div>
                                <div style={{ color: '#ffc107', fontWeight: 'bold' }}>👤 {chat.participants[0]}</div>
                                <div style={{ color: '#4caf50', fontWeight: 'bold' }}>👤 {chat.participants[1]}</div>
                            </div>
                            <button onClick={() => setViewChat(chat)} style={{ width: '100%', padding: '14px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} className="menu-hover">
                                <MessageSquare size={18}/> Відкрити чат
                            </button>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default AdminPanopticon;