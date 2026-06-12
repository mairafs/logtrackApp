import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  User,
  Order,
  Product,
  Carrier,
  DailyStats,
  PackingSession,
  PickingSession,
  ShippingSession
} from '@appTypes/index'
import { STORAGE_KEYS } from '@constants/index'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

interface AppState {
  isOnline: boolean
  isSyncing: boolean
  theme: 'light' | 'dark'
  language: 'pt-BR' | 'en'
  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: 'pt-BR' | 'en') => void
}

interface DataState {
  products: Product[]
  orders: Order[]
  carriers: Carrier[]
  dailyStats: DailyStats | null
  setProducts: (products: Product[]) => void
  setOrders: (orders: Order[]) => void
  setCarriers: (carriers: Carrier[]) => void
  setDailyStats: (stats: DailyStats) => void
  updateOrder: (order: Order) => void
}

interface SessionState {
  currentPackingSession: PackingSession | null
  currentPickingSession: PickingSession | null
  currentShippingSession: ShippingSession | null
  setPackingSession: (session: PackingSession | null) => void
  setPickingSession: (session: PickingSession | null) => void
  setShippingSession: (session: ShippingSession | null) => void
}

interface UIState {
  isLoading: boolean
  isModalOpen: boolean
  modalContent: string | null
  setLoading: (loading: boolean) => void
  openModal: (content: string) => void
  closeModal: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

// Store de Autenticação
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        login: (user: User, token: string) => {
          set({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.role === 'admin'
          })
        },
        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false
          })
        },
        setUser: (user: User) => {
          set({
            user,
            isAdmin: user.role === 'admin'
          })
        }
      }),
      {
        name: STORAGE_KEYS.CURRENT_USER
      }
    )
  )
)

// Store de App Global
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isSyncing: false,
        theme: 'light' as const,
        language: 'pt-BR' as const,
        setOnline: (online: boolean) => set({ isOnline: online }),
        setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
        setTheme: (theme: 'light' | 'dark') => {
          set({ theme })
          localStorage.setItem(STORAGE_KEYS.THEME, theme)
        },
        setLanguage: (language: 'pt-BR' | 'en') => {
          set({ language })
          localStorage.setItem(STORAGE_KEYS.LANGUAGE, language)
        }
      }),
      {
        name: 'app-store'
      }
    )
  )
)

// Store de Dados
export const useDataStore = create<DataState>()(
  devtools(
    (set) => ({
      products: [],
      orders: [],
      carriers: [],
      dailyStats: null,
      setProducts: (products: Product[]) => set({ products }),
      setOrders: (orders: Order[]) => set({ orders }),
      setCarriers: (carriers: Carrier[]) => set({ carriers }),
      setDailyStats: (stats: DailyStats) => set({ dailyStats: stats }),
      updateOrder: (order: Order) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === order.id ? order : o))
        }))
    })
  )
)

// Store de Sessão de Trabalho
export const useSessionStore = create<SessionState>()(
  devtools(
    (set) => ({
      currentPackingSession: null,
      currentPickingSession: null,
      currentShippingSession: null,
      setPackingSession: (session: PackingSession | null) =>
        set({ currentPackingSession: session }),
      setPickingSession: (session: PickingSession | null) =>
        set({ currentPickingSession: session }),
      setShippingSession: (session: ShippingSession | null) =>
        set({ currentShippingSession: session })
    })
  )
)

// Store de UI
export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isLoading: false,
      isModalOpen: false,
      modalContent: null,
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      openModal: (content: string) =>
        set({ isModalOpen: true, modalContent: content }),
      closeModal: () =>
        set({ isModalOpen: false, modalContent: null }),
      sidebarOpen: false,
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open })
    })
  )
)

// Seletores compostos para performance
export const useAuthState = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  return { user, isAuthenticated, isAdmin }
}

export const useOnlineStatus = () => {
  return useAppStore((state) => state.isOnline)
}

export const useSyncingStatus = () => {
  return useAppStore((state) => state.isSyncing)
}

export const useCurrentSession = () => {
  const packingSession = useSessionStore((state) => state.currentPackingSession)
  const pickingSession = useSessionStore((state) => state.currentPickingSession)
  const shippingSession = useSessionStore((state) => state.currentShippingSession)
  return { packingSession, pickingSession, shippingSession }
}
