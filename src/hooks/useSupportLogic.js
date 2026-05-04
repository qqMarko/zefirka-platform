import { useState, useRef } from 'react';

export const useSupportLogic = (userUniqueId, email) => {
    const [showSupport, setShowSupport] = useState(false);
    const [supportMessages, setSupportMessages] = useState([]);
    const [supportInput, setSupportInput] = useState('');
    const [supportAttachedImg, setSupportAttachedImg] = useState(null);
    const supportFileRef = useRef(null);

    const handleSupportAttach = (e) => {
        const file = e.target.files[0];
        if (file) { 
            const reader = new FileReader(); 
            reader.onloadend = () => setSupportAttachedImg(reader.result); 
            reader.readAsDataURL(file); 
        }
        e.target.value = null;
    };

    const handleSupportSend = async (forcedText = null) => {
        const textToSend = typeof forcedText === 'string' ? forcedText : supportInput;
        if (!textToSend.trim() && !supportAttachedImg) return;
        
        const newMsg = { id: Date.now(), text: textToSend, img: supportAttachedImg, sender: 'user', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        setSupportMessages(prev => [...prev, newMsg]);
        
        if (typeof forcedText !== 'string') { 
            setSupportInput(''); 
            setSupportAttachedImg(null); 
        }
        
        try { 
            await fetch('/api/support/send', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    userId: userUniqueId || localStorage.getItem('guest_support_id'), 
                    text: textToSend, 
                    userEmail: email || 'Не вказано (Гість)', 
                    image: supportAttachedImg 
                }) 
            }); 
        } catch (error) {}
    };

    return {
        showSupport, setShowSupport,
        supportMessages, setSupportMessages,
        supportInput, setSupportInput,
        supportAttachedImg, setSupportAttachedImg,
        supportFileRef, handleSupportAttach, handleSupportSend
    };
};