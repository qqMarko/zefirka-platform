import React, { useEffect, useRef } from 'react';
import { X, Check, Filter, LayoutGrid, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SidebarFilters = ({
    isMenuOpen, closeMenu, accent, t, currentLang, currentPage, setCurrentPage,
    genderKeys, selectedGenders, setSelectedGenders,
    bodyKeys, selectedBody, setSelectedBody, filterBodyTypes,
    hairKeys, selectedHair, setSelectedHair, filterHairColors,
    expandedFetishCat, setExpandedFetishCat, selectedFetishes, toggleFetish,
    filterAge, setFilterAge, filterPrice, setFilterPrice
}) => {
    
    const menuRef = useRef(null);

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
            if (Math.abs(diff) < 0.5) {
                currentY = targetY;
                menu.scrollTop = currentY;
                isAnimating = false;
                return;
            }
            currentY += diff * 0.04; 
            menu.scrollTop = currentY;
            requestAnimationFrame(renderScroll);
        };

        const handleWheel = (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            targetY += e.deltaY * 0.9; 
            const maxScroll = menu.scrollHeight - menu.clientHeight;
            targetY = Math.max(0, Math.min(targetY, maxScroll));
            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(renderScroll);
            }
        };

        const handleScroll = () => {
            if (!isAnimating) {
                targetY = menu.scrollTop;
                currentY = menu.scrollTop;
            }
        };

        menu.addEventListener('wheel', handleWheel, { passive: false });
        menu.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            menu.removeEventListener('wheel', handleWheel);
            menu.removeEventListener('scroll', handleScroll);
        };
    }, [isMenuOpen]); 

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            visibility: isMenuOpen ? 'visible' : 'hidden', transition: 'visibility 0.4s'
        }}>
            {/* Затемнення фону */}
            <div
                onClick={closeMenu}
                style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)', opacity: isMenuOpen ? 1 : 0,
                    transition: 'opacity 0.4s ease', zIndex: 1
                }}
            />

            {/* Сама панель меню */}
            <div 
                ref={menuRef} 
                className="custom-scrollbar" 
                data-lenis-prevent="true"
                style={{
                    position: 'absolute', zIndex: 2, top: 0, left: 0, bottom: 0,
                    width: '100%', maxWidth: '380px', background: '#0a0a0f',
                    backgroundImage: `linear-gradient(to bottom, rgba(10,10,15,0.85), rgba(3,3,5,0.98)), url('https://i.pinimg.com/736x/73/ca/0d/73ca0d1c2d41b8634cd92b10f88124f5.jpg')`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    borderRight: `1px solid ${accent}44`, padding: '25px', paddingBottom: '80px',
                    overflowY: 'auto', overflowX: 'hidden',
                    transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow: isMenuOpen ? `10px 0 40px rgba(0,0,0,0.9), 2px 0 20px ${accent}22` : 'none'
                }}
            >
                {/* Шапка меню */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Filter size={24} color={accent} />
                        <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '1px', color: 'white' }}>{t[currentLang]?.filters || 'ФІЛЬТРИ'}</span>
                    </div>
                    <button onClick={closeMenu} className="menu-hover" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#aaa', transition: '0.3s' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Вкладки Сторінок */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'rgba(0,0,0,0.4)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div onClick={() => {setCurrentPage('catalog'); closeMenu()}} style={{ flex: 1, padding: '12px', background: currentPage === 'catalog' ? accent : 'transparent', color: currentPage === 'catalog' ? 'white' : '#888', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' }}>
                        <LayoutGrid size={16} /> {t[currentLang]?.catalog || 'Каталог'}
                    </div>
                    <div onClick={() => {setCurrentPage('faq'); closeMenu()}} style={{ flex: 1, padding: '12px', background: currentPage === 'faq' ? '#4caf50' : 'transparent', color: currentPage === 'faq' ? 'white' : '#888', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' }}>
                        <HelpCircle size={16} /> {t[currentLang]?.faqTab || 'FAQ'}
                    </div>
                </div>

                {/* Блок: Стать */}
                <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '15px' }}>
                    <span style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>{t[currentLang]?.genderTitle}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {genderKeys?.map(gKey => (
                            <div key={gKey} onClick={(e) => { e.stopPropagation(); setSelectedGenders(prev => prev.includes(gKey) ? prev.filter(i => i !== gKey) : [...prev, gKey]); }} className={`filter-pill ${selectedGenders.includes(gKey) ? 'active' : ''}`} style={{ position: 'relative', zIndex: 10 }}>
                                {t[currentLang]?.genders?.[gKey]}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Блок: Тіло */}
                <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '15px' }}>
                    <span style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>{t[currentLang]?.bodyTitle}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {bodyKeys?.map(bKey => (
                            <div key={bKey} onClick={(e) => { e.stopPropagation(); setSelectedBody(prev => prev.includes(bKey) ? prev.filter(i => i !== bKey) : [...prev, bKey]); }} className={`filter-pill ${selectedBody.includes(bKey) ? 'active' : ''}`} style={{ position: 'relative', zIndex: 10 }}>
                                {filterBodyTypes?.[bKey] || bKey}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Блок: Волосся */}
                <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '15px' }}>
                    <span style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>{t[currentLang]?.hairTitle}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {hairKeys?.map(hKey => (
                            <div key={hKey} onClick={(e) => { e.stopPropagation(); setSelectedHair(prev => prev.includes(hKey) ? prev.filter(i => i !== hKey) : [...prev, hKey]); }} className={`filter-pill ${selectedHair.includes(hKey) ? 'active' : ''}`} style={{ position: 'relative', zIndex: 10 }}>
                                {filterHairColors?.[hKey] || hKey}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Блок: Фетиші */}
                <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '15px' }}>
                    <span style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>{t[currentLang]?.fetishesTitle}</span>
                    {t[currentLang]?.fetishes && Object.entries(t[currentLang].fetishes).map(([catKey, category]) => (
                        <div key={catKey} style={{ marginBottom: '8px', background: expandedFetishCat === catKey ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', border: expandedFetishCat === catKey ? `1px solid ${accent}44` : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s' }}>
                            <div onClick={(e) => { e.stopPropagation(); setExpandedFetishCat(expandedFetishCat === catKey ? null : catKey); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                                <span style={{ fontSize: '13px', color: expandedFetishCat === catKey ? 'white' : '#aaa', fontWeight: '600' }}>{category.title}</span>
                                {expandedFetishCat === catKey ? <ChevronUp size={16} color={accent} /> : <ChevronDown size={16} color="#666" />}
                            </div>
                            {expandedFetishCat === catKey && (
                                <div style={{ display: 'grid', gap: '12px', padding: '0 15px 15px 15px' }} className="fade-in-up">
                                    {Object.entries(category.items).map(([itemKey, itemLabel]) => (
                                        <div key={itemKey} onClick={(e) => { e.stopPropagation(); toggleFetish(itemKey); }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }} className="menu-hover">
                                            <div className={`neon-checkbox ${selectedFetishes.includes(itemKey) ? 'active' : ''}`} style={{marginRight:'12px'}}> {selectedFetishes.includes(itemKey) && <Check size={12} color="white" strokeWidth={3} />} </div>
                                            <span style={{ fontSize: '13px', color: selectedFetishes.includes(itemKey) ? 'white' : '#888', fontWeight: selectedFetishes.includes(itemKey) ? 'bold' : 'normal' }}>{itemLabel}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Повзунки віку та ціни */}
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 10, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                    
                    {/* Вік */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>{t[currentLang]?.ageTo}</span>
                        <span style={{ color: 'white', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>{filterAge}</span>
                    </div>
                    <input 
                        type="range" min="18" max="60" value={filterAge} onChange={e => setFilterAge(parseInt(e.target.value))} 
                        className="premium-slider" 
                        style={{ '--slider-color': accent, '--slider-percent': `${((filterAge - 18) / (60 - 18)) * 100}%`, position: 'relative', zIndex: 20 }} 
                    />
                    
                    {/* Ціна */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', marginBottom: '15px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>{t[currentLang]?.priceTo}</span>
                        <span style={{ color: accent, fontWeight: 'bold', background: `${accent}22`, padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>{filterPrice} ₴</span>
                    </div>
                    <input 
                        type="range" min="500" max="20000" step="500" value={filterPrice} onChange={e => setFilterPrice(parseInt(e.target.value))} 
                        className="premium-slider" 
                        style={{ '--slider-color': accent, '--slider-percent': `${((filterPrice - 500) / (20000 - 500)) * 100}%`, position: 'relative', zIndex: 20 }} 
                    />
                </div>

            </div>
        </div>
    );
};

export default SidebarFilters;