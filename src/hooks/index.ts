import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useAppStore, useAuthStore } from '@store/index'
import { SYNC_INTERVAL } from '@constants/index'

/**
 * Hook para detectar e monitorar a conexão online/offline
 */
export function useNetworkStatus() {
  const { setOnline } = useAppStore()

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])
}

/**
 * Hook para sincronizar dados offline automaticamente
 */
export function useAutoSync() {
  const isOnline = useAppStore((state) => state.isOnline)
  const { setSyncing } = useAppStore()

  useEffect(() => {
    if (!isOnline) return

    const syncInterval = setInterval(async () => {
      setSyncing(true)
      try {
        // Aqui entra a lógica de sincronização
        // await syncOfflineData()
      } catch (error) {
        console.error('Erro ao sincronizar:', error)
      } finally {
        setSyncing(false)
      }
    }, SYNC_INTERVAL)

    return () => clearInterval(syncInterval)
  }, [isOnline, setSyncing])
}

/**
 * Hook para gerenciar leitura de código de barras
 */
export function useBarcodeScanner(onScanned: (barcode: string) => void) {
  const [isListening, setIsListening] = useState(true)
  const [lastScanTime, setLastScanTime] = useState(0)
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.focus()
  }, [])

  useEffect(() => {
    if (!isListening) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora scans muito rápidos (debounce)
      const now = Date.now()
      if (now - lastScanTime < 100) return

      // Enter ou Tab para confirmar código
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const target = e.target as HTMLInputElement
        const barcode = target.value.trim()
        if (barcode) {
          onScanned(barcode)
          target.value = ''
          setLastScanTime(now)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isListening, lastScanTime, onScanned])

  return { inputRef, setIsListening }
}

/**
 * Hook para audio feedback (beep de erro/sucesso)
 */
export function useAudioFeedback() {
  const playSound = useCallback((type: 'success' | 'error' | 'warning') => {
    // Cria contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    if (type === 'success') {
      // Dois bips altos
      for (let i = 0; i < 2; i++) {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()

        oscillator.connect(gain)
        gain.connect(audioContext.destination)

        oscillator.frequency.value = 800
        oscillator.type = 'sine'

        gain.gain.setValueAtTime(0.3, audioContext.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

        oscillator.start(audioContext.currentTime + i * 0.15)
        oscillator.stop(audioContext.currentTime + 0.1 + i * 0.15)
      }
    } else if (type === 'error') {
      // Um bip baixo e longo
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      oscillator.connect(gain)
      gain.connect(audioContext.destination)

      oscillator.frequency.value = 300
      oscillator.type = 'sine'

      gain.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }, [])

  return { playSound }
}

/**
 * Hook para gerenciar autenticação
 */
export function useAuth() {
  const auth = useAuthStore()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const logout = useCallback(() => {
    auth.logout()
    localStorage.removeItem('auth_token')
  }, [auth])

  return {
    user,
    isAuthenticated,
    login: auth.login,
    logout,
    setUser: auth.setUser
  }
}

/**
 * Hook para debounce de valores
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para throttle de funções
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastCall, setLastCall] = useState(0)

  return useCallback(
    (...args: any[]) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        setLastCall(now)
        callback(...args)
      }
    },
    [callback, delay, lastCall]
  ) as T
}

/**
 * Hook para armazenamento local com sincronização
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value)
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Erro ao salvar no localStorage:`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue]
}

/**
 * Hook para gerenciar loading states
 */
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)

  const execute = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        setIsLoading(true)
        const result = await fn()
        return result
      } catch (error) {
        console.error('Erro durante execução:', error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { isLoading, setIsLoading, execute }
}

/**
 * Hook para gerenciar modal
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<string | ReactNode | null>(null)

  const open = useCallback((modalContent: string | ReactNode) => {
    setContent(modalContent)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setContent(null), 300) // Aguarda animação
  }, [])

  return { isOpen, content, open, close }
}

/**
 * Hook para timer (cronômetro)
 */
export function useTimer(initialSeconds = 0, autoStart = false) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(autoStart)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive])

  const start = useCallback(() => setIsActive(true), [])
  const pause = useCallback(() => setIsActive(false), [])
  const reset = useCallback(() => {
    setSeconds(initialSeconds)
    setIsActive(false)
  }, [initialSeconds])

  return { seconds, isActive, start, pause, reset, setSeconds }
}

/**
 * Hook para formato de tempo legível
 */
export function useFormattedTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const formatted = [hours, minutes, secs]
    .map((v) => String(v).padStart(2, '0'))
    .join(':')

  return formatted
}

/**
 * Hook para busca com debounce
 */
export function useSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  delay = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>(items)
  const debouncedQuery = useDebounce(query, delay)

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(items)
    } else {
      setResults(items.filter((item) => searchFn(item, debouncedQuery)))
    }
  }, [debouncedQuery, items, searchFn])

  return { query, setQuery, results }
}
