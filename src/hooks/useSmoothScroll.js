import { useEffect } from 'react';

// speed: швидкість доганяння (0.04 - дуже плавно, 0.1 - швидко)
// scrollMultiplier: сила одного прокруту коліщатка (0.8 - м'яко, 1.2 - різко)
const useSmoothScroll = (ref, speed = 0.04, scrollMultiplier = 0.8) => {
    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        let targetY = container.scrollTop;
        let currentY = container.scrollTop;
        let isAnimating = false;

        const renderScroll = () => {
            const diff = targetY - currentY;
            if (Math.abs(diff) < 0.5) {
                currentY = targetY;
                container.scrollTop = currentY;
                isAnimating = false;
                return;
            }
            currentY += diff * speed; 
            container.scrollTop = currentY;
            requestAnimationFrame(renderScroll);
        };

        const handleWheel = (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            
            const maxScroll = container.scrollHeight - container.clientHeight;
            targetY = Math.max(0, Math.min(maxScroll, targetY + (e.deltaY * scrollMultiplier)));
            
            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(renderScroll);
            }
        };

        const handleScroll = () => {
            if (!isAnimating) {
                targetY = container.scrollTop;
                currentY = container.scrollTop;
            }
        };

        // Підключаємо слухачі
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('scroll', handleScroll, { passive: true });

        // Прибираємо слухачі при закритті компонента
        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('scroll', handleScroll);
        };
    }, [ref, speed, scrollMultiplier]);
};

export default useSmoothScroll;