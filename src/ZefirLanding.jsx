import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { socket } from './store/useStore';

import { t } from './data/translations';
import { accent } from './styles/theme';
import './styles/ZefirStyles.css'; 

import useStore from './store/useStore';
import useSmoothScroll from './hooks/useSmoothScroll';
import { useAppSockets } from './hooks/useAppSockets';
import { useProfileActions } from './hooks/useProfileActions'; 
import { useSupportLogic } from './hooks/useSupportLogic';     

import Header from './components/Header'; 
import WalletModal from './components/WalletModal';
import StatsModal from './components/StatsModal';
import ModelProfileModal from './components/ModelProfileModal';
import VipPackagesModal from './components/VipPackagesModal';
import Background from './components/Background';
import FaqSection from './components/FaqSection';
import SupportChat from './components/SupportChat';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import SidebarFilters from './components/SidebarFilters';
import CreateProfileModal from './components/CreateProfileModal';
import MessagesTab from './components/MessagesTab';
import AdminPanel from './components/AdminPanel'; 
import DisputesTab from './components/DisputesTab';
import CabinetPage from './components/CabinetPage'; 
import CatalogPage from './components/CatalogPage'; 

import BannedScreen from './components/BannedScreen';
import VerifyPromoModal from './components/VerifyPromoModal';
import ConfirmActionModal from './components/ConfirmActionModal';
import ContactSelectionModal from './components/ContactSelectionModal';
import ActiveDisputeOverlay from './components/ActiveDisputeOverlay';
import VerifyTimerModal from './components/VerifyTimerModal';
import PaymentLoaderOverlay from './components/PaymentLoaderOverlay';

const getGenderSuffix = (g) => { 
    if (g === 'm' || g === 'g') return '_m'; 
    if (g === 'c') return '_c'; 
    return ''; 
};

