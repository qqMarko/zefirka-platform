import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Eye, MousePointerClick, Calendar, Lock, Crown } from 'lucide-react';
import useStore from '../store/useStore';
import { toast } from 'react-hot-toast';

const StatsModal = ({ setShowStats, t, currentLang, accent }) => {
    const { userUniqueId, user } = useStore();
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [stats, setStats] = useState({ totalViews: 0, totalClicks: 0, chartData: [] });
    const [loading, setLoading] = useState(true);

    // 🔥 ПЕРЕВІРКА ПАКЕТУ: Якщо немає VIP, аналітика заблокована
    const isFree = !user?.vipPackage;

    useEffect(() => {
        if (isFree) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const res = await fetch(`${BASE_URL}/stats/${userUniqueId}`);
                const data = await res.json();
                if (data.success) {
                    const chart = data.chartData.length > 0 ? data.chartData : [
                        { date: 'Сьогодні', views: 0, clicks: 0 }, { date: 'Завтра', views: 0, clicks: 0 }
                    ];
                    setStats({ totalViews: data.totalViews, totalClicks: data.totalClicks, chartData: chart });
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchStats();
    }, [userUniqueId, isFree]);

    const handleUpgradeClick = () => {
        setShowStats(false);
        toast('💎 Відкрийте бокове меню та перейдіть у розділ VIP!', { duration: 4000, style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
    };

    const maxViews = Math.max(...stats.chartData.map(d => d.views), 10);
    const chartWidth = 800;
    const chartHeight = 250;
    const padding = 20;

    const points = stats.chartData.map((data, index) => {
        const x = padding + (index * ((chartWidth - padding * 2) / Math.max(stats.chartData.length - 1, 1)));
        const y = chartHeight - padding - ((data.views / maxViews) * (chartHeight - padding * 2));
        return { x, y, ...data };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` : '';

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="modal-pop custom-scrollbar" style={{ width: '100%', maxWidth: '900px', background: '#0a0a0f', border: `1px solid #333`, padding: '40px', borderRadius: '24px', boxShadow: `0 20px 80px rgba(0,0,0,0.9)`, position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
                {/* 🟢 СУПЕР-БЕЗПЕЧНИЙ ХРЕСТИК */}
                <X onClick={() => setShowStats(false)} className="close-btn-mobile menu-hover" style={{ position: 'absolute', top: 25, right: 25, cursor: 'pointer', color: '#888', zIndex: 100 }} size={28} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ background: `${accent}22`, padding: '12px', borderRadius: '12px' }}>
                        <TrendingUp size={28} color={accent} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '24px', letterSpacing: '1px' }}>{t[currentLang]?.statsTitle || 'АНАЛІТИКА'}</h2>
                        <div style={{ color: '#888', fontSize: '13px' }}>Детальна статистика ваших анкет</div>
                    </div>
                </div>

                {isFree ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', background: '#111', borderRadius: '16px', border: '1px dashed #444' }}>
                        <Lock size={64} color="#666" style={{ margin: '0 auto 15px auto' }} />
                        <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>Аналітика недоступна</h3>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '25px', maxWidth: '400px', margin: '0 auto 25px auto', lineHeight: '1.5' }}>
                            Детальна статистика переглядів та переходів доступна лише для статусів <b>START</b>, <b>PREMIUM</b> та <b>DIAMOND</b>.
                        </p>
                        <button 
                            onClick={handleUpgradeClick}
                            style={{ background: 'linear-gradient(90deg, #ff007f, #ff4b91)', color: 'white', padding: '14px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                            className="menu-hover"
                        >
                            <Crown size={20} /> ПІДВИЩИТИ СТАТУС
                        </button>
                    </div>
                ) : loading ? (
                    <div style={{ color: accent, textAlign: 'center', padding: '50px' }}>Завантаження...</div>
                ) : (
                    <>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #111, #050508)', padding: '25px', borderRadius: '16px', border: '1px solid #222', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><Eye size={120} /></div>
                                <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={16} color={accent}/> {t[currentLang]?.totalViews || 'ВСЬОГО ПЕРЕГЛЯДІВ'}</div>
                                <div className="stat-big-num" style={{ fontSize: '42px', fontWeight: '900', color: 'white' }}>{stats.totalViews.toLocaleString()}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #111, #050508)', padding: '25px', borderRadius: '16px', border: '1px solid #222', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><MousePointerClick size={120} /></div>
                                <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><MousePointerClick size={16} color="#4caf50"/> {t[currentLang]?.totalClicks || 'ПЕРЕХОДІВ В КОНТАКТИ'}</div>
                                <div className="stat-big-num" style={{ fontSize: '42px', fontWeight: '900', color: 'white' }}>{stats.totalClicks.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="chart-container-mobile custom-scrollbar" style={{ background: '#050508', border: '1px solid #222', borderRadius: '16px', padding: '30px', position: 'relative' }}>
                            <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold', marginBottom: '20px' }}>Динаміка (Останні 7 днів)</div>
                            <div className="chart-svg-mobile" style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
                                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} onClick={() => setHoveredPoint(null)} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.4"/><stop offset="100%" stopColor={accent} stopOpacity="0.0"/></linearGradient>
                                    </defs>
                                    {[0, 1, 2, 3, 4].map(i => <line key={i} x1={padding} y1={chartHeight - padding - (i * ((chartHeight - padding*2) / 4))} x2={chartWidth - padding} y2={chartHeight - padding - (i * ((chartHeight - padding*2) / 4))} stroke="#222" strokeWidth="1" strokeDasharray="5,5" />)}
                                    <path d={fillPath} fill="url(#lineGradient)" />
                                    <path d={linePath} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0px 10px 10px ${accent}66)` }} />
                                    {points.map((p, i) => (
                                        <g key={i} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)} onTouchStart={(e) => { e.stopPropagation(); setHoveredPoint(hoveredPoint?.x === p.x ? null : p); }} style={{ cursor: 'pointer' }}>
                                            <circle cx={p.x} cy={p.y} r="30" fill="transparent" />
                                            <circle cx={p.x} cy={p.y} r={hoveredPoint?.x === p.x ? "8" : "5"} fill="#0a0a0f" stroke={accent} strokeWidth="3" style={{ transition: 'all 0.2s' }} />
                                        </g>
                                    ))}
                                </svg>
                                {hoveredPoint && (
                                    <div className="fade-in-up" style={{ position: 'absolute', left: `calc(${(hoveredPoint.x / chartWidth) * 100}% - 75px)`, top: `calc(${(hoveredPoint.y / chartHeight) * 100}% - 90px)`, background: '#111', border: `1px solid ${accent}`, borderRadius: '10px', padding: '15px', pointerEvents: 'none', zIndex: 10, width: '150px', boxShadow: `0 10px 30px rgba(0,0,0,0.9)`}}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '11px', marginBottom: '8px' }}><Calendar size={12} /> {hoveredPoint.date}</div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={16} color={accent}/> {hoveredPoint.views}</div>
                                        <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}><MousePointerClick size={12} /> Кліки: {hoveredPoint.clicks}</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: `0 ${padding}px`, color: '#666', fontSize: '11px' }}>
                                {stats.chartData.map((d, i) => <span key={i}>{d.date}</span>)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StatsModal;