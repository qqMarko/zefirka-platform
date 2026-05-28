import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Eye, MousePointerClick, Calendar, Lock, Crown } from 'lucide-react';
import useStore from '../store/useStore';
import { toast } from 'react-hot-toast';
import { C, R, shadow, overlay, modalBox, btnPrimary, closeBtn, section } from '../styles/ds';

const StatCard = ({ icon: Icon, iconColor, label, value, sub }) => (
    <div style={{ ...section(), position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-8px', right: '-8px', opacity: 0.04 }}><Icon size={100} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.textMuted, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            <Icon size={14} color={iconColor} /> {label}
        </div>
        <div style={{ fontSize: '38px', fontWeight: '900', color: C.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: '700', marginTop: '6px' }}>{sub}</div>}
    </div>
);

const StatsModal = ({ setShowStats, t, currentLang, accent }) => {
    const { userUniqueId, user } = useStore();
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [stats, setStats] = useState({ totalViews: 0, totalClicks: 0, allTimeViews: 0, allTimeClicks: 0, chartData: [] });
    const [loading, setLoading] = useState(true);
    const isFree = !user?.vipPackage || user.vipPackage === 'none';

    useEffect(() => {
        if (isFree) { setLoading(false); return; }
        const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
        const token = localStorage.getItem('zefirka_token');
        fetch(`${BASE}/stats/${userUniqueId}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => {
            if (d.success) setStats({ totalViews: d.totalViews, totalClicks: d.totalClicks, allTimeViews: d.allTimeViews || 0, allTimeClicks: d.allTimeClicks || 0, chartData: d.chartData || [] });
        }).catch(() => {}).finally(() => setLoading(false));
    }, [userUniqueId, isFree]);

    const W = 800, H = 220, PAD = 20;
    const maxV = Math.max(...stats.chartData.map(d => d.views), 10);
    const pts = stats.chartData.map((d, i) => ({
        x: PAD + i * ((W - PAD * 2) / Math.max(stats.chartData.length - 1, 1)),
        y: H - PAD - (d.views / maxV) * (H - PAD * 2), ...d
    }));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
    const fill = pts.length ? `${line} L ${pts[pts.length-1].x} ${H-PAD} L ${pts[0].x} ${H-PAD} Z` : '';

    return (
        <div style={{ ...overlay, zIndex: 7000, alignItems: 'flex-start', paddingTop: '40px' }} onClick={() => setShowStats(false)}>
            <div className="modal-pop custom-scrollbar" style={modalBox('860px', { padding: '28px', overflowY: 'auto', maxHeight: '90vh' })} onClick={e => e.stopPropagation()}>

                <button onClick={() => setShowStats(false)} style={closeBtn}><X size={16} /></button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: R.sm, background: `${C.accent}18`, border: `1px solid ${C.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={20} color={C.accent} />
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: C.text }}>Аналітика</div>
                        <div style={{ fontSize: '12px', color: C.textSub }}>Статистика ваших анкет</div>
                    </div>
                </div>

                {isFree ? (
                    <div style={{ ...section(), textAlign: 'center', padding: '40px 24px', border: `1px dashed ${C.border}` }}>
                        <Lock size={40} color={C.textMuted} style={{ marginBottom: '14px' }} />
                        <div style={{ fontSize: '17px', fontWeight: '800', color: C.text, marginBottom: '8px' }}>Аналітика недоступна</div>
                        <div style={{ color: C.textSub, fontSize: '13px', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto 20px' }}>
                            Доступна для статусів <b style={{ color: C.text }}>START</b>, <b style={{ color: C.text }}>PREMIUM</b> та <b style={{ color: C.text }}>DIAMOND</b>.
                        </div>
                        <button onClick={() => { setShowStats(false); toast('Відкрийте меню VIP-пакетів'); }} style={{ ...btnPrimary(), margin: '0 auto' }}>
                            <Crown size={16} /> Підвищити статус
                        </button>
                    </div>
                ) : loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: C.textSub }}>Завантаження...</div>
                ) : (
                    <>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <StatCard icon={Eye} iconColor={C.accent} label="Перегляди сьогодні" value={stats.totalViews.toLocaleString()} sub={`Всього: ${stats.allTimeViews.toLocaleString()}`} />
                            <StatCard icon={MousePointerClick} iconColor={C.success} label="Переходи сьогодні" value={stats.totalClicks.toLocaleString()} sub={`Всього: ${stats.allTimeClicks.toLocaleString()}`} />
                        </div>

                        <div style={{ ...section(), padding: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Динаміка (7 днів)</div>
                            <div className="chart-container-mobile custom-scrollbar" style={{ position: 'relative' }}>
                                <div className="chart-svg-mobile" style={{ height: `${H}px`, width: '100%' }}>
                                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} onClick={() => setHoveredPoint(null)}>
                                        <defs>
                                            <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor={C.accent} stopOpacity="0.3" />
                                                <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {[0,1,2,3].map(i => <line key={i} x1={PAD} y1={H-PAD-(i*((H-PAD*2)/3))} x2={W-PAD} y2={H-PAD-(i*((H-PAD*2)/3))} stroke={C.border} strokeWidth="1" />)}
                                        <path d={fill} fill="url(#sg)" />
                                        <path d={line} fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        {pts.map((p, i) => (
                                            <g key={i} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
                                                <circle cx={p.x} cy={p.y} r="24" fill="transparent" />
                                                <circle cx={p.x} cy={p.y} r={hoveredPoint?.x === p.x ? 7 : 4} fill={C.surface} stroke={C.accent} strokeWidth="2.5" style={{ transition: 'r 0.15s' }} />
                                            </g>
                                        ))}
                                    </svg>
                                    {hoveredPoint && (
                                        <div style={{ position: 'absolute', left: `calc(${(hoveredPoint.x/W)*100}% - 70px)`, top: `calc(${(hoveredPoint.y/H)*100}% - 80px)`, background: C.surface2, border: `1px solid ${C.borderMd}`, borderRadius: R.sm, padding: '12px', pointerEvents: 'none', zIndex: 10, minWidth: '130px', boxShadow: shadow.card }}>
                                            <div style={{ color: C.textSub, fontSize: '11px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {hoveredPoint.date}</div>
                                            <div style={{ color: C.text, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={14} color={C.accent} /> {hoveredPoint.views}</div>
                                            <div style={{ color: C.success, fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><MousePointerClick size={12} /> {hoveredPoint.clicks}</div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: `0 ${PAD}px`, color: C.textMuted, fontSize: '11px' }}>
                                    {stats.chartData.map((d, i) => <span key={i}>{d.date}</span>)}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StatsModal;