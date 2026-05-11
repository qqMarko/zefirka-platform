import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ZefirkaPlatform from './ZefirLanding';
import useStore from './store/useStore';

// 🛑 ГЛОБАЛЬНИЙ ПЕРЕХОПЛЮВАЧ ЗАПИТІВ
// Він слухає всі fetch-запити. Якщо сервер повертає 401 (сеанс вбито), 
// він миттєво викидає користувача.
const originalFetch = window.fetch;
window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    
    // Якщо бекенд каже, що токен більше не дійсний (наприклад, його видалив інший пристрій)
    if (response.status === 401) {
        console.log("🚨 Сервер відхилив запит (401). Сеанс завершено. Викидаємо з акаунту...");
        
        // Викликаємо твою готову функцію logout() зі стору
        useStore.getState().logout();
    }
    
    return response;
};

function App() {
  return (
    <BrowserRouter>
      <ZefirkaPlatform />
    </BrowserRouter>
  );
}

export default App;