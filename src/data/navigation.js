import React from 'react';
import { Crown, Wallet, Settings, AlertTriangle, MessageCircle, Lock } from 'lucide-react';

export const getUserMenuItems = (t, currentLang, userRole, hasDisputeAccess) => [
    { 
        id: 'vip', 
        label: userRole === 'model' ? (t[currentLang]?.vip || 'VIP статус') : (t[currentLang]?.clientPremium || 'Преміум'), 
        icon: <Crown size={18} color="#ffc107"/> 
    },
    { 
        id: 'wallet', 
        label: t[currentLang]?.wallet || 'Гаманець', 
        icon: <Wallet size={18}/> 
    },
    { 
        id: 'settings', 
        label: t[currentLang]?.settings || 'Налаштування', 
        icon: <Settings size={18}/> 
    },
    { 
        id: 'disputes', 
        label: t[currentLang]?.dispTab || 'Арбітраж', 
        icon: hasDisputeAccess ? <AlertTriangle size={18}/> : <Lock size={18} color="#888"/>, 
        isArbitrage: true,
        isDisabled: !hasDisputeAccess // Блокуємо прапорець, якщо немає доступу
    },
    { 
        id: 'support', 
        label: t[currentLang]?.support || 'Підтримка', 
        icon: <MessageCircle size={18}/> 
    }
];