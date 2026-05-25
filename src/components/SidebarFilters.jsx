import React, { useEffect, useRef, useState } from 'react';
import { X, Check, Filter, LayoutGrid, HelpCircle, ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react';

const SidebarFilters = ({
    isMenuOpen, closeMenu, accent, t, currentLang, currentPage, setCurrentPage,
    genderKeys, selectedGenders, setSelectedGenders,
    bodyKeys, selectedBody, setSelectedBody, filterBodyTypes,
    hairKeys, selectedHair, setSelectedHair, filterHairColors,
    expandedFetishCat, setExpandedFetishCat, selectedFetishes, toggleFetish,
    filterAge, setFilterAge, filterPrice, setFilterPrice
}) => {
    
    const menuRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Total active filters count
    const activeCount = selectedGenders.length + selectedBody.length + selectedHair.length + selectedFetishes.length
        + (filterAge < 60 ? 1 : 0) + (filterPrice < 20000 ? 1 : 0);

    const resetAll = () => {
        setSelectedGenders([]);
        setSelectedBody([]);
        setSelectedHair([]);
        if (typeof setExpandedFetishCat === 'function') setExpandedFetishCat(null);
        selectedFetishes.forEach(f => toggleFetish(f));
        setFilterAge(60);
        setFilterPrice(20000);
    };

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => { 
            document.body.style.overflow = ''; 
            document.documentElement.style.overflow = '';
        };
    }, [isMenuOpen]);

    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;

        let targetY = menu.scrollTop;
        let currentY = menu.scrollTop;
        let isAnimating = false;

        const renderScroll = () => {
            const diff = targetY - currentY;
            if (Math.abs(diff) < 0.5) { currentY = targetY; menu.scrollTop = currentY; isAnimating = false; return; }
            currentY += diff * 0.07; 
            menu.scrollTop = currentY;
            requestAnimationFrame(renderScroll);
        };

        const handleWheel = (e) => {
            e.preventDefault(); e.stopPropagation();
            targetY += e.deltaY * 0.9; 
            const maxScroll = menu.scrollHeight - menu.clientHeight;
            targetY = Math.max(0, Math.min(targetY, maxScroll));
            if (!isAnimating) { isAnimating = true; requestAnimationFrame(renderScroll); }
        };

        const handleScroll = () => { if (!isAnimating) { targetY = menu.scrollTop; currentY = menu.scrollTop; } };

        menu.addEventListener('wheel', handleWheel, { passive: false });
        menu.addEventListener('scroll', handleScroll, { passive: true });
        return () => { menu.removeEventListener('wheel', handleWheel); menu.removeEventListener('scroll', handleScroll); };
    }, [isMenuOpen]); 

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            visibility: isMenuOpen ? 'visible' : 'hidden', transition: 'visibility 0.4s'
        }}>
            <style>{`
                .filter-block { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px) brightness(1.08); -webkit-backdrop-filter: blur(20px) brightness(1.08); border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 16px; margin-bottom: 16px; transition: border-color 0.2s, background 0.2s; box-shadow: 0 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06); }
                .filter-block:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); }
                .filter-block-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1.2px; display: block; margin-bottom: 12px; font-weight: 800; }
                .fpill { padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.18s; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: #888; white-space: nowrap; }
                .fpill:hover { background: rgba(255,255,255,0.07); color: #ccc; border-color: rgba(255,255,255,0.15); }
                .fpill.active { background: var(--acc18); border-color: var(--acc55); color: #fff; }
                .slider-track { position: relative; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
                .slider-fill { position: absolute; left: 0; top: 0; height: 100%; border-radius: 2px; }
                .premium-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; cursor: pointer; background-image: linear-gradient(var(--slider-color), var(--slider-color)); background-size: var(--slider-percent) 100%; background-repeat: no-repeat; }
                .premium-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--slider-color); cursor: pointer; border: 3px solid rgba(5,5,8,1); box-shadow: 0 0 10px var(--slider-color); transition: transform 0.15s; }
                .premium-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
                .premium-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: var(--slider-color); cursor: pointer; border: 3px solid rgba(5,5,8,1); }
                .neon-checkbox { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid rgba(255,255,255,0.15); background: transparent; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
                .neon-checkbox.active { background: var(--acc); border-color: var(--acc); }
                .fetish-cat { margin-bottom: 6px; background: rgba(255,255,255,0.03); backdrop-filter: blur(16px) brightness(1.05); -webkit-backdrop-filter: blur(16px) brightness(1.05); border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); transition: all 0.25s; }
                .fetish-cat.open { border-color: var(--acc33); }
            `}</style>

            {/* Backdrop */}
            <div
                onClick={closeMenu}
                style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)', opacity: isMenuOpen ? 1 : 0,
                    transition: 'opacity 0.4s ease', zIndex: 1
                }}
            />

            {/* Panel */}
            <div 
                ref={menuRef} 
                className="custom-scrollbar" 
                data-lenis-prevent="true"
                style={{
                    '--acc': accent, '--acc18': accent + '18', '--acc33': accent + '33', '--acc55': accent + '55',
                    position: 'absolute', zIndex: 2, top: 0, left: 0, bottom: 0,
                    width: '100%', maxWidth: '440px',
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(40px) brightness(1.1)',
                    WebkitBackdropFilter: 'blur(40px) brightness(1.1)',
                    borderRight: `1px solid ${accent}22`,
                    padding: '0',
                    paddingBottom: '100px',
                    overflowY: 'auto', overflowX: 'hidden',
                    transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow: isMenuOpen ? `12px 0 50px rgba(0,0,0,0.95), 2px 0 20px ${accent}18` : 'none',
                }}
            >
                {/* STICKY HEADER */}
                <div style={{ 
                    position: 'sticky', top: 0, zIndex: 10,
                    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(28px) brightness(1.06)',
                    WebkitBackdropFilter: 'blur(28px) brightness(1.06)',
                    borderBottom: `1px solid rgba(255,255,255,0.06)`,
                    padding: '18px 22px 14px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                                width: '34px', height: '34px', borderRadius: '10px',
                                background: `${accent}18`, border: `1px solid ${accent}33`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Filter size={16} color={accent} />
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: 'white', letterSpacing: '0.5px', lineHeight: 1 }}>{t[currentLang]?.filters || 'ФІЛЬТРИ'}</div>
                                {activeCount > 0 && (
                                    <div style={{ fontSize: '11px', color: accent, fontWeight: '700', marginTop: '2px' }}>
                                        Активно: {activeCount}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {activeCount > 0 && (
                                <button 
                                    onClick={resetAll}
                                    title="Скинути всі фільтри"
                                    style={{ 
                                        background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)',
                                        borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#ff8888',
                                        display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,100,100,0.18)'; e.currentTarget.style.color='#ff5555'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,100,100,0.08)'; e.currentTarget.style.color='#ff8888'; }}
                                >
                                    <RotateCcw size={12} /> Скинути
                                </button>
                            )}
                            <button onClick={closeMenu} style={{ 
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px', width: '36px', height: '36px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#777',
                                transition: '0.2s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#777'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Page tabs */}
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <button onClick={() => {setCurrentPage('catalog'); closeMenu()}} style={{ 
                            flex: 1, padding: '9px', borderRadius: '7px', cursor: 'pointer',
                            background: currentPage === 'catalog' ? accent : 'transparent',
                            color: currentPage === 'catalog' ? 'white' : '#555',
                            fontWeight: '800', fontSize: '12px', border: 'none', outline: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: '0.2s', fontFamily: 'inherit',
                            boxShadow: currentPage === 'catalog' ? `0 2px 12px ${accent}44` : 'none',
                        }}>
                            <LayoutGrid size={14} /> {t[currentLang]?.catalog || 'Каталог'}
                        </button>
                        <button onClick={() => {setCurrentPage('faq'); closeMenu()}} style={{ 
                            flex: 1, padding: '9px', borderRadius: '7px', cursor: 'pointer',
                            background: currentPage === 'faq' ? '#4caf50' : 'transparent',
                            color: currentPage === 'faq' ? 'white' : '#555',
                            fontWeight: '800', fontSize: '12px', border: 'none', outline: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: '0.2s', fontFamily: 'inherit',
                            boxShadow: currentPage === 'faq' ? '0 2px 12px rgba(76,175,80,0.4)' : 'none',
                        }}>
                            <HelpCircle size={14} /> {t[currentLang]?.faqTab || 'FAQ'}
                        </button>
                    </div>
                </div>

                {/* ── FILTERS BODY ── */}
                <div style={{ padding: '16px 22px' }}>

                    {/* GENDER */}
                    <div className="filter-block">
                        <span className="filter-block-label">{t[currentLang]?.genderTitle || 'Стать'}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {genderKeys?.map(gKey => {
                                const active = selectedGenders.includes(gKey);
                                return (
                                    <div 
                                        key={gKey} 
                                        onClick={(e) => { e.stopPropagation(); setSelectedGenders(prev => prev.includes(gKey) ? prev.filter(i => i !== gKey) : [...prev, gKey]); }}
                                        className={`fpill ${active ? 'active' : ''}`}
                                        style={{ '--acc18': accent+'18', '--acc55': accent+'55' }}
                                    >
                                        {active && <Check size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                                        {t[currentLang]?.genders?.[gKey]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* BODY TYPE */}
                    <div className="filter-block">
                        <span className="filter-block-label">{t[currentLang]?.bodyTitle || 'Тип тіла'}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {bodyKeys?.map(bKey => {
                                const active = selectedBody.includes(bKey);
                                return (
                                    <div 
                                        key={bKey}
                                        onClick={(e) => { e.stopPropagation(); setSelectedBody(prev => prev.includes(bKey) ? prev.filter(i => i !== bKey) : [...prev, bKey]); }}
                                        className={`fpill ${active ? 'active' : ''}`}
                                        style={{ '--acc18': accent+'18', '--acc55': accent+'55' }}
                                    >
                                        {active && <Check size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                                        {filterBodyTypes?.[bKey] || bKey}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* HAIR COLOR */}
                    <div className="filter-block">
                        <span className="filter-block-label">{t[currentLang]?.hairTitle || 'Волосся'}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {hairKeys?.map(hKey => {
                                const active = selectedHair.includes(hKey);
                                const hairColors = { blonde: '#f9dc5c', brunette: '#3b1f0e', brown: '#8B5A2B', red: '#d45520', color: 'linear-gradient(135deg,#ff69b4,#9b59b6,#3498db)' };
                                return (
                                    <div 
                                        key={hKey}
                                        onClick={(e) => { e.stopPropagation(); setSelectedHair(prev => prev.includes(hKey) ? prev.filter(i => i !== hKey) : [...prev, hKey]); }}
                                        className={`fpill ${active ? 'active' : ''}`}
                                        style={{ '--acc18': accent+'18', '--acc55': accent+'55', display: 'flex', alignItems: 'center', gap: '7px' }}
                                    >
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: hairColors[hKey] || '#888', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }} />
                                        {filterHairColors?.[hKey] || hKey}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AGE & PRICE SLIDERS */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(22px) brightness(1.08)', WebkitBackdropFilter: 'blur(22px) brightness(1.08)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.09)', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                        
                        {/* Age slider */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#666', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{t[currentLang]?.ageTo || 'Вік до'}</span>
                                <span style={{ 
                                    color: filterAge < 60 ? accent : '#555', fontWeight: '900',
                                    background: filterAge < 60 ? `${accent}18` : 'rgba(255,255,255,0.05)',
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '13px',
                                    border: `1px solid ${filterAge < 60 ? accent+'33' : 'rgba(255,255,255,0.07)'}`,
                                    transition: 'all 0.2s',
                                }}>{filterAge} р.</span>
                            </div>
                            <input 
                                type="range" min="18" max="60" value={filterAge} 
                                onChange={e => setFilterAge(parseInt(e.target.value))} 
                                className="premium-slider" 
                                style={{ '--slider-color': accent, '--slider-percent': `${((filterAge - 18) / (60 - 18)) * 100}%`, width: '100%' }} 
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                <span style={{ fontSize: '10px', color: '#444', fontWeight: '600' }}>18</span>
                                <span style={{ fontSize: '10px', color: '#444', fontWeight: '600' }}>60</span>
                            </div>
                        </div>
                        
                        {/* Price slider */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#666', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{t[currentLang]?.priceTo || 'Ціна до'}</span>
                                <span style={{ 
                                    color: filterPrice < 20000 ? accent : '#555', fontWeight: '900',
                                    background: filterPrice < 20000 ? `${accent}18` : 'rgba(255,255,255,0.05)',
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '13px',
                                    border: `1px solid ${filterPrice < 20000 ? accent+'33' : 'rgba(255,255,255,0.07)'}`,
                                    transition: 'all 0.2s',
                                }}>{filterPrice.toLocaleString('uk')} ₴</span>
                            </div>
                            <input 
                                type="range" min="500" max="20000" step="500" value={filterPrice} 
                                onChange={e => setFilterPrice(parseInt(e.target.value))} 
                                className="premium-slider" 
                                style={{ '--slider-color': accent, '--slider-percent': `${((filterPrice - 500) / (20000 - 500)) * 100}%`, width: '100%' }} 
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                <span style={{ fontSize: '10px', color: '#444', fontWeight: '600' }}>500 ₴</span>
                                <span style={{ fontSize: '10px', color: '#444', fontWeight: '600' }}>20 000 ₴</span>
                            </div>
                        </div>
                    </div>

                    {/* FETISHES / SERVICES */}
                    <div className="filter-block">
                        <span className="filter-block-label">{t[currentLang]?.fetishesTitle || 'Послуги'}</span>
                        {t[currentLang]?.fetishes && Object.entries(t[currentLang].fetishes).map(([catKey, category]) => {
                            const isOpen = expandedFetishCat === catKey;
                            const catSelected = Object.keys(category.items || {}).filter(k => selectedFetishes.includes(k)).length;
                            return (
                                <div key={catKey} className={`fetish-cat ${isOpen ? 'open' : ''}`} style={{ '--acc': accent, '--acc33': accent+'33' }}>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); setExpandedFetishCat(isOpen ? null : catKey); }} 
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', color: isOpen ? '#fff' : '#999', fontWeight: '700' }}>{category.title}</span>
                                            {catSelected > 0 && (
                                                <span style={{ fontSize: '10px', background: `${accent}22`, color: accent, padding: '2px 7px', borderRadius: '20px', fontWeight: '800', border: `1px solid ${accent}44` }}>{catSelected}</span>
                                            )}
                                        </div>
                                        {isOpen ? <ChevronUp size={15} color={accent} /> : <ChevronDown size={15} color="#444" />}
                                    </div>
                                    {isOpen && (
                                        <div style={{ padding: '4px 14px 14px 14px', display: 'grid', gap: '10px' }} className="fade-in-up">
                                            {Object.entries(category.items || {}).map(([itemKey, itemLabel]) => {
                                                const isActive = selectedFetishes.includes(itemKey);
                                                return (
                                                    <div key={itemKey} onClick={(e) => { e.stopPropagation(); toggleFetish(itemKey); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '3px 0', transition: 'opacity 0.15s' }} onMouseEnter={e=>e.currentTarget.style.opacity='0.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                                                        <div className={`neon-checkbox ${isActive ? 'active' : ''}`} style={{ '--acc': accent }}>
                                                            {isActive && <Check size={10} color="white" strokeWidth={3} />}
                                                        </div>
                                                        <span style={{ fontSize: '13px', color: isActive ? '#fff' : '#777', fontWeight: isActive ? '700' : '500', transition: 'color 0.15s' }}>{itemLabel}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* STICKY APPLY BUTTON */}
                {activeCount > 0 && (
                    <div style={{ 
                        position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.06)', 
                        backdropFilter: 'blur(30px) brightness(1.1)', padding: '14px 22px',
                        borderTop: `1px solid ${accent}22`,
                    }}>
                        <button 
                            onClick={closeMenu}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px',
                                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                color: 'white', fontWeight: '900', fontSize: '14px',
                                border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: `0 4px 20px ${accent}44`,
                                letterSpacing: '0.5px', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 8px 28px ${accent}55`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 20px ${accent}44`; }}
                        >
                            Застосувати фільтри ({activeCount})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarFilters;