import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DisputeCreate = ({ userUniqueId, fetchDisputes, setIsCreatingDispute, setActiveDispute, accent }) => {
    const [createForm, setCreateForm] = useState({ accusedId: '', reason: '', files: null });

    const handleCreateDispute = async (e) => {
        e.preventDefault();
        if (!createForm.accusedId || !createForm.reason) return toast.error('Заповніть всі поля');

        const formData = new FormData();
        formData.append('initiatorId', userUniqueId);
        formData.append('accusedId', createForm.accusedId);
        formData.append('reason', createForm.reason);
        if (createForm.files) Array.from(createForm.files).forEach(file => formData.append('screenshots', file));

        const tid = toast.loading('Створення скарги...');
        try {
            const res = await fetch('/api/disputes', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                toast.success('Скаргу відкрито!', { id: tid });
                fetchDisputes();
                setIsCreatingDispute(false);
                setActiveDispute(data.dispute);
            } else toast.error(data.message || 'Помилка', { id: tid });
        } catch (err) { toast.error('Помилка сервера', { id: tid }); }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '560px', margin: '0 auto', width: '100%', overflowY: 'auto', boxSizing: 'border-box' }} className="custom-scrollbar fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${accent}18`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldAlert size={18} color={accent} />
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#fff' }}>Створення скарги</div>
            </div>

            <form onSubmit={handleCreateDispute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.9px', display: 'block', marginBottom: '8px' }}>ID Користувача</label>
                    <input
                        type="text" required value={createForm.accusedId}
                        onChange={e => setCreateForm({...createForm, accusedId: e.target.value})}
                        placeholder="Вставте ID порушника..."
                        style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', background: '#141422', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', outline: 'none', fontSize: '14px', fontFamily: 'inherit', transition: 'border-color 0.18s' }}
                        onFocus={e => e.target.style.borderColor = accent}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.9px', display: 'block', marginBottom: '8px' }}>Суть проблеми</label>
                    <textarea
                        required value={createForm.reason}
                        onChange={e => setCreateForm({...createForm, reason: e.target.value})}
                        placeholder="Опишіть ситуацію детально..."
                        rows={5}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', background: '#141422', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', outline: 'none', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.6', transition: 'border-color 0.18s' }}
                        onFocus={e => e.target.style.borderColor = accent}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                {/* File upload — custom styled */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.9px', display: 'block', marginBottom: '8px' }}>Докази (Скріншоти)</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', background: '#141422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.18s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}
                    >
                        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', fontSize: '12px', fontWeight: '700', color: '#ccc', whiteSpace: 'nowrap' }}>
                            Вибрати файли
                        </div>
                        <span style={{ fontSize: '13px', color: '#55556a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {createForm.files && createForm.files.length > 0
                                ? Array.from(createForm.files).map(f => f.name).join(', ')
                                : 'Файл не вибрано'}
                        </span>
                        <input type="file" multiple accept="image/*" onChange={e => setCreateForm({...createForm, files: e.target.files})} style={{ display: 'none' }} />
                    </label>
                </div>

                <button type="submit" style={{
                    padding: '14px', marginTop: '4px',
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    border: 'none', color: '#fff', fontWeight: '800', fontSize: '14px',
                    borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 4px 18px ${accent}44`, letterSpacing: '0.3px',
                    transition: 'opacity 0.18s',
                }}>
                    Відправити скаргу в Арбітраж
                </button>
            </form>
        </div>
    );
};

export default DisputeCreate;