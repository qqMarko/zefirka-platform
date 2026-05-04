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
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', width: '100%', overflowY: 'auto' }} className="custom-scrollbar fade-in">
            <h2 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldAlert color={accent}/> Створення скарги</h2>
            <form onSubmit={handleCreateDispute} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>ID Користувача</label>
                    <input type="text" required value={createForm.accusedId} onChange={e => setCreateForm({...createForm, accusedId: e.target.value})} placeholder="Вставте ID порушника..." style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', outline: 'none' }} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Суть проблеми</label>
                    <textarea required value={createForm.reason} onChange={e => setCreateForm({...createForm, reason: e.target.value})} placeholder="Опишіть ситуацію детально..." rows={5} style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', outline: 'none', resize: 'vertical' }} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Докази (Скріншоти)</label>
                    <input type="file" multiple accept="image/*" onChange={e => setCreateForm({...createForm, files: e.target.files})} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#aaa', borderRadius: '12px' }} />
                </div>
                <button type="submit" style={{ padding: '15px', background: accent, border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', marginTop: '10px' }} className="menu-hover">
                    Відправити скаргу в Арбітраж
                </button>
            </form>
        </div>
    );
};

export default DisputeCreate;