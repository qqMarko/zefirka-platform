import React, { useState } from 'react';
import { X, Wallet, CreditCard, Bitcoin, MessageCircle, Copy, Check, DollarSign, UploadCloud, Loader } from 'lucide-react';
import useStore from '../store/useStore';
import { C, R, overlay, modalBox, closeBtn, section, btnPrimary, btnGhost, input, label } from '../styles/ds';

const WalletModal = ({ setShowWalletModal, t, currentLang, accent, openSupport, initialAmount = '500', balance = 0 }) => {
  const [selectedMethod, setSelectedMethod] = useState('crypto');
  const [selectedCrypto, setSelectedCrypto] = useState('usdt_trc20');
  const [selectedCardSystem, setSelectedCardSystem] = useState('easypay'); 
  const [amount, setAmount] = useState(initialAmount.toString()); 
  const [copied, setCopied] = useState(false);

  // 🟢 СТАТУСИ ДЛЯ ЗАВАНТАЖЕННЯ ЧЕКА ТА ХЕШУ
  const [step, setStep] = useState(1); // 1 - Гаманець, 2 - Чек, 3 - Успіх
  const [receiptImage, setReceiptImage] = useState(null);
  const [txHash, setTxHash] = useState(''); // Стейт для хешу транзакції
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userUniqueId } = useStore();

  const INTERNAL_EXCHANGE_RATE = 42.5; 
  const MIN_AMOUNT = 300; 

  const cryptoWallets = {
      usdt_trc20: { name: 'USDT', network: 'Tron (TRC20)', address: 'TU4wsmMVoXevCpWqgdiEAX3G4EudGb19wE', qr: 'qr_usdt_trc20.jpg' },
      usdt_erc20: { name: 'USDT', network: 'Ethereum (ERC20)', address: '0x907186f6caf06246e81c2a79bbe2625e80656089', qr: 'qr_usdt_erc20.jpg' },
      usdt_sol: { name: 'USDT', network: 'Solana', address: '7bjZxzoshKBMgsSPUEH2aBdpszrSodu5Do1xhKCBsmAe', qr: 'qr_usdt_sol.jpg' },
      btc: { name: 'Bitcoin (BTC)', network: 'Bitcoin', address: 'bc1qt7g4u9udl24jvaq66xz0u9z2vzxylyx7h9htj2h9atf9kj58u3aqlpatla', qr: 'qr_btc.jpg' },
      eth_erc20: { name: 'Ethereum (ETH)', network: 'Ethereum (ERC20)', address: '0xbcb372250439ba360aa3867055174e3c09b0790e', qr: 'qr_eth_erc20.jpg' },
      eth_starknet: { name: 'Ethereum (ETH)', network: 'Starknet', address: '0x02194322830856d18a734c477b6b39e92f503690cbc07afe28856ae52af3c20b', qr: 'qr_eth_starknet.jpg' }
  };

  const handleCopy = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch (err) {}
        textArea.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAmountValid = Number(amount) >= MIN_AMOUNT;
  const usdEquivalent = (Number(amount) / INTERNAL_EXCHANGE_RATE).toFixed(2);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptImage(reader.result);
        };
        reader.readAsDataURL(file);
    }
  };

  const submitReceipt = async () => {
      if (!receiptImage) return;
      setIsSubmitting(true);
      
      const methodData = selectedMethod === 'card' ? selectedCardSystem : (selectedMethod === 'crypto' ? selectedCrypto : 'paypal');
      
      try {
          const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
          
          await fetch(`${BASE_URL}/wallet/topup-request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // 🟢 Додаємо txHash у запит
              body: JSON.stringify({
                  userId: userUniqueId,
                  amount: amount,
                  method: methodData,
                  currencyEq: usdEquivalent,
                  receiptImage: receiptImage,
                  txHash: txHash
              })
          });
          setStep(3); 
      } catch (error) {
          console.error("Помилка відправки чека", error);
          alert("Виникла помилка. Спробуйте ще раз.");
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div style={{ ...overlay, zIndex: 7000 }} onClick={() => setShowWalletModal(false)}>
        <div className="modal-pop custom-scrollbar" style={{ ...modalBox('700px', { padding: '28px', maxHeight: '92vh', overflowY: 'auto' }) }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowWalletModal(false)} style={closeBtn}><X size={16} /></button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <div style={{ width: '40px', height: '40px', background: `${C.accent}18`, border: `1px solid ${C.accent}33`, borderRadius: R.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Wallet size={20} color={C.accent} /></div>
                <div><div style={{ fontSize: '18px', fontWeight: '900', color: C.text }}>{t[currentLang]?.walletTitle || 'Гаманець'}</div><div style={{ color: C.textSub, fontSize: '12px', marginTop: '2px' }}>{t[currentLang]?.walletSub || 'Поповнення балансу'}</div></div>
            </div>

            {step === 1 && (
                <>
                    <div style={{ ...section(), textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '6px' }}>{t[currentLang]?.currentBalance || 'Поточний баланс'}</div>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: 'white' }}>{Number(balance || 0).toFixed(2)} <span style={{fontSize: '18px', color: accent}}>UAH</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: C.surface2, padding: '4px', borderRadius: R.sm, border: `1px solid ${C.border}` }}>
                        <button onClick={() => setSelectedMethod('crypto')} className="wallet-method-btn" style={{ flex: 1, padding: '12px 10px', background: selectedMethod === 'crypto' ? '#222' : 'transparent', border: 'none', borderRadius: '8px', color: selectedMethod === 'crypto' ? accent : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '14px' }}><Bitcoin size={18} /> {t[currentLang]?.cryptoBtn || 'Крипта'}</button>
                        <button onClick={() => setSelectedMethod('card')} className="wallet-method-btn" style={{ flex: 1, padding: '12px 10px', background: selectedMethod === 'card' ? '#222' : 'transparent', border: 'none', borderRadius: '8px', color: selectedMethod === 'card' ? accent : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '14px' }}><CreditCard size={18} /> {t[currentLang]?.cardBtn || 'Карта'}</button>
                        <button onClick={() => setSelectedMethod('paypal')} className="wallet-method-btn" style={{ flex: 1, padding: '12px 10px', background: selectedMethod === 'paypal' ? '#222' : 'transparent', border: 'none', borderRadius: '8px', color: selectedMethod === 'paypal' ? accent : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '14px' }}><DollarSign size={18} /> {t[currentLang]?.paypalBtn || 'PayPal'}</button>
                    </div>

                    <div style={{ minHeight: '250px' }}>
                        
                        {/* 💎 КРИПТА */}
                        {selectedMethod === 'crypto' && (
                            <div className="fade-in-up wallet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>{t[currentLang]?.selectCryptoNetwork || 'Виберіть мережу'}</label>
                                    <select value={selectedCrypto} onChange={(e) => setSelectedCrypto(e.target.value)} style={{ ...input(), cursor: 'pointer', marginBottom: '16px' }}>
                                        <option value="usdt_trc20">USDT — Tron (TRC20)</option>
                                        <option value="usdt_erc20">USDT — Ethereum (ERC20)</option>
                                        <option value="usdt_sol">USDT — Solana</option>
                                        <option value="btc">Bitcoin (BTC)</option>
                                        <option value="eth_erc20">Ethereum (ETH) — ERC20</option>
                                        <option value="eth_starknet">Ethereum (ETH) — Starknet</option>
                                    </select>
                                    
                                    <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>{t[currentLang]?.topUpAmount || 'Сума поповнення'}</label>
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...input(), fontSize: '22px', fontWeight: '900', textAlign: 'center', borderColor: isAmountValid ? C.border : C.danger, marginBottom: '8px' }} />
                                    
                                    {!isAmountValid ? (
                                        <div style={{ color: '#ff4444', fontSize: '12px', fontWeight: 'bold' }}>{t[currentLang]?.minAmountText || 'Мін. сума:'} {MIN_AMOUNT} ₴</div>
                                    ) : (
                                        <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '12px', color: '#888' }}>{t[currentLang]?.toPay || 'До сплати:'}</span>
                                                <span style={{ fontSize: '18px', fontWeight: '900', color: '#4caf50' }}>≈ ${usdEquivalent} USD</span>
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#888', textAlign: 'right' }}>{t[currentLang]?.internalRate || 'Внутрішній курс:'} 1 USD = {INTERNAL_EXCHANGE_RATE} ₴</div>
                                        </div>
                                    )}
                                    
                                    <div style={{ background: 'rgba(233, 30, 99, 0.05)', padding: '15px', borderRadius: '8px', border: `1px solid ${accent}33`, marginTop: '20px', fontSize: '12px', color: '#ccc', lineHeight: '1.6' }}>
                                        <strong style={{color: 'white', display: 'block', marginBottom: '5px'}}>{t[currentLang]?.howToTopUp || 'Як поповнити?'}</strong>
                                        {t[currentLang]?.step1Crypto || '1. Переведіть'} <b>${usdEquivalent} USD</b>.<br/>
                                        {t[currentLang]?.step2Crypto || '2. Натисніть кнопку "Підтвердити оплату".'}<br/>
                                        {t[currentLang]?.step3Crypto || '3. Надішліть скріншот у Підтримку.'}
                                    </div>

                                    <button disabled={!isAmountValid} onClick={() => setStep(2)} style={{ ...btnPrimary(), width: '100%', marginTop: '12px', opacity: isAmountValid ? 1 : 0.4, cursor: isAmountValid ? 'pointer' : 'not-allowed' }}>
                                        {t[currentLang]?.confirmPaymentBtn || 'Підтвердити оплату'}
                                    </button>
                                </div>

                                <div className="wallet-qr-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', border: `2px solid ${accent}`, marginBottom: '20px', width: '160px', height: '160px' }}>
                                        <img src={`/qrcodes/${cryptoWallets[selectedCrypto].qr}`} alt="Crypto QR" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} onError={(e) => {e.target.src = 'https://via.placeholder.com/160?text=NO+QR+IMAGE'}} />
                                    </div>
                                    <div style={{ ...section(), width: '100%', boxSizing: 'border-box' }}>
                                        <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', textAlign: 'center' }}>{t[currentLang]?.walletAddress || 'Адреса гаманця'}</div>
                                        <div 
                                            onClick={() => handleCopy(cryptoWallets[selectedCrypto].address)}
                                            style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-all', lineHeight: '1.5', fontFamily: 'monospace', marginBottom: '15px', textAlign: 'center', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)', transition: '0.2s' }}
                                            className="menu-hover"
                                            title="Натисніть для копіювання"
                                        >
                                            {cryptoWallets[selectedCrypto].address}
                                        </div>
                                        
                                        <button onClick={() => handleCopy(cryptoWallets[selectedCrypto].address)} style={{ ...btnGhost({ borderColor: copied ? C.success : C.border }), width: '100%', padding: '11px', color: copied ? C.success : C.textSub }}>
                                            {copied ? <><Check size={16} /> {t[currentLang]?.copied || 'Скопійовано!'}</> : <><Copy size={16} /> {t[currentLang]?.copyAddress || 'Копіювати адресу'}</>}
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '15px', textAlign: 'center', lineHeight: '1.5' }}>
                                        {t[currentLang]?.sendOnly || 'Надсилайте тільки'} <b>{cryptoWallets[selectedCrypto].name}</b> {t[currentLang]?.viaNetwork || 'через мережу'} <b>{cryptoWallets[selectedCrypto].network}</b>.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 💳 КАРТКИ */}
                        {selectedMethod === 'card' && (
                            <div className="fade-in-up" style={{ maxWidth: '450px', margin: '0 auto' }}>
                                <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: 'white', fontWeight: 'bold', marginBottom: '15px' }}>{t[currentLang]?.selectPaymentSystem || 'Оберіть систему'}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <div onClick={() => setSelectedCardSystem('easypay')} style={{ flex: '1 1 30%', background: selectedCardSystem === 'easypay' ? '#00A5E8' : '#000', padding: '12px 10px', borderRadius: '8px', border: `1px solid #00A5E8`, cursor: 'pointer', fontWeight: '900', fontStyle: 'italic', transition: '0.3s', color: selectedCardSystem === 'easypay' ? '#fff' : '#00A5E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>EasyPay</div>
                                        <div onClick={() => setSelectedCardSystem('ipay')} style={{ flex: '1 1 30%', background: selectedCardSystem === 'ipay' ? '#E30613' : '#000', padding: '12px 10px', borderRadius: '8px', border: `1px solid #E30613`, cursor: 'pointer', fontWeight: '900', transition: '0.3s', color: selectedCardSystem === 'ipay' ? '#fff' : '#E30613', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>iPay.ua</div>
                                        <div onClick={() => setSelectedCardSystem('paysend')} style={{ flex: '1 1 30%', background: selectedCardSystem === 'paysend' ? '#7633FF' : '#000', padding: '10px', borderRadius: '8px', border: `1px solid #7633FF`, cursor: 'pointer', fontWeight: '900', transition: '0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: selectedCardSystem === 'paysend' ? '#fff' : '#7633FF' }}><span>Paysend</span><span style={{fontSize: '9px', color: selectedCardSystem === 'paysend' ? '#eeddff' : '#aaa', fontWeight: 'normal', letterSpacing: '0.5px'}}>EU / PL</span></div>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#aaa', margin: 0, lineHeight: '1.5' }}>{t[currentLang]?.cardSafeText || 'Оплата безпечна'}</p>
                                    <div style={{ background: 'rgba(227, 6, 19, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #E30613', marginTop: '15px', fontSize: '11px', color: '#ff4444', fontWeight: 'bold' }}>⚠️ {t[currentLang]?.noCommentsWarning || 'Без коментарів до платежу!'}</div>
                                </div>

                                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>{t[currentLang]?.topUpAmount || 'Сума'}</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '15px', background: '#000', border: `1px solid ${isAmountValid ? accent : '#ff4444'}`, color: 'white', fontSize: '24px', fontWeight: 'bold', borderRadius: '10px', textAlign: 'center', outline: 'none', marginBottom: '5px' }} />
                                
                                {!isAmountValid && <div style={{ color: '#ff4444', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>{t[currentLang]?.minAmountText || 'Мін. сума:'} {MIN_AMOUNT} ₴</div>}
                                
                                <button disabled={!isAmountValid} onClick={() => setStep(2)} style={{ width: '100%', marginTop: '15px', padding: '18px', background: isAmountValid ? accent : '#333', border: 'none', borderRadius: '10px', color: isAmountValid ? 'white' : '#888', fontSize: '16px', fontWeight: '900', cursor: isAmountValid ? 'pointer' : 'not-allowed', transition: '0.3s', boxShadow: isAmountValid ? `0 10px 25px ${accent}44` : 'none' }} className={isAmountValid ? "menu-hover" : ""}>
                                    {t[currentLang]?.payBtn || 'ОПЛАТИТИ'} {amount} ₴
                                </button>
                            </div>
                        )}

                        {/* 🔵 PAYPAL */}
                        {selectedMethod === 'paypal' && (
                            <div className="fade-in-up wallet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                                <div>
                                    <div style={{ background: '#003087', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'inline-block' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', color: 'white', fontStyle: 'italic' }}>Pay<span style={{color: '#009cde'}}>Pal</span></span>
                                    </div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>{t[currentLang]?.topUpAmount || 'Сума'}</label>
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '15px', background: '#000', border: `1px solid ${isAmountValid ? '#003087' : '#ff4444'}`, color: 'white', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', outline: 'none', marginBottom: '5px' }} />
                                    
                                    {!isAmountValid ? (
                                        <div style={{ color: '#ff4444', fontSize: '12px', fontWeight: 'bold' }}>{t[currentLang]?.minAmountText || 'Мін. сума:'} {MIN_AMOUNT} ₴</div>
                                    ) : (
                                        <div style={{ background: 'rgba(0, 48, 135, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 48, 135, 0.3)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '12px', color: '#888' }}>{t[currentLang]?.toPay || 'До сплати:'}</span>
                                                <span style={{ fontSize: '18px', fontWeight: '900', color: '#009cde' }}>≈ ${usdEquivalent} USD</span>
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#888', textAlign: 'right' }}>{t[currentLang]?.internalRate || 'Внутрішній курс:'} 1 USD = {INTERNAL_EXCHANGE_RATE} ₴</div>
                                        </div>
                                    )}

                                    <button disabled={!isAmountValid} onClick={() => setStep(2)} style={{ width: '100%', marginTop: '20px', padding: '15px', background: isAmountValid ? '#003087' : '#333', border: 'none', borderRadius: '10px', color: isAmountValid ? 'white' : '#888', fontSize: '14px', fontWeight: '900', cursor: isAmountValid ? 'pointer' : 'not-allowed', transition: '0.3s', boxShadow: isAmountValid ? `0 10px 25px rgba(0,48,135,0.4)` : 'none' }} className={isAmountValid ? "menu-hover" : ""}>
                                        {t[currentLang]?.payBtn || 'ОПЛАТИТИ'} PAYPAL
                                    </button>
                                </div>

                                <div className="wallet-qr-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px', textAlign: 'center', lineHeight: '1.5' }}>
                                        {t[currentLang]?.scanPayPalQR || 'Відскануйте QR-код для оплати'} <b>${usdEquivalent} USD</b>.
                                    </p>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', border: '2px solid #003087' }}>
                                        <img src="/qrcodes/qr_paypal.jpg" alt="PayPal QR" style={{ width: '180px', height: '180px', display: 'block', objectFit: 'cover' }} onError={(e) => {e.target.src = 'https://via.placeholder.com/180?text=NO+QR+IMAGE'}} />
                                    </div>
                                    <div style={{ background: 'rgba(227, 6, 19, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #E30613', marginTop: '15px', fontSize: '11px', color: '#ff4444', fontWeight: 'bold' }}>
                                        ⚠️ {t[currentLang]?.noCommentsWarning || 'Без коментарів до платежу!'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 🟢 КРОК 2: ЗАВАНТАЖЕННЯ ФОТО ЧЕКА ТА ВВІД ХЕШУ */}
            {step === 2 && (
                <div className="fade-in-up" style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h3 style={{ color: 'white', marginBottom: '10px' }}>📸 Завантажте чек про оплату</h3>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>Щоб ми могли зарахувати кошти, прикріпіть скріншот чеку або квитанції.</p>

                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '180px', background: '#111', border: `2px dashed ${receiptImage ? '#4caf50' : accent}`, borderRadius: '16px', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: '0.3s' }} className="menu-hover">
                        {receiptImage ? (
                            <img src={receiptImage} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <UploadCloud size={48} color={accent} style={{ marginBottom: '15px' }} />
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>Натисніть для вибору файлу</span>
                                <span style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>JPG, PNG (max 5MB)</span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>

                    {/* 🟢 ПОЛЕ ДЛЯ ВВОДУ ХЕШУ */}
                    <div style={{ marginTop: '20px', textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>Хеш транзакції / Номер квитанції</label>
                        <input 
                            type="text" 
                            value={txHash} 
                            onChange={(e) => setTxHash(e.target.value)} 
                            placeholder="Наприклад: 0x123... або переконайтесь, що хеш є на фото"
                            style={{ width: '100%', boxSizing: 'border-box', padding: '15px', background: '#000', border: `1px solid #333`, color: 'white', fontSize: '14px', borderRadius: '10px', outline: 'none' }} 
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                        <button onClick={() => setStep(1)} style={{ ...btnGhost(), flex: 1, padding: '14px' }}>Назад</button>
                        <button onClick={submitReceipt} disabled={!receiptImage || isSubmitting} style={{ ...btnPrimary({ background: 'linear-gradient(135deg, #4caf50, #388e3c)', boxShadow: '0 4px 16px rgba(76,175,80,0.3)' }), flex: 2, padding: '14px', opacity: receiptImage ? 1 : 0.4, cursor: receiptImage ? 'pointer' : 'not-allowed' }}>
                            {isSubmitting ? <Loader size={18} className="spin" /> : <><Check size={18} /> Надіслати адміністратору</>}
                        </button>
                    </div>
                </div>
            )}

            {/* 🟢 КРОК 3: ЕКРАН УСПІХУ */}
            {step === 3 && (
                <div className="fade-in-up" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ width: '90px', height: '90px', background: 'rgba(76, 175, 80, 0.1)', border: '2px solid #4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                        <Check size={45} color="#4caf50" />
                    </div>
                    <h2 style={{ color: 'white', marginBottom: '15px', fontSize: '24px' }}>Чек успішно надіслано!</h2>
                    <p style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>Адміністратор перевірить оплату і баланс буде автоматично поповнено протягом 5-15 хвилин. Ви отримаєте сповіщення.</p>
                    <button onClick={() => setShowWalletModal(false)} style={{ ...btnGhost(), margin: '32px auto 0', padding: '13px 36px' }}>Закрити гаманець</button>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '18px', borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => { setShowWalletModal(false); openSupport(); }} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
                    <MessageCircle size={16} /> {t[currentLang]?.walletSupportBtn || 'Проблеми з оплатою? Написати у підтримку'}
                </button>
            </div>

        </div>
    </div>
  );
};

export default WalletModal;