import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Lenis from '@studio-freight/lenis';

const RootComponent = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, // Швидкість (чим більше, тим плавніша інерція)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-style easing
      smoothWheel: true,
      wheelMultiplier: 1,
      lerp: 0.1, // Чутливість (від 0 до 1)
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);