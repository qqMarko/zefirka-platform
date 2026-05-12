import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { accent } from '../styles/theme';

export const useProfileActions = ({ 
    userUniqueId, balance, user, loadBalance, loadMyModels, loadCatalog, models, setModels, myModels, setMyModels 
}) => {
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', modelId: null, title: '', text: '' });
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletInitialAmount, setWalletInitialAmount] = useState('500');

    const promptBump = (id) => {
        if (user?.freeBumps > 0) {
            setConfirmModal({ isOpen: true, type: 'free_bump', modelId: id, title: '🚀 Використати підняття?', text: `Залишилось ще ${user.freeBumps} безкоштовних підняттів. Використати одне зараз, щоб підняти анкету в ТОП?` });
        } else {
            setConfirmModal({ isOpen: true, type: 'bump', modelId: id, title: 'Підняти анкету?', text: 'Ви дійсно хочете підняти анкету в ТОП на 24 години за 150 ₴?' });
        }
    };

    const promptDelete = (id) => setConfirmModal({ isOpen: true, type: 'delete', modelId: id, title: 'Видалити анкету?', text: 'Ви впевнені, що хочете назавжди видалити цю анкету? Відмінити дію буде неможливо.' });

    const executeBump = async (id) => {
        setConfirmModal({ isOpen: false });
        if (balance < 150) {
            toast.error('Недостатньо коштів для підйому. Поповніть баланс на 150 ₴');
            setWalletInitialAmount('150');
            setShowWalletModal(true);
            return;
        }
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.102:5000/api'; 
            const response = await fetch(`${BASE_URL}/wallet/buy-vip`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, amount: 150, packageId: 'bump' })
            });
            const result = await response.json();
            if (result.success) {
                toast.success('🚀 Анкету успішно піднято в ТОП!', { style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
                loadBalance(userUniqueId); loadMyModels(userUniqueId); loadCatalog(); 
            } else toast.error(result.message || 'Помилка при підйомі.');
        } catch (error) { toast.error('Помилка з\'єднання з сервером.'); }
    };

    const executeFreeBump = async (id) => {
        setConfirmModal({ isOpen: false });
        const loadingToast = toast.loading('Піднімаємо анкету...');
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.102:5000/api'; 
            const response = await fetch(`${BASE_URL}/wallet/use-free-bump`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId })
            });
            const result = await response.json();
            if (result.success) {
                toast.success(`🚀 Анкету успішно піднято в ТОП! Залишилось: ${result.freeBumps} шт.`, { id: loadingToast, duration: 4000 });
                loadBalance(userUniqueId); loadMyModels(userUniqueId); loadCatalog(); 
            } else toast.error(result.message || 'Помилка при підйомі.', { id: loadingToast });
        } catch (error) { toast.error('Помилка з\'єднання з сервером.', { id: loadingToast }); }
    };

    // 🟢 ВИПРАВЛЕНО: Додано BASE_URL та Токен авторизації
    const executeDelete = async (id) => {
        setConfirmModal({ isOpen: false });
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.102:5000/api'; 
            const currentToken = localStorage.getItem('zefirka_token') || localStorage.getItem('token'); // Беремо токен

            const response = await fetch(`${BASE_URL}/profiles/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}` // Передаємо токен, щоб не було 401 помилки
                }
            });
            
            if (!response.ok) throw new Error('Помилка сервера');
            
            setModels(models.filter(m => m.id !== id));
            setMyModels(myModels.filter(m => m.id !== id));
            toast('Анкету видалено', { icon: '🗑️', style: { background: '#111', color: '#fff', border: '1px solid #ff4444' } });
        } catch (error) { 
            console.error(error);
            toast.error('❌ Не вдалося видалити анкету'); 
        }
    };

    return {
        confirmModal, setConfirmModal,
        showWalletModal, setShowWalletModal,
        walletInitialAmount, setWalletInitialAmount,
        promptBump, promptDelete,
        executeBump, executeFreeBump, executeDelete
    };
};