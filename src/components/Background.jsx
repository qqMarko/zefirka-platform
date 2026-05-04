import React from 'react';

const Background = ({ currentPage }) => {
    // Яскравий рожевий неон (Hot Pink / Magenta)
    const pinkGrid = 'rgba(255, 0, 127, 0.55)'; // Колір самих ліній
    const pinkGlow = 'rgba(255, 0, 127, 0.15)'; // Дуже легке сяйво на фоні

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundColor: '#000000', overflow: 'hidden' }}>
            
            <style>
                {`
                    /* Анімація потоку сітки */
                    @keyframes neonFlow {
                        0% { background-position: 0px 0px; }
                        100% { background-position: 45px 45px; } /* Крок тепер 45px під новий розмір */
                    }

                    .cyber-grid {
                        position: absolute;
                        inset: -10%;
                        width: 120vw;
                        height: 120vh;
                        /* Розмір клітинки збільшено до 45px */
                        background-image: 
                            linear-gradient(0deg, ${pinkGrid} 1px, transparent 1px), 
                            linear-gradient(90deg, ${pinkGrid} 1px, transparent 1px);
                        background-size: 45px 45px;
                        animation: neonFlow 4s linear infinite;
                        /* Самосвітіння ліній (Неон) */
                        filter: drop-shadow(0 0 6px ${pinkGrid});
                    }
                `}
            </style>

            {/* БАЗОВИЙ ФОН: Абсолютно чорний */}
            <div style={{ position: 'absolute', inset: 0, background: '#000000' }} />

            {/* ЛЕГКЕ СЯЙВО: Щоб неон відчувався живим, але всередині клітинок залишається чорнота */}
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: `radial-gradient(circle at center, ${pinkGlow} 0%, transparent 100%)`, 
                pointerEvents: 'none' 
            }} />

            {/* РОЖЕВА СІТКА */}
            <div className="cyber-grid" />

            {/* ВІНЬЄТКА ПО КРАЯХ: М'яко ховає краї сітки в темряву, центр залишається чистим */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.9) 100%)',
                pointerEvents: 'none'
            }} />

        </div>
    );
};

export default Background;