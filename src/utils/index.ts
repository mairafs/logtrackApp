/**
 * Valida se o código é um EAN-13 válido
 */
export function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false

  const digits = code.split('').map(Number)
  let sum = 0

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === digits[12]
}

/**
 * Valida se o código é um SKU válido
 */
export function isValidSKU(code: string): boolean {
  return /^[A-Z0-9\-]{3,50}$/.test(code)
}

/**
 * Valida credenciais de login
 */
export function validateLoginCredentials(username: string, password: string): string | null {
  if (!username || username.trim().length < 3) {
    return 'Usuário deve ter pelo menos 3 caracteres'
  }
  if (!password || password.length < 6) {
    return 'Senha deve ter pelo menos 6 caracteres'
  }
  return null
}

/**
 * Formata data para padrão brasileiro
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

/**
 * Formata data e hora para padrão brasileiro
 */
export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d)
}

/**
 * Formata hora no padrão HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

/**
 * Calcula tempo decorrido em formato legível
 */
export function getTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  const intervals: Record<string, number> = {
    ano: 31536000,
    mês: 2592000,
    semana: 604800,
    dia: 86400,
    hora: 3600,
    minuto: 60
  }

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value)
    if (interval >= 1) {
      return `${interval} ${key}${interval > 1 ? 's' : ''} atrás`
    }
  }

  return 'Agora mesmo'
}

/**
 * Formata número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Gera um ID aleatório
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Cópia de texto para clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Download de arquivo
 */
export function downloadFile(content: string, filename: string, type = 'text/csv'): void {
  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Converte CSV para JSON
 */
export function csvToJSON(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())

  return lines.slice(1).map((line) => {
    const obj: Record<string, string> = {}
    const currentLine = line.split(',').map((item) => item.trim())

    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = currentLine[i] || ''
    }

    return obj
  })
}

/**
 * Converte JSON para CSV
 */
export function jsonToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csv = [headers.join(',')]

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Escapa aspas e coloca entre aspas se contiver vírgula
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csv.push(values.join(','))
  }

  return csv.join('\n')
}

/**
 * Debounce de função
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Throttle de função
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Chunk array em lotes
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Remove valores duplicados de array
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

/**
 * Agrupa array por chave
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Ordena array de objetos
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Detecta se está em dispositivo móvel
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Detecta se o navegador suporta PWA
 */
export function isPWACapable(): boolean {
  return 'serviceWorker' in navigator && 'caches' in window
}

/**
 * Solicita permissão de notificação
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

/**
 * Envia notificação
 */
export function sendNotification(title: string, options?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options)
  }
}

/**
 * Converte base64 para blob
 */
export function base64ToBlob(base64: string, type = 'image/png'): Blob {
  const bstr = atob(base64)
  const n = bstr.length
  const u8arr = new Uint8Array(n)

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }

  return new Blob([u8arr], { type })
}

/**
 * Converte arquivo para base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Calcula tamanho legível de arquivo
 */
export function getFileSizeReadable(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Valida arquivo de importação
 */
export function validateImportFile(file: File): string | null {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'application/vnd.ms-excel',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  if (file.size > maxSize) {
    return 'Arquivo muito grande. Máximo de 10MB.'
  }

  if (!allowedTypes.includes(file.type)) {
    return 'Formato de arquivo inválido. Use CSV ou XLSX.'
  }

  return null
}
