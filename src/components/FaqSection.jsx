import React, { useState } from 'react';
import { 
    HelpCircle, ChevronDown, ChevronUp, Shield, Users, CreditCard, 
    Star, AlertTriangle, Camera, MessageCircle, Zap, Lock, TrendingUp, Award
} from 'lucide-react';

const FAQ_DATA = [
    {
        category: "Для Моделей",
        icon: <Star size={16} />,
        color: '#e91e63',
        items: [
            {
                q: "Як почати заробляти на платформі?",
                a: "Зареєструйтесь як Модель, пройдіть швидку верифікацію по фото, створіть анкету з описом та фото — і вона одразу з'явиться в каталозі. Клієнти знаходять вас самі. Баланс на платформі використовується тільки для VIP-статусів і підйому анкет; всі оплати за послуги йдуть напряму вам.",
            },
            {
                q: "Як вивести зароблені кошти?",
                a: "Платформа Zefirka не є платіжним посередником. Клієнти розраховуються з вами напряму на ваші реквізити або криптогаманець. Ми не утримуємо жодних комісій з ваших заробітків. Баланс на сайті — лише для просування анкети.",
            },
            {
                q: "Що таке Арбітраж і коли він потрібен?",
                a: "Арбітраж — система захисту від шахрайства. Якщо клієнт не заплатив або поводиться некоректно, ви відкриваєте спір. Незалежний Арбітр вивчить докази (скріншоти, переписку) і винесе рішення. Доступно з VIP-статусом.",
            },
            {
                q: "Скільки фото можна завантажити?",
                a: "Базовий акаунт: до 5 фото. START VIP: до 10 фото. PREMIUM: до 15 фото + 1 відео. DIAMOND: необмежено. Всі фото проходять автоматичну AI-модерацію на відверний контент перед публікацією.",
            },
        ]
    },
    {
        category: "Для Клієнтів",
        icon: <Users size={16} />,
        color: '#2196f3',
        items: [
            {
                q: "Чи бачить модель мої справжні дані?",
                a: "Ні. Платформа Zefirka гарантує повну анонімність. Модель бачить лише ваш ID та псевдонім, який ви вказали при реєстрації. Реальний email і особисті дані ніколи не передаються третім особам.",
            },
            {
                q: "Що дає Premium акаунт клієнту?",
                a: "Premium Client: прихований онлайн-статус, відсутність реклами. Priority Chat: ваші повідомлення бачать першими, доступ до закритих фото моделей, бейдж 'Надійний клієнт'. Concierge VIP: персональний асистент, індивідуальний підбір, гарантія безпечної угоди, знижка 15%.",
            },
            {
                q: "Як переконатися, що модель реальна?",
                a: "Кожна верифікована модель має значок ✅ у профілі. Верифікація проходить через відео-підтвердження з живим фото та документом. Також перевіряйте TrustScore — показник надійності, який знижується при скаргах.",
            },
        ]
    },
    {
        category: "Оплата та Баланс",
        icon: <CreditCard size={16} />,
        color: '#4caf50',
        items: [
            {
                q: "Як поповнити баланс на платформі?",
                a: "Баланс поповнюється трьома способами: криптовалюта (USDT, BTC через TRC20/ERC20), банківська карта через захищений шлюз, або PayPal. Мінімальна сума — 200 UAH. Після підтвердження платежу надішліть скріншот у Підтримку.",
            },
            {
                q: "Для чого потрібен баланс на платформі?",
                a: "Баланс витрачається лише на послуги платформи: купівля VIP-статусів для анкет, підняття анкети у пошуку, активація Premium для клієнтів. Оплата послуг моделей відбувається напряму між вами — платформа не бере комісію.",
            },
        ]
    },
    {
        category: "Безпека та Верифікація",
        icon: <Shield size={16} />,
        color: '#ff9800',
        items: [
            {
                q: "Що означає 'Рейтинг Довіри' (TrustScore)?",
                a: "TrustScore показує надійність користувача. Починається з 100%. Зменшується при порушеннях, скаргах або рішеннях Арбітра. При показнику нижче 30% акаунт обмежується у функціях. При 0% — видаляється без права відновлення. Підвищити рейтинг можна тільки через бездоганну поведінку протягом місяця.",
            },
            {
                q: "Чому AI заблокував моє фото?",
                a: "Наша система AI автоматично сканує всі фото перед публікацією. Блокується: відвертий контент (18+), зброя, насильство, особисті документи на фото. Використовуйте якісні фото у стриманому стилі для обкладинки анкети. Для преміум-контенту є закритий розділ фото.",
            },
            {
                q: "Чи зберігаються мої дані банківської карти?",
                a: "Ні. Платежі обробляються через зовнішній захищений платіжний шлюз. Платформа Zefirka не зберігає та не має доступу до даних ваших карток. Усі транзакції захищені шифруванням.",
            },
        ]
    },
    {
        category: "Правила платформи",
        icon: <AlertTriangle size={16} />,
        color: '#f44336',
        items: [
            {
                q: "Що категорично заборонено на платформі?",
                a: "Суворо заборонено: публікація неправдивої інформації або чужих фото, шахрайство та обман клієнтів/моделей, погрози та образи у чаті, будь-який контент з неповнолітніми (негайне блокування + передача даних правоохоронцям), спам та масові розсилки. Порушення = блокування без попередження.",
            },
            {
                q: "Як поскаржитися на іншого користувача?",
                a: "Є два шляхи: 1) Арбітраж — для серйозних спорів (неоплата, шахрайство). Рекомендується, якщо є докази. Доступно з VIP. 2) Підтримка — для загальних скарг та питань. Розгляд до 48 годин. У будь-якому випадку зберігайте скріншоти переписки як докази.",
            },
        ]
    },
];

