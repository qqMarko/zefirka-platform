import React from 'react';

const T = (k, fb) => fb; // якщо потрібен i18n — пробросити translateFn

/**
 * Повноекранний лайтбокс з зумом, перегортанням і мініатюрами.
 * Всі обробники мишки/тача керуються ззовні (parent).
 */
const PhotoLightbox = ({
    photos, index, setIndex, zoom, setZoom, offset, setOffset,
    onClose, onNext, onPrev,
    imgRef, dragStart,
    onMouseDown, onMouseMove, onMouseUp,
    onTouchStart, onTouchMove, onTouchEnd,
    accent
}) => {
    if (!photos?.length) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', zIndex: 10, backdropFilter: 'blur(8px)' }}>✕</button>

            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                {photos.length > 1 && (
                    <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '700', backdropFilter: 'blur(8px)' }}>
                        {index + 1} / {photos.length}
                    </div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '700', backdropFilter: 'blur(8px)' }}>
                    {Math.round(zoom * 100)}%
                </div>
            </div>

            {/* Zoom controls */}
            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
                <button onClick={e => { e.stopPropagation(); setZoom(p => Math.max(1, +(p - 0.5).toFixed(1))); if (zoom <= 1.5) setOffset({ x: 0, y: 0 }); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>−</button>
                <button onClick={e => { e.stopPropagation(); setZoom(1); setOffset({ x: 0, y: 0 }); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '0 16px', height: '44px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(8px)' }}>СКИНУТИ</button>
                <button onClick={e => { e.stopPropagation(); setZoom(p => Math.min(4, +(p + 0.5).toFixed(1))); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>+</button>
            </div>

            {/* Prev/Next */}
            {photos.length > 1 && (
                <>
                    <button onClick={e => { e.stopPropagation(); onPrev(e); }} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '52px', height: '52px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '22px', backdropFilter: 'blur(8px)' }}>‹</button>
                    <button onClick={e => { e.stopPropagation(); onNext(e); }} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '52px', height: '52px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '22px', backdropFilter: 'blur(8px)' }}>›</button>
                </>
            )}

            <div
                ref={imgRef}
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: zoom > 1 ? 'grab' : 'zoom-in', touchAction: 'none' }}
                onClick={e => e.stopPropagation()}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            >
                <img
                    src={photos[index]} alt="" draggable={false}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`, transition: dragStart ? 'none' : 'transform 0.15s ease', userSelect: 'none', borderRadius: zoom === 1 ? '8px' : '0' }}
                />
            </div>

            {photos.length > 1 && (
                <div style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10, padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', backdropFilter: 'blur(8px)' }} onClick={e => e.stopPropagation()}>
                    {photos.map((photo, i) => (
                        <div key={i} onClick={() => { setIndex(i); setZoom(1); setOffset({ x: 0, y: 0 }); }}
                            style={{ width: i === index ? '52px' : '44px', height: i === index ? '52px' : '44px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === index ? accent : 'transparent'}`, transition: '0.2s', flexShrink: 0, opacity: i === index ? 1 : 0.55 }}
                        >
                            <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhotoLightbox;