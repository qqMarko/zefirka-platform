// Каталог, мої анкети, вибрані
export const createCatalogSlice = (set, get) => {
    const BASE_URL = '/api';

    return {
        models: [],
        catalogCacheKey: '',
        catalogCachedAt: 0,
        myModels: [],
        favorites: [],
        totalPages: 1,
        totalItems: 0,
        isLoading: true,
        editingModel: null,

        setModels: (newModels) => set({ models: newModels }),
        setMyModels: (newMyModels) => set({ myModels: newMyModels }),

        loadCatalog: async (filters = {}, page = 1) => {
            const cacheKey = JSON.stringify({ ...filters, page });
            const CACHE_TTL = 60 * 1000;
            const state = get();
            if (page === 1 && cacheKey === state.catalogCacheKey && Date.now() - state.catalogCachedAt < CACHE_TTL) return;

            set({ isLoading: true });
            try {
                const queryParams = new URLSearchParams({ page, limit: 12 });
                if (filters.maxAge && filters.maxAge < 60) queryParams.append('maxAge', filters.maxAge);
                if (filters.maxPrice && filters.maxPrice < 20000) queryParams.append('maxPrice', filters.maxPrice);
                if (filters.fetishes?.length) queryParams.append('fetishes', filters.fetishes.join(','));
                if (filters.hair?.length) queryParams.append('hair', filters.hair.join(','));
                if (filters.body?.length) queryParams.append('body', filters.body.join(','));
                if (filters.genders?.length) queryParams.append('genders', filters.genders.join(','));

                const response = await fetch(`${BASE_URL}/profiles?${queryParams.toString()}`);
                const result = await response.json();
                if (result.success) {
                    const formattedModels = result.data.map(profile => {
                        const trust = parseInt(profile.userId?.trustScore);
                        const trustScore = isNaN(trust) ? 100 : trust;
                        return {
                            ...profile,
                            id: profile._id,
                            priceFrom: profile.priceFrom || 500,
                            priceTo: profile.priceTo || null,
                            vLevel: profile.vLevel || 0,
                            verification: profile.verification || 'none',
                            trustScore,
                            isApproved: profile.isApproved || false
                        };
                    });
                    set((state) => ({
                        models: page === 1 ? formattedModels : [...state.models, ...formattedModels],
                        totalPages: result.totalPages,
                        totalItems: result.totalItems,
                        catalogCacheKey: cacheKey,
                        catalogCachedAt: Date.now(),
                    }));
                }
            } catch (error) { console.error("❌ Помилка завантаження каталогу:", error); }
            finally { set({ isLoading: false }); }
        },

        loadMyModels: async (userId) => {
            if (!userId) return;
            try {
                const response = await fetch(`${BASE_URL}/profiles?userId=${userId}&fetchAll=true&t=${Date.now()}`);
                const result = await response.json();
                if (result.success) {
                    const formattedModels = result.data.map(profile => ({
                        ...profile,
                        id: profile._id,
                        priceFrom: profile.priceFrom || 500,
                        priceTo: profile.priceTo || null,
                        vLevel: profile.vLevel || 0,
                        verification: profile.verification || 'none',
                        trustScore: profile.trustScore || 100,
                        isApproved: profile.isApproved || false,
                        isMine: true
                    }));
                    set({ myModels: formattedModels });
                }
            } catch (error) { console.error("❌ Помилка моїх анкет:", error); }
        },

        loadFavorites: async (userId) => {
            if (!userId) return;
            try {
                const res = await fetch(`${BASE_URL}/profiles/favorites/${userId}`);
                const data = await res.json();
                if (data.success) {
                    set({ favorites: data.favorites.map(p => ({ ...p, id: p._id })) });
                }
            } catch (error) { console.error("❌ Помилка вибраних:", error); }
        },

        toggleFavoriteServer: async (userId, profile) => {
            if (!userId || !profile) return { added: false };
            try {
                const profileId = profile.id || profile._id;
                const token = localStorage.getItem('zefirka_token');
                const res = await fetch(`${BASE_URL}/profiles/favorites/${userId}/${profileId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    if (data.added) set(state => ({ favorites: [...state.favorites, { ...profile, id: profileId }] }));
                    else set(state => ({ favorites: state.favorites.filter(f => String(f.id) !== String(profileId)) }));
                    return { added: data.added };
                }
            } catch (error) { console.error("❌ Помилка тоглення:", error); }
            return { added: false };
        },

        addModel: (newModel) => set((state) => ({ myModels: [newModel, ...state.myModels] })),
        updateModel: (updatedModel) => set((state) => ({
            myModels: state.myModels.map(m => m.id === updatedModel.id ? updatedModel : m),
            models: state.models.map(m => m.id === updatedModel.id ? updatedModel : m)
        })),

        openCreate: () => set({ showCreateModal: true, editingModel: null }),
        openEdit: (model) => set({ showCreateModal: true, editingModel: model }),
    };
};