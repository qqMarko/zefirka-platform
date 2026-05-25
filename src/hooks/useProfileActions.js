import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { accent } from '../styles/theme';
import useStore from '../store/useStore'; 
import { useMegaphone } from '../context/MegaphoneContext';

export const useProfileActions = ({ 
    userUniqueId, balance, user, loadBalance, loadMyModels, loadCatalog, models, setModels, myModels, setMyModels 
}) => {
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', modelId: null, title: '', text: '' });
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletInitialAmount, setWalletInitialAmount] = useState('500');

    const megaphone = useMegaphone();
    const BUMP_BASE_PRICE = 150;
    // Знижка на підняття з рупора (якщо акція активна)
    const bumpDiscountPct = megaphone.isActive ? (megaphone.bumpDiscountPercent || 0) : 0;
    const bumpPrice = bumpDiscountPct > 0 
        ? Math.floor(BUMP_BASE_PRICE - (BUMP_BASE_PRICE * bumpDiscountPct / 100)) 
        : BUMP_BASE_PRICE;

    const promptBump = (id) => {
        if (user?.freeBumps > 0) {
            setConfirmModal({ isOpen: true, type: 'free_bump', modelId: id, title: '🚀 Використати підняття?', text: `Залишилось ще ${user.freeBumps} безкоштовних підняттів. Використати одне зараз, щоб підняти анкету в ТОП?` });
        } else if (bumpDiscountPct > 0) {
            setConfirmModal({ isOpen: true, type: 'bump', modelId: id, title: '🚀 Підняти анкету?', text: `🔥 Акція! Підняти анкету в ТОП на 24 години за ${bumpPrice} ₴ (знижка -${bumpDiscountPct}%)?` });
        } else {
            setConfirmModal({ isOpen: true, type: 'bump', modelId: id, title: 'Підняти анкету?', text: `Ви дійсно хочете підняти анкету в ТОП на 24 години за ${BUMP_BASE_PRICE} ₴?` });
        }
    };

    const promptDelete = (id) => setConfirmModal({ isOpen: true, type: 'delete', modelId: id, title: 'Видалити анкету?', text: 'Ви впевнені, що хочете назавжди видалити цю анкету? Відмінити дію буде неможливо.' });

    const executeBump = async (id) => {
        setConfirmModal({ isOpen: false });
        if (balance < bumpPrice) {
            toast.error(`Недостатньо коштів для підйому. Поповніть ще на ${bumpPrice - balance} ₴`);
            setWalletInitialAmount(String(bumpPrice));
            setShowWalletModal(true);
            return;
        }
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.102:5000/api'; 
            const response = await fetch(`${BASE_URL}/wallet/buy-vip`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userUniqueId, amount: bumpPrice, packageId: 'bump' })
            });
            const result = await response.json();
            if (result.success) {
                const msg = bumpDiscountPct > 0 
                    ? `🚀 Анкету піднято в ТОП за ${bumpPrice} ₴ (знижка -${bumpDiscountPct}%)!`
                    : '🚀 Анкету успішно піднято в ТОП!';
                toast.success(msg, { style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
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

    // 🟢 ВИПРАВЛЕНО: Надійна функція видалення
    const executeDelete = async (id) => {
        setConfirmModal({ isOpen: false });
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.102:5000/api'; 
            // Підстраховка: беремо токен і зі Store, і з localStorage
            const token = useStore.getState().token || localStorage.getItem('zefirka_token') || localStorage.getItem('token'); 

            const response = await fetch(`${BASE_URL}/profiles/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Помилка сервера');
            }

            // Надійна фільтрація списку анкет після видалення
            setModels(models.filter(m => m.id !== id && m._id !== id)); 
            setMyModels(myModels.filter(m => m.id !== id && m._id !== id));
            toast('Анкету видалено', { icon: '🗑️', style: { background: '#111', color: '#fff', border: '1px solid #ff4444' } });
            
        } catch (error) { 
            console.error("Помилка при видаленні:", error);
            toast.error(`❌ Не вдалося видалити анкету: ${error.message}`); 
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