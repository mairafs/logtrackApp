// Constantes da aplicação

export const APP_NAME = 'LogTrack'
export const APP_VERSION = '11.0.0'
export const COMPANY_NAME = 'LogTrack Systems'

// URLs de API (variam conforme ambiente)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Timeouts
export const REQUEST_TIMEOUT = 10000 // 10 segundos
export const BARCODE_READ_TIMEOUT = 500 // 500ms limite de resposta RF05
export const SYNC_INTERVAL = 30000 // 30 segundos para sincronizar offline

// Variáveis de Estado Global
export const USER_ROLES = {
  ADMIN: 'admin',
  SEPARATOR: 'separator',
  PACKER: 'packer',
  SHIPPER: 'shipper'
} as const

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PICKING: 'picking',
  PACKING: 'packing',
  PACKED: 'packed',
  PENDING_ISSUE: 'pending_issue',
  SHIPPED: 'shipped'
} as const

export const ORDER_STATUS_LABELS = {
  pending: 'Falta embalar',
  picking: 'Em Separação',
  packing: 'Em Embalagem',
  packed: 'Embalado',
  pending_issue: 'Pendente',
  shipped: 'Expedidos'
} as const

export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
} as const

export const PENDING_REASONS = {
  DAMAGED: 'produto_avariado',
  NOT_FOUND: 'nao_encontrado',
  WRONG_QUANTITY: 'quantidade_incorreta',
  OTHER: 'outro'
} as const

export const PENDING_REASONS_LABELS = {
  produto_avariado: 'Produto Avariado',
  nao_encontrado: 'Não Encontrado no Estoque',
  quantidade_incorreta: 'Quantidade Incorreta',
  outro: 'Outro Motivo'
} as const

// Cores do Tema (Tailwind)
export const COLORS = {
  PRIMARY: '#003B6F', // Azul Escuro
  SECONDARY: '#FF9900', // Laranja
  SUCCESS: '#4CAF50', // Verde
  DANGER: '#F44336', // Vermelho
  WARNING: '#FF9800', // Laranja/Aviso
  LIGHT_GRAY: '#F9FAFB',
  DARK_GRAY: '#111827'
} as const

// Mensagens do Sistema
export const MESSAGES = {
  LOADING: 'Carregando...',
  ERROR_GENERIC: 'Ocorreu um erro. Tente novamente.',
  ERROR_NETWORK: 'Erro de conexão. Funcionando offline.',
  ERROR_INVALID_BARCODE: 'Código de barras inválido ou não encontrado',
  ERROR_PRODUCT_NOT_FOUND: 'Produto não encontrado na base de dados',
  ERROR_AUTH_FAILED: 'Falha na autenticação. Verifique suas credenciais.',
  ERROR_UNAUTHORIZED: 'Você não tem permissão para acessar esta área.',
  SUCCESS_LOGIN: 'Login realizado com sucesso!',
  SUCCESS_PACKING_COMPLETED: 'Embalagem concluída com sucesso!',
  SUCCESS_PICKING_COMPLETED: 'Separação concluída com sucesso!',
  SUCCESS_SHIPPED: 'Pedido expedido com sucesso!',
  SUCCESS_SYNC: 'Dados sincronizados com sucesso!',
  WARNING_OFFLINE: 'Modo offline ativado. Os dados serão sincronizados quando a conexão retornar.',
  INFO_PRODUCT_CONFIRMED: 'Produto confirmado e adicionado à caixa.',
  INFO_ITEM_REMOVED: 'Item removido da caixa.'
} as const

// Validações
export const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 6,
  MAX_SEARCH_RESULTS: 100,
  MAX_FILE_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
} as const

// Duração de Notificações
export const TOAST_DURATION = {
  SHORT: 2000, // 2s
  NORMAL: 3000, // 3s
  LONG: 5000 // 5s
} as const

// Breakpoints (Mobile-First Responsive)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const

// Ícones de Status
export const STATUS_ICONS = {
  pending: '📋',
  picking: '🔍',
  packing: '📦',
  packed: '✅',
  pending_issue: '⚠️',
  shipped: '🚚'
} as const

// Rotas da Aplicação
export const ROUTES = {
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin-login',
  DASHBOARD: '/dashboard',
  PICKING: '/picking',
  PACKING: '/packing',
  SHIPPING: '/shipping',
  ADMIN_PANEL: '/admin',
  PRODUCTS: '/admin/products',
  REPORTS: '/admin/reports',
  SETTINGS: '/admin/settings',
  NOT_FOUND: '/404'
} as const

// Variáveis de Armazenamento Local
export const STORAGE_KEYS = {
  CURRENT_USER: 'logtrack_current_user',
  AUTH_TOKEN: 'logtrack_auth_token',
  REMEMBER_USERNAME: 'logtrack_remember_username',
  THEME: 'logtrack_theme',
  LANGUAGE: 'logtrack_language',
  NOTIFICATION_SETTINGS: 'logtrack_notification_settings',
  LAST_SYNC: 'logtrack_last_sync'
} as const

// Limite de Tentativas
export const LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutos
  MAX_BARCODE_ATTEMPTS: 3,
  BARCODE_TIMEOUT: 5000 // 5s de espera para leitura
} as const

// Auditoria
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PRODUCT_IMPORT: 'PRODUCT_IMPORT',
  ORDER_CREATED: 'ORDER_CREATED',
  PICKING_STARTED: 'PICKING_STARTED',
  PICKING_COMPLETED: 'PICKING_COMPLETED',
  PACKING_STARTED: 'PACKING_STARTED',
  PACKING_COMPLETED: 'PACKING_COMPLETED',
  ITEM_ADDED: 'ITEM_ADDED',
  ITEM_REMOVED: 'ITEM_REMOVED',
  ISSUE_REPORTED: 'ISSUE_REPORTED',
  SHIPPING_COMPLETED: 'SHIPPING_COMPLETED'
} as const

// Métricas de Performance (RNF05)
export const PERFORMANCE_TARGETS = {
  BARCODE_SCAN_RESPONSE: 500, // ms - máximo permitido para resposta
  PAGE_LOAD_TIME: 2000, // ms
  API_RESPONSE_TIME: 3000 // ms
} as const

// Configuração de Notificações Push
export const NOTIFICATION_SETTINGS = {
  VIBRATION_PATTERN: [100, 50, 100], // ms
  SOUND_ENABLE: true,
  BADGE_COUNT: true,
  ACTIONS_ENABLE: true
} as const

// Horas de Funcionamento
export const OPERATION_HOURS = {
  START: '06:00',
  END: '22:00',
  TIMEZONE: 'America/Sao_Paulo'
} as const

// Padrão de Barcode (EAN-13)
export const BARCODE_PATTERNS = {
  EAN13: /^\d{13}$/,
  SKU: /^[A-Z0-9-]+$/
} as const

// Configurações de PWA
export const PWA_CONFIG = {
  CACHE_NAME: 'logtrack-v11.0.0',
  VERSION: '11.0.0',
  SKIP_WAITING: true,
  CLAIM_CLIENTS: true
} as const
