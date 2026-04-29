import React from 'react';
import { Crown, Wallet, Settings, AlertTriangle, MessageCircle } from 'lucide-react';

export const getUserMenuItems = (t, currentLang, userRole) => [
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
        icon: <AlertTriangle size={18}/>, 
        isArbitrage: true 
    },
    { 
        id: 'support', 
        label: t[currentLang]?.support || 'Підтримка', 
        icon: <MessageCircle size={18}/> 
    }
];