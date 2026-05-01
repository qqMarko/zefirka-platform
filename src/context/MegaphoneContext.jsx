import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const MegaphoneContext = createContext();

// ВАЖЛИВО: Заміни на реальний URL твого бекенду
const BACKEND_URL = 'http://localhost:5000'; 

export const MegaphoneProvider = ({ children }) => {
  const [megaphone, setMegaphone] = useState({
    message: '',
    vipDiscountPercent: 0,
    bumpDiscountPercent: 0,
    isActive: false
  });

  useEffect(() => {
    // 1. Отримуємо статус рупора при заході на сайт
    axios.get(`${BACKEND_URL}/api/admin/megaphone/status`, { withCredentials: true })
      .then(res => {
        if (res.data.success && res.data.settings) {
          setMegaphone(res.data.settings);
        }
      })
      .catch(err => console.error("Помилка завантаження рупора", err));

    // 2. Підключаємо сокети для МИТТЄВОГО оновлення
    const socket = io(BACKEND_URL);
    
    socket.on('megaphone_update', (newSettings) => {
      setMegaphone(newSettings);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <MegaphoneContext.Provider value={megaphone}>
      {children}
    </MegaphoneContext.Provider>
  );
};

export const useMegaphone = () => useContext(MegaphoneContext);