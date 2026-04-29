import React from 'react';
import { HelpCircle } from 'lucide-react';

const FaqSection = ({ t, currentLang, accent }) => {
    return (
        <main className="fade-in-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ borderBottom: `2px solid #4caf50`, paddingBottom: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '32px', margin: 0, letterSpacing: '2px', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '900' }}>
                    <HelpCircle size={36} /> {t[currentLang]?.faqTitle}
                </h1>
            </div>
            
            <div style={{ display: 'grid', gap: '40px' }}>
                <div>
                    <h2 style={{ color: 'white', borderLeft: '4px solid #4caf50', paddingLeft: '15px', marginBottom: '20px', fontWeight: 'bold' }}>{t[currentLang]?.faqCat1}</h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#4caf50', fontWeight: '600' }}>{t[currentLang]?.faq1_1_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq1_1_a}</p>
                        </div>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ff4444', fontWeight: '600' }}>{t[currentLang]?.faq1_2_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq1_2_a}</p>
                        </div>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#4caf50', fontWeight: '600' }}>{t[currentLang]?.faq1_3_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq1_3_a}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 style={{ color: 'white', borderLeft: `4px solid ${accent}`, paddingLeft: '15px', marginBottom: '20px', fontWeight: 'bold' }}>{t[currentLang]?.faqCat2}</h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: accent, fontWeight: '600' }}>{t[currentLang]?.faq2_1_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq2_1_a}</p>
                        </div>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: accent, fontWeight: '600' }}>{t[currentLang]?.faq2_2_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq2_2_a}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 style={{ color: 'white', borderLeft: '4px solid #ffc107', paddingLeft: '15px', marginBottom: '20px', fontWeight: 'bold' }}>{t[currentLang]?.faqCat3}</h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc107', fontWeight: '600' }}>{t[currentLang]?.faq3_1_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq3_1_a}</p>
                        </div>
                        <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffc107', fontWeight: '600' }}>{t[currentLang]?.faq3_2_q}</h3>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{t[currentLang]?.faq3_2_a}</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default FaqSection;