const ZefirkaPlatform = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPage = location.pathname === '/' ? 'catalog' : location.pathname.substring(1);
    const [previousPage, setPreviousPage] = useState('/'); 
    
    const [activeDisputeForMe, setActiveDisputeForMe] = useState(null);
    const [isDisputeMinimized, setIsDisputeMinimized] = useState(() => localStorage.getItem('zefir_dispute_minimized') === 'true'); 
    
    const {
        isLoggedIn, userUniqueId, userRole, email, currentLang, setLang: setCurrentLang,
        showAuth, setShowAuth, logout, login, 
        models, setModels, openCreate, openEdit, showCreateModal,
        isLoading, loadCatalog, totalPages, totalItems, 
        myModels, loadMyModels, setMyModels,
        myChats, startPrivateChat, 
        balance, loadBalance, isBannedStatus, trustScore,
        notifications, unreadNotifs, loadNotifications, markNotificationsAsRead, user 
    } = useStore();

    const {
        confirmModal, setConfirmModal, showWalletModal, setShowWalletModal,
        walletInitialAmount, setWalletInitialAmount, promptBump, promptDelete,
        executeBump, executeFreeBump, executeDelete
    } = useProfileActions({ userUniqueId, balance, user, loadBalance, loadMyModels, loadCatalog, models, setModels, myModels, setMyModels });

    const {
        showSupport, setShowSupport, supportMessages, setSupportMessages,
        supportInput, setSupportInput, supportAttachedImg, setSupportAttachedImg,
        supportFileRef, handleSupportAttach, handleSupportSend
    } = useSupportLogic(userUniqueId, email);

    const [isBanned, setIsBanned] = useState(false);
    const [hasActiveDisputeAlert, setHasActiveDisputeAlert] = useState(false);
    const [catalogPage, setCatalogPage] = useState(1);
    
    const [showNotifDropdown, setShowNotifDropdown] = useState(false); 
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showVipModal, setShowVipModal] = useState(false); 
    
    const [selectedFetishes, setSelectedFetishes] = useState([]);
    const [selectedHair, setSelectedHair] = useState([]);
    const [selectedBody, setSelectedBody] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [filterAge, setFilterAge] = useState(60);
    const [filterPrice, setFilterPrice] = useState(20000);
    const [expandedFetishCat, setExpandedFetishCat] = useState(null); 
    const [favorites, setFavorites] = useState([]);

    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyTimer, setVerifyTimer] = useState(10);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false); 
    const [showPaymentLoader, setShowPaymentLoader] = useState(false);
    
    const [contactSelectionModel, setContactSelectionModel] = useState(null);
    const [showVerifyPromo, setShowVerifyPromo] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);

    const genderKeys = ["w", "m", "c", "l", "g", "t"];
    const hairKeys = ["blonde", "brunette", "brown", "red", "color"];
    const bodyKeys = ["slim", "athletic", "curvy", "thick"];

    const userPkg = String(user?.vipPackage || user?.package || '').trim().toLowerCase();
    const userVLevel = Number(user?.vLevel) || 0;
    const hasHighVLevel = userVLevel >= 2 || (Array.isArray(myModels) && myModels.some(m => Number(m.vLevel) >= 2));
    // Реальні ID пакетів як вони зберігаються в БД (wallet.js рядки 91-95):
    // Моделі: 'start', 'premium', 'diamond'
    // Клієнти: 'premium_client' (GUEST), 'priority_chat' (PRIORITY), 'concierge'
    const allowedPackages = ['premium', 'diamond', 'premium_client', 'priority_chat', 'concierge'];
    // ✅ ВИПРАВЛЕНО: перевіряємо чи VIP ще активний (не закінчився 30-денний термін)
    const isVipActive = !user?.vipExpiresAt || new Date(user.vipExpiresAt) > new Date();
    const hasDisputeAccess = userRole === 'admin' || (allowedPackages.includes(userPkg) && isVipActive) || hasHighVLevel;

    useEffect(() => { 
        if (userUniqueId) { loadBalance(userUniqueId); loadNotifications(userUniqueId); }
    }, [userUniqueId, loadBalance, loadNotifications]);

    useEffect(() => { setIsBanned(isBannedStatus || localStorage.getItem('zefirka_banned_device') === 'true'); }, [isBannedStatus]);
    useEffect(() => { if (userUniqueId && userRole === 'model') loadMyModels(userUniqueId); }, [userUniqueId, userRole, loadMyModels]);
    useEffect(() => { setCatalogPage(1); }, [filterAge, filterPrice, selectedFetishes, selectedHair, selectedBody, selectedGenders]);

    useEffect(() => { 
        loadCatalog({ maxAge: filterAge, maxPrice: filterPrice, fetishes: selectedFetishes, hair: selectedHair, body: selectedBody, genders: selectedGenders }, catalogPage); 
    }, [filterAge, filterPrice, selectedFetishes, selectedHair, selectedBody, selectedGenders, catalogPage, loadCatalog]);

    useEffect(() => {
        let interval;
        if (showVerifyModal && verifyTimer > 0) interval = setInterval(() => setVerifyTimer(prev => prev - 1), 1000);
        else if (verifyTimer === 0) { 
            setShowVerifyModal(false); 
            login(Math.floor(100000 + Math.random() * 900000).toString(), userRole, email || 'guest@zefirka.com', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.token');
        }
        return () => clearInterval(interval);
    }, [showVerifyModal, verifyTimer]);

    useAppSockets({ userUniqueId, setSupportMessages, setShowSupport, setHasActiveDisputeAlert });

    // 🚀 МИТТЄВЕ ОТРИМАННЯ ПОВІДОМЛЕНЬ ВІД ПІДТРИМКИ (ТА ПРО ЗАКРИТТЯ)
    useEffect(() => {
        if (!userUniqueId || !socket) return;
        
        socket.off(`support_reply_${userUniqueId}`);
        socket.on(`support_reply_${userUniqueId}`, (newMsg) => {
            setSupportMessages(prev => [...prev, { ...newMsg, id: Date.now() }]);
            if (newMsg.text.includes('🔒')) {
                toast.success('Запит успішно вирішено та закрито!', { duration: 4000, style: { background: '#111', color: '#fff', border: `1px solid #4caf50` } });
            }
        });

        return () => { socket.off(`support_reply_${userUniqueId}`); };
    }, [userUniqueId, setSupportMessages]);

    useEffect(() => {
        if (isLoggedIn && userUniqueId) {
            const checkDispute = async () => {
                try {
                    const res = await fetch(`/api/disputes/check-active/${userUniqueId}`);
                    const data = await res.json();
                    if (data.active) setActiveDisputeForMe(data.dispute);
                } catch (e) { console.error("Помилка перевірки спору:", e); }
            };
            const timer = setTimeout(checkDispute, 800);

            if (socket) {
                socket.on(`new_dispute_${userUniqueId}`, (dispute) => {
                    setActiveDisputeForMe(dispute);
                    setIsDisputeMinimized(false);
                    localStorage.setItem('zefir_dispute_minimized', 'false');
                    toast.error("⚖️ Проти вас відкрито скаргу в Арбітражі!", { duration: 8000 });
                });
            }
            return () => { 
                clearTimeout(timer); 
                if (socket) socket.off(`new_dispute_${userUniqueId}`); 
            };
        }
    }, [isLoggedIn, userUniqueId]);

    const toggleDisputeMinimize = (val) => { setIsDisputeMinimized(val); localStorage.setItem('zefir_dispute_minimized', val ? 'true' : 'false'); };
    const handlePageChange = (newPage) => { setCatalogPage(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const closeMenu = () => { setIsMenuOpen(false); };
    
    const handleLogout = () => { 
        logout(); navigate('/'); setIsMenuOpen(false); setShowUserDropdown(false); 
        setShowSettingsModal(false); setShowNotifDropdown(false); setFavorites([]); 
    };

    const handleToggleFavorite = (model, e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!isLoggedIn) { setShowAuth(true); return; }
        if (favorites.some(m => m.id === model.id)) {
            toast(`${model.name || 'Анкету'} ${t[currentLang]?.removedFromFavs}`, { icon: '💔', style: { background: '#111', color: '#fff', border: '1px solid #333' } });
            setFavorites(prev => prev.filter(m => m.id !== model.id));
        } else {
            toast.success(`${model.name || 'Анкету'} ${t[currentLang]?.addedToFavs}`, { style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
            setFavorites(prev => [...prev, model]);
        }
    };

    const openPrivateChat = (model) => {
        if (!isLoggedIn) { setShowAuth(true); return; }
        startPrivateChat(model, t[currentLang]?.chatAutoGreeting || 'Привіт!');
        setPreviousPage(location.pathname); navigate('/messages'); setSelectedModel(null);
    };

    const toggleFetish = (fKey) => setSelectedFetishes(prev => prev.includes(fKey) ? prev.filter(i => i !== fKey) : [...prev, fKey]);
    const openWalletWithAmount = (amountStr) => { setWalletInitialAmount(amountStr); setShowWalletModal(true); };

    const handlePaymentInitiated = (amount, network) => {
        setShowWalletModal(false);
        setSupportInput(`👋 Привіт! Хочу поповнити баланс.\n💰 Сума: ${amount} UAH\n🌐 Мережа: ${network}\n🆔 Мій ID: ${userUniqueId}\n\n🔗 Мій хеш транзакції (TxID): [ВСТАВТЕ ХЕШ СЮДИ]`);
        setShowSupport(true);
        toast('Вставте хеш транзакції та відправте повідомлення!', { icon: '💬', duration: 6000, style: { background: '#111', color: '#fff', border: `1px solid ${accent}` } });
    };

    const filterSuffix = selectedGenders.length === 1 ? getGenderSuffix(selectedGenders[0]) : '';
    const filterBodyTypes = t[currentLang]?.[`bodyTypes${filterSuffix}`] || t[currentLang]?.bodyTypes;
    const filterHairColors = t[currentLang]?.[`hairColors${filterSuffix}`] || t[currentLang]?.hairColors;
    
    const isAnyModalOpen = showAuth || showCreateModal || showVipModal || showVerifyModal || showWalletModal || showSettingsModal || showSupport || selectedModel || showStats || contactSelectionModel || location.pathname === '/messages';
    
    if (isBanned) return <BannedScreen t={t} currentLang={currentLang} />;

    return (
        <div style={{ position: 'relative', height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Background currentPage={currentPage} />
            <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={12}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'rgba(10, 10, 18, 0.97)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: '16px',
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.05)',
                        maxWidth: '420px',
                        lineHeight: '1.45',
                    },
                    success: {
                        iconTheme: { primary: '#4caf50', secondary: '#fff' },
                        style: {
                            background: 'rgba(10, 10, 18, 0.97)',
                            border: '1px solid rgba(76,175,80,0.35)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(76,175,80,0.15)',
                        },
                    },
                    error: {
                        iconTheme: { primary: '#ff4444', secondary: '#fff' },
                        style: {
                            background: 'rgba(10, 10, 18, 0.97)',
                            border: '1px solid rgba(255,68,68,0.35)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(255,68,68,0.15)',
                        },
                    },
                    loading: {
                        iconTheme: { primary: accent, secondary: '#fff' },
                        style: {
                            background: 'rgba(10, 10, 18, 0.97)',
                            border: `1px solid ${accent}55`,
                            boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 20px ${accent}22`,
                        },
                    },
                }}
            />
            <audio id="chat-alert-sound" src="/sounds/ah.mp3" preload="auto" style={{ display: 'none' }}> </audio>

            <div className={`mobile-lang-pill ${isAnyModalOpen ? 'hidden' : ''}`}>
                {['UA', 'EN', 'RU'].map(l => ( 
                    <span key={l} onClick={() => setCurrentLang(l)} style={{ cursor: 'pointer', color: currentLang === l ? accent : '#888', transition: 'color 0.2s' }}>{l}</span> 
                ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1, flex: '1 1 0', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', WebkitOverflowScrolling: 'touch' }} className="custom-scrollbar main-content-wrapper">

                <PaymentLoaderOverlay showPaymentLoader={showPaymentLoader} t={t} currentLang={currentLang} accent={accent} />
                
                <ContactSelectionModal 
                    contactSelectionModel={contactSelectionModel} setContactSelectionModel={setContactSelectionModel} 
                    setSelectedModel={setSelectedModel} isLoggedIn={isLoggedIn} openPrivateChat={openPrivateChat} 
                    setShowAuth={setShowAuth} t={t} currentLang={currentLang} accent={accent} 
                />

                <VerifyTimerModal showVerifyModal={showVerifyModal} verifyTimer={verifyTimer} email={email} t={t} currentLang={currentLang} accent={accent} />

                <ConfirmActionModal 
                    confirmModal={confirmModal} setConfirmModal={setConfirmModal} 
                    executeBump={executeBump} executeFreeBump={executeFreeBump} executeDelete={executeDelete} accent={accent} 
                />

                <Header 
                    isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} isLoggedIn={isLoggedIn} userRole={userRole}
                    openCreate={openCreate} setShowAuth={setShowAuth} navigate={navigate} setCatalogPage={setCatalogPage}
                    currentLang={currentLang} setCurrentLang={setCurrentLang} accent={accent} trustScore={trustScore} t={t}
                    unreadNotifs={unreadNotifs} showNotifDropdown={showNotifDropdown} setShowNotifDropdown={setShowNotifDropdown} markNotificationsAsRead={markNotificationsAsRead}
                    notifications={notifications} email={email} userUniqueId={userUniqueId} showUserDropdown={showUserDropdown} setShowUserDropdown={setShowUserDropdown}
                    setShowVipModal={setShowVipModal} setShowWalletModal={setShowWalletModal} setShowSettingsModal={setShowSettingsModal} hasActiveDisputeAlert={hasActiveDisputeAlert}
                    setHasActiveDisputeAlert={setHasActiveDisputeAlert} setShowSupport={setShowSupport} handleLogout={handleLogout} user={user} hasDisputeAccess={hasDisputeAccess}
                />

                <SidebarFilters 
                    isMenuOpen={isMenuOpen} closeMenu={closeMenu} accent={accent} t={t} currentLang={currentLang} setCurrentLang={setCurrentLang} currentPage={currentPage} setCurrentPage={(p) => navigate(p === 'catalog' ? '/' : `/${p}`)} 
                    genderKeys={genderKeys} selectedGenders={selectedGenders} setSelectedGenders={setSelectedGenders} bodyKeys={bodyKeys} selectedBody={selectedBody} setSelectedBody={setSelectedBody} filterBodyTypes={filterBodyTypes} 
                    hairKeys={hairKeys} selectedHair={selectedHair} setSelectedHair={setSelectedHair} filterHairColors={filterHairColors} expandedFetishCat={expandedFetishCat} setExpandedFetishCat={setExpandedFetishCat} 
                    selectedFetishes={selectedFetishes} toggleFetish={toggleFetish} filterAge={filterAge} setFilterAge={setFilterAge} filterPrice={filterPrice} setFilterPrice={setFilterPrice} 
                />
                    
                <div className="page-content" style={{ position: 'relative', zIndex: 1, maxWidth: '1600px', margin: '0 auto' }}>
                    <Routes>
                        <Route path="/" element={
                            <CatalogPage 
                                isLoggedIn={isLoggedIn} userRole={userRole} t={t} currentLang={currentLang} accent={accent} 
                                totalItems={totalItems} isLoading={isLoading} models={models} 
                                setSelectedModel={setSelectedModel} setContactSelectionModel={setContactSelectionModel} 
                                favorites={favorites} handleToggleFavorite={handleToggleFavorite} 
                                totalPages={totalPages} catalogPage={catalogPage} handlePageChange={handlePageChange}
                            />
                        } />

                        <Route path="/cabinet" element={ isLoggedIn ? (
                            <CabinetPage 
                                userRole={userRole} balance={balance} userUniqueId={userUniqueId} 
                                myModels={myModels} favorites={favorites} myChats={myChats} user={user}
                                setShowStats={setShowStats} setShowVerifyPromo={setShowVerifyPromo} 
                                setShowWalletModal={setShowWalletModal} setPreviousPage={setPreviousPage} 
                                navigate={navigate} openCreate={openCreate} openEdit={openEdit} 
                                promptDelete={promptDelete} promptBump={promptBump} 
                                setSelectedModel={setSelectedModel} setContactSelectionModel={setContactSelectionModel} 
                                handleToggleFavorite={handleToggleFavorite} t={t} currentLang={currentLang} accent={accent} 
                            />
                        ) : <Navigate to="/" replace /> } />

                        <Route path="/messages" element={ isLoggedIn ? <MessagesTab setCurrentPage={(target) => navigate(target === 'catalog' || !target ? previousPage : `/${target}`)} setSelectedModel={setSelectedModel} /> : <Navigate to="/" replace /> } />
                        <Route path="/faq" element={ <FaqSection t={t} currentLang={currentLang} accent={accent} /> } />
                        <Route path="/godmode-zefir-777" element={ isLoggedIn && userRole === 'admin' ? <AdminPanel /> : <Navigate to="/" replace /> } />
                        <Route path="/disputes" element={ isLoggedIn ? <DisputesTab userUniqueId={userUniqueId} userRole={userRole} hasDisputeAccess={hasDisputeAccess} accent={accent} t={t} currentLang={currentLang} /> : <Navigate to="/" replace /> } />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>

                {showAuth && <AuthModal accent={accent} />}
                {showSettingsModal && <SettingsModal setShowSettingsModal={setShowSettingsModal} t={t} currentLang={currentLang} accent={accent} handleLogout={handleLogout} />}
                {showCreateModal && <CreateProfileModal />}
                {showVerifyPromo && <VerifyPromoModal setShowVerifyPromo={setShowVerifyPromo} setShowSupport={setShowSupport} handleSupportSend={handleSupportSend} t={t} currentLang={currentLang} accent={accent} />}
                {showSupport && <SupportChat setShowSupport={setShowSupport} supportMessages={supportMessages} supportInput={supportInput} setSupportInput={setSupportInput} supportAttachedImg={supportAttachedImg} setSupportAttachedImg={setSupportAttachedImg} supportFileRef={supportFileRef} handleSupportAttach={handleSupportAttach} handleSupportSend={handleSupportSend} t={t} currentLang={currentLang} accent={accent} />}
                {selectedModel && <ModelProfileModal model={selectedModel} onClose={() => setSelectedModel(null)} openPrivateChat={openPrivateChat} favorites={favorites} handleToggleFavorite={handleToggleFavorite} />}
                {showStats && <StatsModal setShowStats={setShowStats} t={t} currentLang={currentLang} accent={accent} />}
                {showWalletModal && <WalletModal setShowWalletModal={setShowWalletModal} t={t} currentLang={currentLang} accent={accent} openSupport={() => setShowSupport(true)} onPaymentSubmit={handlePaymentInitiated} initialAmount={walletInitialAmount} />}
                {showVipModal && <VipPackagesModal setShowVipModal={setShowVipModal} t={t} currentLang={currentLang} accent={accent} openWalletWithAmount={openWalletWithAmount} userRole={userRole} />}

                <ActiveDisputeOverlay activeDisputeForMe={activeDisputeForMe} isDisputeMinimized={isDisputeMinimized} toggleDisputeMinimize={toggleDisputeMinimize} userUniqueId={userUniqueId} userRole={userRole} />
            </div>
        </div>
    );
};

export default ZefirkaPlatform;