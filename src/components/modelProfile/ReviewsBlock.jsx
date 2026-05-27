import React from 'react';
import { Star } from 'lucide-react';

const T = (k, fb) => fb;

const ReviewsBlock = ({
    localReviews, localAvg, localTotal,
    rating, setRating, reviewText, setReviewText,
    isSubmittingReview, submitReview, handleDeleteReview,
    isOwner, user
}) => (
    <div style={{ borderTop: '1px solid #27272a', paddingTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>Відгуки клієнтів</h3>
            <span style={{ color: '#71717a', fontSize: '14px', fontWeight: '600' }}>Всього: {localTotal}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#141417', padding: '16px', borderRadius: '16px', border: '1px solid #232326', marginBottom: '24px' }}>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#f59e0b', lineHeight: 1, letterSpacing: '-1px' }}>
                {localAvg > 0 ? localAvg.toFixed(1) : '0.0'}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={15} color={s <= Math.round(localAvg) ? '#f59e0b' : '#27272a'} fill={s <= Math.round(localAvg) ? '#f59e0b' : 'none'} />)}
                </div>
                <div style={{ fontSize: '12px', color: '#71717a', fontWeight: '600' }}>Загальна оцінка на основі відгуків</div>
            </div>
        </div>

        {!isOwner && (
            <div style={{ background: '#141417', border: '1px solid #232326', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                    {[1,2,3,4,5].map(s => (
                        <Star key={s} size={24} onClick={() => setRating(s)} color={s <= rating ? '#f59e0b' : '#3f3f46'} fill={s <= rating ? '#f59e0b' : 'none'} style={{ cursor: 'pointer', transition: '0.2s' }} />
                    ))}
                </div>
                <textarea
                    value={reviewText} onChange={e => setReviewText(e.target.value)}
                    placeholder="Поділіться досвідом співпраці..."
                    style={{ width: '100%', background: '#09090b', border: '1px solid #232326', color: '#fff', padding: '12px', borderRadius: '12px', minHeight: '80px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' }}
                    className="focus-accent-border"
                />
                <button onClick={submitReview} disabled={isSubmittingReview} style={{ width: '100%', padding: '14px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '12px', fontWeight: '800', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontSize: '14px', transition: '0.2s' }}>
                    {isSubmittingReview ? 'ОБРОБКА...' : 'ЗАЛИШИТИ ВІДГУК'}
                </button>
            </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {localReviews.length > 0 ? (
                localReviews.filter(r => isOwner || r.status !== 'pending').map((review, i) => (
                    <div key={i} style={{ background: '#141417', borderRadius: '16px', padding: '16px', border: '1px solid #232326', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{review.clientName}</div>
                                {review.status === 'pending' && (
                                    <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
                                        НА ПЕРЕВІРЦІ
                                    </div>
                                )}
                            </div>
                            <div style={{ color: '#52525b', fontSize: '12px' }}>{new Date(review.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={14} color={s <= review.rating ? '#f59e0b' : '#27272a'} fill={s <= review.rating ? '#f59e0b' : 'none'} />)}
                        </div>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{review.text}</p>
                        {isOwner && user?.vipPackage === 'diamond' && (
                            <button onClick={() => handleDeleteReview(review._id)} className="hover-scale"
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
                                🗑 Видалити
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <div style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '20px' }}>
                    Ще немає відгуків. Будьте першим!
                </div>
            )}
        </div>
    </div>
);

export default ReviewsBlock;