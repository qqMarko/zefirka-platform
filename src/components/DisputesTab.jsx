import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import useStore, { socket } from '../store/useStore';
import { toast } from 'react-hot-toast';

// Імпортуємо розбиті компоненти
import DisputeSidebar from './disputes/DisputeSidebar';
import DisputeCreate from './disputes/DisputeCreate';
import DisputeChat from './disputes/DisputeChat';
import AdminVerdictModal from './disputes/AdminVerdictModal';
import UserVerdictModal from './disputes/UserVerdictModal';

const DisputesTab = ({ userUniqueId, userRole, hasDisputeAccess, forcedDispute, accent = '#ff4081' }) => {
    // СТЕЙТИ ДАНИХ
    const [disputes, setDisputes] = useState([]);
    const [activeDispute, setActiveDispute] = useState(null);
    const [isCreatingDispute, setIsCreatingDispute] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    // СТЕЙТИ АДМІНА (Заплановані дії та Вирок)
    const [adminActions, setAdminActions] = useState({
        initiator: { trustChange: 0, ban: false },
        accused: { trustChange: 0, ban: false }
    });
    const [showVerdictModal, setShowVerdictModal] = useState(false);
    const [verdictText, setVerdictText] = useState('');

    // СТЕЙТ ГЛОБАЛЬНОГО ВИРОКУ
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
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.success) setDisputes(data.data);
        } catch (err) { console.error(err); }
    };

    // Скидання дій при зміні спору
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

    // СОКЕТИ
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

    // ВИКОНАННЯ ВИРОКУ
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

            const res = await fetch(`/api/disputes/${activeDispute._id}/resolve`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ verdict: finalVerdictText })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('Спір закрито!', { id: loading });
                setAdminActions({ initiator: { trustChange: 0, ban: false }, accused: { trustChange: 0, ban: false } });
                triggerClientUpdate(); 
                setActiveDispute(prev => ({ ...prev, status: 'closed', verdict: finalVerdictText }));
                fetchDisputes();
            } else toast.error(data.message || 'Помилка', { id: loading });
        } catch (e) { toast.error('Помилка виконання', { id: loading }); }
    };

    if (!hasDisputeAccess && !forcedDispute) {
        return (
            <>
                <UserVerdictModal verdictResultModal={verdictResultModal} setVerdictResultModal={setVerdictResultModal} accent={accent} />
                <div style={{ padding: '50px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: '1px solid #333' }}>
                    <ShieldAlert size={60} color="#555" style={{margin: '0 auto 20px'}}/>
                    <h2 style={{color: '#fff'}}>Розділ Арбітражу</h2>
                    <p style={{color: '#888'}}>Доступ до цього розділу мають лише користувачі з пакетами Premium, Diamond та вище.</p>
                </div>
            </>
        );
    }

    return (
        <div style={{ 
            display: 'flex', height: forcedDispute ? '100%' : 'calc(100vh - 180px)', minHeight: forcedDispute ? '0' : '500px', maxHeight: forcedDispute ? 'none' : '800px',
            width: '100%', background: '#050508', borderRadius: forcedDispute ? '0' : '16px', border: forcedDispute ? 'none' : `1px solid ${accent}44`, overflow: 'hidden' 
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
                <DisputeSidebar 
                    disputes={disputes} activeDispute={activeDispute} setActiveDispute={setActiveDispute}
                    setIsCreatingDispute={setIsCreatingDispute} userRole={userRole} 
                    setVerdictResultModal={setVerdictResultModal} accent={accent}
                />
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative', overflow: 'hidden' }}>
                {isCreatingDispute ? (
                    <DisputeCreate userUniqueId={userUniqueId} fetchDisputes={fetchDisputes} setIsCreatingDispute={setIsCreatingDispute} setActiveDispute={setActiveDispute} accent={accent} />
                ) : activeDispute ? (
                    <DisputeChat 
                        activeDispute={activeDispute} userUniqueId={userUniqueId} userRole={userRole}
                        setFullscreenImage={setFullscreenImage} adminActions={adminActions} setAdminActions={setAdminActions}
                        setShowVerdictModal={setShowVerdictModal} accent={accent}
                    />
                ) : <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333' }}>Виберіть спір з лівого меню</div>}
            </div>
        </div>
    );
};

export default DisputesTab;