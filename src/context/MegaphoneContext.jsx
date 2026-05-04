import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const MegaphoneContext = createContext();

<<<<<<< HEAD
=======
// ВАЖЛИВО: Заміни на реальний URL твого бекенду
const BACKEND_URL = 'http://localhost:5000'; 

>>>>>>> e1fc43f147c54f30a853e93de737fe042b63224c
export const MegaphoneProvider = ({ children }) => {
  const [megaphone, setMegaphone] = useState({
    message: '',
    vipDiscountPercent: 0,
    bumpDiscountPercent: 0,
<<<<<<< HEAD
    activeVipPackages: [], // 🔥 Додано масив для зберігання обраних пакетів
=======
>>>>>>> e1fc43f147c54f30a853e93de737fe042b63224c
    isActive: false
  });

  useEffect(() => {
<<<<<<< HEAD
    // Динамічний URL як у решті проєкту
    let BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (BACKEND_URL.endsWith('/api')) BACKEND_URL = BACKEND_URL.slice(0, -4);

    // 1. Отримуємо початковий стан при завантаженні сайту
=======
    // 1. Отримуємо статус рупора при заході на сайт
>>>>>>> e1fc43f147c54f30a853e93de737fe042b63224c
    axios.get(`${BACKEND_URL}/api/admin/megaphone/status`, { withCredentials: true })
      .then(res => {
        if (res.data.success && res.data.settings) {
          setMegaphone(res.data.settings);
        }
      })
<<<<<<< HEAD
      .catch(err => console.error("Помилка MegaphoneContext", err));

    // 2. Слухаємо оновлення по сокетах у реальному часі
    const socket = io(BACKEND_URL);
=======
      .catch(err => console.error("Помилка завантаження рупора", err));

    // 2. Підключаємо сокети для МИТТЄВОГО оновлення
    const socket = io(BACKEND_URL);
    
>>>>>>> e1fc43f147c54f30a853e93de737fe042b63224c
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