const FaqItem = ({ q, a, accent, isOpen, onToggle }) => (
    <div 
        className={isOpen ? 'glass-card-open' : 'glass-card'}
        style={{ 
            borderRadius: '14px', overflow: 'hidden',
            transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
            boxShadow: isOpen ? '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)' : '0 2px 12px rgba(0,0,0,0.4)',
        }}
        onClick={onToggle}
    >
        <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px', gap: '12px',
        }}>
            <h3 style={{ 
                margin: 0, fontSize: '14px', fontWeight: '700', 
                color: isOpen ? '#fff' : '#ccc', flex: 1, lineHeight: '1.4',
                transition: 'color 0.2s',
            }}>{q}</h3>
            <div style={{ 
                flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px',
                background: isOpen ? `${accent}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isOpen ? accent + '44' : 'rgba(255,255,255,0.07)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
            }}>
                {isOpen ? <ChevronUp size={14} color={accent} /> : <ChevronDown size={14} color="#666" />}
            </div>
        </div>
        {isOpen && (
            <div style={{ 
                padding: '0 20px 18px 20px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                paddingTop: '14px',
            }} className="fade-in-up">
                <p style={{ 
                    margin: 0, color: '#aaa', fontSize: '13.5px', lineHeight: '1.75',
                    fontWeight: '500',
                }}>{a}</p>
            </div>
        )}
    </div>
);

const FaqSection = ({ t, currentLang, accent, setShowSupport }) => {
    const [openItem, setOpenItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);

    const displayed = activeCategory 
        ? FAQ_DATA.filter(c => c.category === activeCategory)
        : FAQ_DATA;

    return (
        <div className="faq-bg fade-in-up zef-faq-bg" style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <main className="zef-faq-main" style={{ padding: '0 0 24px 0' }}>
            <style>{`
                /* FAQ glass — backdrop-filter works over faq-bg container */
                .faq-bg {
                    background: rgba(255,255,255,0.015);
                    backdrop-filter: blur(30px) brightness(1.02);
                    -webkit-backdrop-filter: blur(30px) brightness(1.02);
                    border-radius: 20px;
                    padding: 24px;
                }
                .glass-card {
                    background: rgba(255,255,255,0.015) !important;
                    backdrop-filter: blur(16px) brightness(1.03) !important;
                    -webkit-backdrop-filter: blur(16px) brightness(1.03) !important;
                    border-color: rgba(255,255,255,0.07) !important;
                    box-shadow: 0 2px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04) !important;
                    transition: border-color 0.2s, background 0.2s !important;
                }
                .glass-card:hover {
                    border-color: rgba(255,255,255,0.14) !important;
                    background: rgba(255,255,255,0.03) !important;
                }
                .glass-card-open {
                    background: rgba(255,255,255,0.035) !important;
                    backdrop-filter: blur(20px) brightness(1.05) !important;
                    -webkit-backdrop-filter: blur(20px) brightness(1.05) !important;
                    border-color: rgba(255,255,255,0.12) !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06) !important;
                }
                .glass-stats {
                    background: rgba(255,255,255,0.015) !important;
                    backdrop-filter: blur(16px) brightness(1.03) !important;
                    -webkit-backdrop-filter: blur(16px) brightness(1.03) !important;
                    border: 1px solid rgba(255,255,255,0.07) !important;
                    box-shadow: 0 2px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04) !important;
                }
                .glass-cta {
                    background: rgba(255,255,255,0.015) !important;
                    backdrop-filter: blur(16px) brightness(1.03) !important;
                    -webkit-backdrop-filter: blur(16px) brightness(1.03) !important;
                    border: 1px solid rgba(255,255,255,0.07) !important;
                    box-shadow: 0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04) !important;
                }
                .glass-pill {
                    background: rgba(255,255,255,0.02) !important;
                    backdrop-filter: blur(12px) brightness(1.02) !important;
                    -webkit-backdrop-filter: blur(12px) brightness(1.02) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    transition: background 0.18s, border-color 0.18s !important;
                }
                .glass-pill:hover {
                    background: rgba(255,255,255,0.06) !important;
                    border-color: rgba(255,255,255,0.16) !important;
                }
                .glass-pill-active {
                    background: rgba(255,255,255,0.10) !important;
                    backdrop-filter: blur(12px) brightness(1.05) !important;
                    -webkit-backdrop-filter: blur(12px) brightness(1.05) !important;
                    border: 1px solid rgba(255,255,255,0.2) !important;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1) !important;
                }
            `}</style>
            
            {/* HEADER */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)',
                    borderRadius: '40px', padding: '8px 20px', marginBottom: '20px',
                }}>
                    <HelpCircle size={16} color="#4caf50" />
                    <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {t[currentLang]?.faqTab || 'FAQ / Допомога'}
                    </span>
                </div>
                <h1 style={{ 
                    fontSize: 'clamp(24px, 5vw, 36px)', margin: '0 0 12px 0', 
                    fontWeight: '900', color: '#fff', letterSpacing: '-0.5px',
                }}>
                    Довідковий Центр
                </h1>
                <p style={{ fontSize: '15px', color: '#666', margin: 0, fontWeight: '500' }}>
                    Відповіді на найпоширеніші питання про платформу Zefirka
                </p>
            </div>

            {/* STATS STRIP */}
            <div className="zef-faq-stats" style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                marginBottom: '36px',
            }}>
                {[
                    { icon: <Zap size={18} color="#ffc107" />, val: '24/7', label: 'Підтримка' },
                    { icon: <Lock size={18} color="#4caf50" />, val: '100%', label: 'Анонімність' },
                    { icon: <TrendingUp size={18} color={accent} />, val: '< 48г', label: 'Відповідь' },
                ].map((s, i) => (
                    <div key={i} style={{ 
                        boxShadow: '0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '16px', textAlign: 'center',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{s.icon}</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* CATEGORY FILTER PILLS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                <button
                    onClick={() => setActiveCategory(null)}
                    className={activeCategory === null ? 'glass-pill-active' : 'glass-pill'}
                    style={{
                        border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                        transition: 'all 0.2s',
                        color: activeCategory === null ? '#fff' : '#aaa',
                    }}
                >Всі питання</button>
                {FAQ_DATA.map(cat => (
                    <button
                        key={cat.category}
                        onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                        className={activeCategory === cat.category ? 'glass-pill-active' : 'glass-pill'}
                        style={{
                            border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                            color: activeCategory === cat.category ? '#fff' : '#888',
                        }}
                    >
                        <span style={{ color: cat.color }}>{cat.icon}</span>
                        {cat.category}
                    </button>
                ))}
            </div>

            {/* FAQ ITEMS */}
            <div style={{ display: 'grid', gap: '32px' }}>
                {displayed.map((cat) => (
                    <div key={cat.category}>
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px',
                            marginBottom: '16px', paddingBottom: '12px',
                            borderBottom: `1px solid ${cat.color}33`,
                        }}>
                            <div style={{ 
                                width: '32px', height: '32px', borderRadius: '10px',
                                background: `${cat.color}18`, border: `1px solid ${cat.color}44`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: cat.color,
                            }}>{cat.icon}</div>
                            <h2 style={{ 
                                margin: 0, fontSize: '16px', fontWeight: '900', 
                                color: '#fff', letterSpacing: '0.3px',
                            }}>{cat.category}</h2>
                            <span style={{ 
                                marginLeft: 'auto', fontSize: '11px', color: '#555', 
                                background: 'rgba(255,255,255,0.07)', padding: '3px 10px',
                                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)',
                                fontWeight: '700',
                            }}>{cat.items.length} питань</span>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {cat.items.map((item, idx) => {
                                const key = `${cat.category}-${idx}`;
                                return (
                                    <FaqItem
                                        key={key}
                                        q={item.q}
                                        a={item.a}
                                        accent={cat.color}
                                        isOpen={openItem === key}
                                        onToggle={() => setOpenItem(openItem === key ? null : key)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* BOTTOM CTA */}
            <div style={{ 
                marginTop: '48px', textAlign: 'center', 
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '20px', padding: '32px 24px',
            }}>
                <Award size={32} color={accent} style={{ marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                    Не знайшли відповідь?
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666', fontWeight: '500' }}>
                    Наша команда підтримки відповідає протягом кількох годин
                </p>
                <button
                    onClick={() => setShowSupport && setShowSupport(true)}
                    style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '9px',
                        background: `${accent}20`, border: `1px solid ${accent}55`,
                        borderRadius: '14px', padding: '13px 26px',
                        fontSize: '14px', fontWeight: '800', color: accent,
                        cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: `0 0 20px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${accent}35`; e.currentTarget.style.boxShadow=`0 0 32px ${accent}44, inset 0 1px 0 rgba(255,255,255,0.12)`; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background=`${accent}20`; e.currentTarget.style.boxShadow=`0 0 20px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`; e.currentTarget.style.transform='translateY(0)'; }}
                >
                    <MessageCircle size={16} strokeWidth={2.5} />
                    Написати у Підтримку
                </button>
            </div>
        </main>
        </div>
    );
};

export default FaqSection;