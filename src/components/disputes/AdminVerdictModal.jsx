import React from 'react';
import { Gavel } from 'lucide-react';

const adminVerdictTemplates = [
    "Спір вирішено на користь ініціатора. До порушника застосовано санкції.",
    "Недостатньо доказів. Спір закрито без застосування покарань.",
    "Шахрайство підтверджено. Акаунт порушника заблоковано.",
    "Обидві сторони порушили правила спілкування. Знято рейтинг довіри."
];

const AdminVerdictModal = ({ showVerdictModal, setShowVerdictModal, verdictText, setVerdictText, executeVerdictAndResolve, accent }) => {
    if (!showVerdictModal) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} className="fade-in">
            <div style={{ background: '#111', padding: '25px', borderRadius: '16px', border: `1px solid ${accent}`, width: '100%', maxWidth: '450px', boxShadow: `0 10px 40px ${accent}44` }}>
                <h3 style={{ color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Gavel color={accent}/> Винесення вироку</h3>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '15px' }}>Опишіть рішення. Усі заплановані вами дії (бани, штрафи) будуть застосовані та <b>дописані до тексту автоматично</b>.</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {adminVerdictTemplates.map((tpl, idx) => (
                        <button key={idx} onClick={() => setVerdictText(tpl)} style={{ background: '#222', border: '1px solid #444', color: '#aaa', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', textAlign: 'left' }} className="menu-hover">
                            {tpl.substring(0, 35)}...
                        </button>
                    ))}
                </div>

                <textarea value={verdictText} onChange={e => setVerdictText(e.target.value)} placeholder="Або введіть свій текст вироку вручну..." style={{ width: '100%', padding: '15px', background: '#000', color: 'white', border: '1px solid #333', borderRadius: '12px', minHeight: '120px', marginBottom: '20px', resize: 'vertical', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowVerdictModal(false)} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Скасувати</button>
                    <button onClick={executeVerdictAndResolve} style={{ padding: '10px 20px', background: accent, color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Підтвердити та Закрити</button>
                </div>
            </div>
        </div>
    );
};

export default AdminVerdictModal;