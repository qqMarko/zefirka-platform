import React, { useState, useEffect } from 'react';
import { MoreVertical, TrendingUp, TrendingDown, UserX } from 'lucide-react';

const AdminDropdown = ({ role, title, adminActions, setAdminActions, accent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const actions = adminActions[role];
    const hasActiveActions = actions.ban || actions.trustChange !== 0;

    useEffect(() => {
        const handleClickOutside = (e) => { if (!e.target.closest(`.dropdown-${role}`)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [role]);

    const updateTrust = (val) => setAdminActions(p => ({ ...p, [role]: { ...p[role], trustChange: val } }));
    const toggleBan = () => setAdminActions(p => ({ ...p, [role]: { ...p[role], ban: !p[role].ban } }));

    return (
        <div className={`dropdown-${role}`} style={{ position: 'relative' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ background: hasActiveActions ? 'rgba(255, 64, 129, 0.15)' : 'transparent', border: `1px solid ${hasActiveActions ? accent : '#333'}`, color: hasActiveActions ? accent : '#ccc', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                {title} {hasActiveActions && <span style={{ width: '8px', height: '8px', background: accent, borderRadius: '50%', display: 'inline-block' }}></span>} <MoreVertical size={14} />
            </button>

            {isOpen && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '15px', width: '230px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 100 }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>📝 Заплановані Дії</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <div style={{ fontSize: '13px', color: '#ccc' }}>Рейтинг довіри:</div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => updateTrust(actions.trustChange === 10 ? 0 : 10)} style={{ flex: 1, background: actions.trustChange === 10 ? '#4caf50' : '#1a2e1e', color: actions.trustChange === 10 ? '#000' : '#4caf50', border: '1px solid #4caf50', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}><TrendingUp size={14}/> +10</button>
                            <button onClick={() => updateTrust(actions.trustChange === -15 ? 0 : -15)} style={{ flex: 1, background: actions.trustChange === -15 ? '#f44336' : '#361818', color: actions.trustChange === -15 ? '#fff' : '#f44336', border: '1px solid #f44336', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}><TrendingDown size={14}/> -15</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: '6px', padding: '5px 10px', marginTop: '5px', border: '1px solid #444' }}>
                            <span style={{ fontSize: '12px', color: '#888', marginRight: '5px' }}>Своє:</span>
                            <input type="number" value={actions.trustChange === 0 ? '' : actions.trustChange} onChange={(e) => updateTrust(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} placeholder="0" style={{ width: '100%', background: 'transparent', border: 'none', color: actions.trustChange > 0 ? '#4caf50' : actions.trustChange < 0 ? '#f44336' : 'white', outline: 'none', fontSize: '13px', fontWeight: 'bold' }} />
                        </div>
                    </div>
                    <div style={{ height: '1px', background: '#333', margin: '10px 0' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '13px', color: actions.ban ? '#f44336' : '#ccc', display: 'flex', alignItems: 'center', gap: '5px' }}><UserX size={16} color={actions.ban ? '#f44336' : '#ccc'}/> {actions.ban ? 'Буде забанено' : 'Забанити юзера'}</div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                            <input type="checkbox" checked={actions.ban} onChange={toggleBan} style={{ opacity: 0, width: 0, height: 0 }} />
                            <span className={`slider round ${actions.ban ? 'checked' : ''}`} style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: actions.ban ? '#f44336' : '#444', transition: '.4s', borderRadius: '20px' }}>
                                <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: actions.ban ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                            </span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDropdown;