// Tipos de Usuário e Autenticação
export type UserRole = 'admin' | 'separator' | 'packer' | 'shipper'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: Date
  lastLogin: Date
  isActive: boolean
}

export interface AuthCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
}

// Tipos de Produtos
export interface Product {
  id: string
  ean: string
  sku: string
  description: string
  photoUrl: string
  photoBase64?: string
  price?: number
  stock?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductImportPayload {
  ean: string
  sku: string
  description: string
  photoUrl: string
}

// Tipos de Pedidos e Status
export type OrderStatus = 'pending' | 'picking' | 'packing' | 'packed' | 'pending_issue' | 'shipped'
export type OrderStatusLabel = 'Falta embalar' | 'Embalado' | 'Pendente' | 'Expedidos'

export interface Order {
  id: string
  invoiceNumber: string
  status: OrderStatus
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
  packedAt?: Date
  shippedAt?: Date
  shippedBy?: string
  carrierId?: string
  notes?: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: Product
  requestedQty: number
  pickedQty?: number
  packedQty?: number
  pendingReason?: string
}

// Tipos de Embalagem (Packing)
export interface PackingSession {
  id: string
  invoiceNumber: string
  userId: string
  status: 'active' | 'completed' | 'abandoned'
  items: PackingItem[]
  startedAt: Date
  completedAt?: Date
  notes?: string
}

export interface PackingItem {
  id: string
  packingSessionId: string
  productId: string
  product?: Product
  quantity: number
  addedAt: Date
  isConfirmed: boolean
}

// Tipos de Separação (Picking)
export interface PickingSession {
  id: string
  invoiceNumber: string
  userId: string
  status: 'active' | 'completed' | 'pending_issue'
  items: PickingItem[]
  startedAt: Date
  completedAt?: Date
  pendingReason?: string
}

export interface PickingItem {
  id: string
  pickingSessionId: string
  productId: string
  product?: Product
  requestedQty: number
  pickedQty: number
  isPending: boolean
  pendingReason?: string
  pickedAt: Date
}

// Tipos de Expedição (Shipping)
export interface ShippingSession {
  id: string
  carrierId: string
  userId: string
  status: 'active' | 'completed'
  items: ShippingItem[]
  driverSignature?: string
  driverIdentification?: string
  startedAt: Date
  completedAt?: Date
}

export interface ShippingItem {
  id: string
  shippingSessionId: string
  orderId: string
  order?: Order
  labelNumber: string
  shippedAt: Date
}

// Tipos de Transportadora
export interface Carrier {
  id: string
  name: string
  code: string
  phone?: string
  email?: string
  isActive: boolean
  createdAt: Date
}

// Tipos de Operador e Produtividade
export interface OperatorMetrics {
  userId: string
  date: Date
  role: UserRole
  itemsPacked?: number
  itemsPicked?: number
  itemsShipped?: number
  ordersCompleted?: number
  avgTimePerOrder?: number
}

export interface DailyStats {
  totalToPack: number
  totalPacked: number
  totalPending: number
  totalShipped: number
  userPacked?: number
}

// Tipos de Logs e Rastreabilidade
export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// Tipos de Sincronização e Cache
export interface OfflineData {
  id: string
  type: 'picking' | 'packing' | 'shipping'
  data: any
  timestamp: Date
  isSynced: boolean
  syncAttempts: number
}

export interface SyncQueue {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: string
  entityData: any
  createdAt: Date
  isSynced: boolean
  lastAttempt?: Date
}

// Tipos de Pendências
export type PendingReason = 
  | 'produto_avariado'
  | 'nao_encontrado'
  | 'quantidade_incorreta'
  | 'outro'

export interface PendingIssue {
  id: string
  orderId: string
  itemId?: string
  reason: PendingReason
  description: string
  reportedBy: string
  reportedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: string
}

// Tipos de Relatórios
export interface ShippingReport {
  date: Date
  totalOrders: number
  totalItems: number
  totalShipped: number
  carriers: CarrierShippingStats[]
  operators: OperatorShippingStats[]
}

export interface CarrierShippingStats {
  carrierId: string
  carrierName: string
  ordersCount: number
  itemsCount: number
}

export interface OperatorShippingStats {
  userId: string
  username: string
  role: UserRole
  itemsProcessed: number
}

// Tipos de Notificação
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  actionUrl?: string
}

// Tipos de Upload de Arquivo
export interface FileUploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface ProductImportResult {
  success: boolean
  totalRows: number
  imported: number
  skipped: number
  errors: Array<{
    rowNumber: number
    reason: string
  }>
}
