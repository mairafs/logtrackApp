import Dexie, { Table } from 'dexie'
import type {
  User,
  Product,
  Order,
  OrderItem,
  PackingSession,
  PackingItem,
  PickingSession,
  PickingItem,
  ShippingSession,
  ShippingItem,
  Carrier,
  AuditLog,
  OperatorMetrics,
  PendingIssue,
  Notification,
  OfflineData,
  SyncQueue
} from '@appTypes/index'

export class LogTrackDatabase extends Dexie {
  // Tabelas do banco de dados
  users!: Table<User>
  products!: Table<Product>
  orders!: Table<Order>
  orderItems!: Table<OrderItem>
  packingSessions!: Table<PackingSession>
  packingItems!: Table<PackingItem>
  pickingSessions!: Table<PickingSession>
  pickingItems!: Table<PickingItem>
  shippingSessions!: Table<ShippingSession>
  shippingItems!: Table<ShippingItem>
  carriers!: Table<Carrier>
  auditLogs!: Table<AuditLog>
  operatorMetrics!: Table<OperatorMetrics>
  pendingIssues!: Table<PendingIssue>
  notifications!: Table<Notification>
  offlineData!: Table<OfflineData>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('logtrack_v11')

    this.version(1).stores({
      users: 'id, username, email, role',
      products: 'id, ean, sku',
      orders: 'id, invoiceNumber, status, createdAt',
      orderItems: 'id, orderId, productId',
      packingSessions: 'id, invoiceNumber, userId, status',
      packingItems: 'id, packingSessionId, productId',
      pickingSessions: 'id, invoiceNumber, userId, status',
      pickingItems: 'id, pickingSessionId, productId',
      shippingSessions: 'id, carrierId, userId, status',
      shippingItems: 'id, shippingSessionId, orderId',
      carriers: 'id, code, name',
      auditLogs: 'id, userId, timestamp, entityType',
      operatorMetrics: '++id, userId, date',
      pendingIssues: 'id, orderId, reportedAt',
      notifications: 'id, userId, createdAt, read',
      offlineData: 'id, type, timestamp, isSynced',
      syncQueue: 'id, createdAt, isSynced'
    })
  }
}

// Instância global do banco de dados
export const db = new LogTrackDatabase()

// Funções de Helper para Operações Comuns

/**
 * Busca um produto pelo EAN ou SKU
 */
export async function getProductByCode(code: string): Promise<Product | undefined> {
  return db.products.where('ean').equals(code).first()
    .then(product => product)
    .catch(() => undefined)
    .then(product => {
      if (product) return product
      return db.products.where('sku').equals(code).first()
    })
}

/**
 * Busca todas as sessões de embalagem ativas
 */
export async function getActivePackingSessions(): Promise<PackingSession[]> {
  return db.packingSessions.where('status').equals('active').toArray()
}

/**
 * Cria uma nova sessão de embalagem
 */
export async function createPackingSession(
  invoiceNumber: string,
  userId: string
): Promise<PackingSession> {
  const session: PackingSession = {
    id: crypto.randomUUID(),
    invoiceNumber,
    userId,
    status: 'active',
    items: [],
    startedAt: new Date()
  }

  await db.packingSessions.add(session)
  return session
}

/**
 * Adiciona um item à sessão de embalagem
 */
export async function addPackingItem(
  packingSessionId: string,
  product: Product,
  quantity: number
): Promise<void> {
  const item: PackingItem = {
    id: crypto.randomUUID(),
    packingSessionId,
    productId: product.id,
    product,
    quantity,
    addedAt: new Date(),
    isConfirmed: true
  }

  await db.packingItems.add(item)

  // Atualiza a sessão
  const session = await db.packingSessions.get(packingSessionId)
  if (session) {
    session.items = await db.packingItems
      .where('packingSessionId')
      .equals(packingSessionId)
      .toArray()
    await db.packingSessions.put(session)
  }
}

/**
 * Finaliza uma sessão de embalagem
 */
