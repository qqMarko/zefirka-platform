import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock } from 'lucide-react';
import useStore, { socket } from '../store/useStore';
import { toast } from 'react-hot-toast';

import DisputeSidebar from './disputes/DisputeSidebar';
import DisputeCreate from './disputes/DisputeCreate';
import DisputeChat from './disputes/DisputeChat';
import AdminVerdictModal from './disputes/AdminVerdictModal';
import UserVerdictModal from './disputes/UserVerdictModal';

const DisputesTab = ({ userUniqueId, userRole, hasDisputeAccess, forcedDispute, accent = '#ff4081', onDisputeClosed }) => {
    const [disputes, setDisputes] = useState([]);
    const [activeDispute, setActiveDispute] = useState(null);
    const [isCreatingDispute, setIsCreatingDispute] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    const [adminActions, setAdminActions] = useState({
        initiator: { trustChange: 0, ban: false },
        accused: { trustChange: 0, ban: false }
    });
    const [showVerdictModal, setShowVerdictModal] = useState(false);
    const [verdictText, setVerdictText] = useState('');
    const [verdictResultModal, setVerdictResultModal] = useState(null);

    const triggerClientUpdate = () => {
        try {
            const state = useStore.getState();
            if (state.checkAuth) state.checkAuth();
            if (state.fetchProfile) state.fetchProfile();
            if (state.loadUser) state.loadUser();
            window.dispatchEvent(new Event('user_data_updated'));
        } catch(e) { console.error("Помилка оновлення клієнта:", e); }
    };

    const fetchDisputes = async () => {
        const endpoint = userRole === 'admin' ? '/api/admin/disputes' : `/api/disputes/user/${userUniqueId}`;
        try {
            const token = localStorage.getItem('zefirka_token');
            const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setDisputes(data.data);
        } catch (err) { console.error(err); }
    };

    // ✅ ВИПРАВЛЕНО: deleteDispute перенесено ВИЩЕ return, щоб не крашило компонент
    const deleteDispute = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Ви впевнені, що хочете видалити цей спір назавжди?')) return;

        const loadingId = toast.loading('Видалення...');
        try {
            const tk = localStorage.getItem('zefirka_token');
            const res = await fetch(`/api/admin/disputes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tk}` } });
            const data = await res.json();

            if (data.success || res.ok) {
                toast.success('Спір видалено', { id: loadingId });
                setDisputes(prev => prev.filter(d => d._id !== id));
                if (activeDispute?._id === id) setActiveDispute(null);
            } else {
                toast.error('Помилка видалення', { id: loadingId });
            }
        } catch (err) {
            toast.error('Помилка сервера', { id: loadingId });
        }
    };

    useEffect(() => {
        setAdminActions({ initiator: { trustChange: 0, ban: false }, accused: { trustChange: 0, ban: false } });
    }, [activeDispute?._id]);

    useEffect(() => {
        if (forcedDispute) {
            setActiveDispute(forcedDispute);
            setIsCreatingDispute(false);
            socket.emit('join_dispute', forcedDispute._id);
            return;
        }
        if (hasDisputeAccess) fetchDisputes();
    }, [userUniqueId, userRole, hasDisputeAccess, forcedDispute]);

    useEffect(() => {
        const handleNewMessage = (newMsg) => {
            setActiveDispute(prev => (prev && (prev._id === newMsg.disputeId || !newMsg.disputeId) ? { ...prev, messages: [...prev.messages, newMsg] } : prev));
        };

        const handleDisputeClosed = (data) => {
            const closedId = typeof data === 'object' ? data.id : data;
            const serverVerdict = typeof data === 'object' ? data.verdict : 'Спір вирішено адміністрацією.';

            fetchDisputes();
            triggerClientUpdate();

            setActiveDispute(prev => {
                if (prev && prev._id === closedId) {
                    setVerdictResultModal(serverVerdict);
                    return { ...prev, status: 'closed', verdict: serverVerdict };
                }
                return prev;
            });
        };

        socket.on('receive_dispute_message', handleNewMessage);
        socket.on('dispute_closed', handleDisputeClosed);

        return () => {
            socket.off('receive_dispute_message', handleNewMessage);
            socket.off('dispute_closed', handleDisputeClosed);
        };
    }, [activeDispute, userRole]);

    const executeVerdictAndResolve = async () => {
        if (!verdictText.trim()) return toast.error('Будь ласка, введіть текст вироку!');
        setShowVerdictModal(false);

        const loading = toast.loading('Застосування санкцій та закриття...');

        try {
            const actions = [];
            let penaltiesInfo = [];

            if (adminActions.initiator.ban) {
                actions.push(fetch(`/api/admin/users/${activeDispute.initiatorId}/toggle-ban`, { method: 'POST' }));
                penaltiesInfo.push('🔴 Ініціатора заблоковано.');
            }
            if (adminActions.initiator.trustChange !== 0) {
                actions.push(fetch(`/api/admin/users/${activeDispute.initiatorId}/update-trust`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ score: adminActions.initiator.trustChange })
                }));
                const sign = adminActions.initiator.trustChange > 0 ? '+' : '';
                penaltiesInfo.push(`⭐ Рейтинг ініціатора: ${sign}${adminActions.initiator.trustChange}`);
            }

            if (adminActions.accused.ban) {
                actions.push(fetch(`/api/admin/users/${activeDispute.accusedId}/toggle-ban`, { method: 'POST' }));
                penaltiesInfo.push('🔴 Порушника заблоковано.');
            }
            if (adminActions.accused.trustChange !== 0) {
                actions.push(fetch(`/api/admin/users/${activeDispute.accusedId}/update-trust`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ score: adminActions.accused.trustChange })
                }));
                const sign = adminActions.accused.trustChange > 0 ? '+' : '';
                penaltiesInfo.push(`⭐ Рейтинг порушника: ${sign}${adminActions.accused.trustChange}`);
            }

            let finalVerdictText = verdictText;
            if (penaltiesInfo.length > 0) {
                finalVerdictText += '\n\n⚖️ ЗАСТОСОВАНІ САНКЦІЇ:\n' + penaltiesInfo.join('\n');
            }

            if (actions.length > 0) await Promise.all(actions);

            const token = localStorage.getItem('zefirka_token');
            const res = await fetch(`/api/disputes/${activeDispute._id}/resolve`, {
                method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ verdict: finalVerdictText })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Спір закрито!', { id: loading });

                if (typeof onDisputeClosed === 'function') {
                    onDisputeClosed(activeDispute._id);
                }

                setAdminActions({ initiator: { trustChange: 0, ban: false }, accused: { trustChange: 0, ban: false } });
                triggerClientUpdate();
                setActiveDispute(prev => ({ ...prev, status: 'closed', verdict: finalVerdictText }));
                fetchDisputes();
            } else toast.error(data.message || 'Помилка', { id: loading });
        } catch (e) { toast.error('Помилка виконання', { id: loading }); }
    };

    if (!hasDisputeAccess && !forcedDispute) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', background: '#0b0b15', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <UserVerdictModal verdictResultModal={verdictResultModal} setVerdictResultModal={setVerdictResultModal} accent={accent} />
                <div style={{ padding: '50px', textAlign: 'center', margin: 'auto' }}>
                    <Lock size={60} color="#555" style={{margin: '0 auto 20px'}}/>
                    <h2 style={{color: '#fff'}}>Розділ Арбітражу недоступний</h2>
                    <p style={{color: '#888'}}>Цей розділ доступний лише для пакетів Premium, Diamond та вище.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`zef-disputes-layout ${activeDispute || isCreatingDispute ? 'has-active' : 'no-active'}`} style={{
            display: 'flex', height: forcedDispute ? '100%' : 'calc(100vh - 180px)', minHeight: forcedDispute ? '0' : '500px', maxHeight: forcedDispute ? 'none' : '800px',
            width: '100%', background: '#0b0b15', borderRadius: forcedDispute ? '0' : '16px', border: forcedDispute ? 'none' : '1px solid rgba(255,255,255,0.08)', overflow: 'hidden'
        }}>
            <UserVerdictModal verdictResultModal={verdictResultModal} setVerdictResultModal={setVerdictResultModal} accent={accent} />

            <AdminVerdictModal
                showVerdictModal={showVerdictModal} setShowVerdictModal={setShowVerdictModal}
                verdictText={verdictText} setVerdictText={setVerdictText}
                executeVerdictAndResolve={executeVerdictAndResolve} accent={accent}
            />

            {fullscreenImage && (
                <div onClick={() => setFullscreenImage(null)} style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', cursor: 'zoom-out' }} className="fade-in">
                    <img src={fullscreenImage} alt="Fullscreen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} />
                </div>
            )}

            {!forcedDispute && (
                <div className="zef-disputes-sidebar">
                    <DisputeSidebar
                        disputes={disputes} activeDispute={activeDispute} setActiveDispute={setActiveDispute}
                        setIsCreatingDispute={setIsCreatingDispute} userRole={userRole}
                        setVerdictResultModal={setVerdictResultModal} accent={accent}
                        onDeleteDispute={deleteDispute}
                    />
                </div>
            )}

            <div className="zef-disputes-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#07070d', position: 'relative', overflow: 'hidden' }}>
                {isCreatingDispute ? (
                    <DisputeCreate userUniqueId={userUniqueId} fetchDisputes={fetchDisputes} setIsCreatingDispute={setIsCreatingDispute} setActiveDispute={setActiveDispute} accent={accent} />
                ) : activeDispute ? (
                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                        {/* Кнопка "назад до списку" — тільки на мобілці */}
                        <button className="zef-disputes-back" onClick={() => setActiveDispute(null)} style={{ display: 'none' }}>
                            ‹ До списку спорів
                        </button>
                        <DisputeChat
                            activeDispute={activeDispute} userUniqueId={userUniqueId} userRole={userRole}
                            setFullscreenImage={setFullscreenImage} adminActions={adminActions} setAdminActions={setAdminActions}
                            setShowVerdictModal={setShowVerdictModal} accent={accent}
                        />
                    </div>
                ) : <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333' }}>Виберіть спір з лівого меню</div>}
            </div>
        </div>
    );
};

export default DisputesTab;