export async function completePackingSession(packingSessionId: string): Promise<void> {
  const session = await db.packingSessions.get(packingSessionId)
  if (session) {
    session.status = 'completed'
    session.completedAt = new Date()
    await db.packingSessions.put(session)
  }
}

/**
 * Busca pedido pelo número de invoice
 */
export async function getOrderByInvoice(invoiceNumber: string): Promise<Order | undefined> {
  return db.orders.where('invoiceNumber').equals(invoiceNumber).first()
}

/**
 * Cria um novo pedido
 */
export async function createOrder(invoiceNumber: string): Promise<Order> {
  const order: Order = {
    id: crypto.randomUUID(),
    invoiceNumber,
    status: 'pending',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await db.orders.add(order)
  return order
}

/**
 * Sincroniza dados offline com o servidor
 */
export async function syncOfflineData(): Promise<void> {
  const pendingItems = await db.syncQueue.filter((item) => !item.isSynced).toArray()

  for (const item of pendingItems) {
    // Tenta sincronizar cada item
    try {
      // Aqui entra a lógica de envio para o servidor
      await db.syncQueue.update(item.id, { isSynced: true })
    } catch (error) {
      console.error('Erro ao sincronizar item:', error)
      // Incrementa tentativa de sincronização
      await db.syncQueue.update(item.id, {
        lastAttempt: new Date()
      })
    }
  }
}

/**
 * Adiciona uma ação à fila de sincronização
 */
export async function queueSyncAction(
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityData: any
): Promise<void> {
  const queueItem: SyncQueue = {
    id: crypto.randomUUID(),
    action,
    entityType,
    entityData,
    createdAt: new Date(),
    isSynced: false
  }

  await db.syncQueue.add(queueItem)
}

/**
 * Grava um log de auditoria
 */
export async function logAuditAction(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    timestamp: new Date()
  }

  await db.auditLogs.add(log)
  await queueSyncAction('create', 'audit_log', log)
}

/**
 * Obtém estatísticas diárias
 */
export async function getDailyStats(date: Date = new Date()): Promise<any> {
  const dateStr = date.toISOString().split('T')[0]
  const metrics = await db.operatorMetrics
    .where('date')
    .equals(dateStr)
    .toArray()

  return {
    totalPacked: metrics.reduce((sum, m) => sum + (m.itemsPacked || 0), 0),
    totalPicked: metrics.reduce((sum, m) => sum + (m.itemsPicked || 0), 0),
    totalShipped: metrics.reduce((sum, m) => sum + (m.itemsShipped || 0), 0),
    ordersCompleted: metrics.reduce((sum, m) => sum + (m.ordersCompleted || 0), 0)
  }
}

/**
 * Limpa dados antigos (>30 dias)
 */
export async function cleanupOldData(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Remove logs antigos
  await db.auditLogs.where('timestamp').below(thirtyDaysAgo).delete()

  // Remove sessões abandonadas antigas
  await db.packingSessions
    .where('completedAt')
    .below(thirtyDaysAgo)
    .delete()

  await db.pickingSessions.where('completedAt').below(thirtyDaysAgo).delete()
}

/**
 * Exporta dados para backup
 */
export async function exportDatabaseBackup(): Promise<string> {
  const backup = {
    users: await db.users.toArray(),
    products: await db.products.toArray(),
    orders: await db.orders.toArray(),
    timestamp: new Date().toISOString()
  }

  return JSON.stringify(backup)
}

/**
 * Importa dados de backup
 */
export async function importDatabaseBackup(backupJson: string): Promise<void> {
  try {
    const backup = JSON.parse(backupJson)

    if (backup.users) {
      await db.users.bulkAdd(backup.users)
    }
    if (backup.products) {
      await db.products.bulkAdd(backup.products)
    }
    if (backup.orders) {
      await db.orders.bulkAdd(backup.orders)
    }
  } catch (error) {
    console.error('Erro ao importar backup:', error)
    throw new Error('Falha ao importar backup de dados')
  }
}
