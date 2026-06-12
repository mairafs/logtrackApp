import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL, REQUEST_TIMEOUT, MESSAGES } from '@constants/index'
import type { User, AuthCredentials, AuthResponse, Product, Order, Carrier, PackingSession, PickingSession, ShippingSession, ProductImportResult } from '@appTypes/index'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: { 'Content-Type': 'application/json' }
    })

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async login(credentials: AuthCredentials & { role?: string }): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/auth/login', credentials)
      if (response.data.token) localStorage.setItem('auth_token', response.data.token)
      return response.data
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || MESSAGES.ERROR_AUTH_FAILED
      throw new Error(errorMsg)
    }
  }

  async logout(): Promise<void> {
    try { await this.client.post('/auth/logout') } 
    finally { localStorage.removeItem('auth_token') }
  }

  async register(userData: any): Promise<boolean> {
    try {
      await this.client.post('/auth/register', userData)
      return true
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao realizar registo. Tente novamente.'
      throw new Error(errorMsg)
    }
  }

  async recoverPassword(email: string): Promise<boolean> {
    try {
      await this.client.post('/auth/recover', { email })
      return true
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao solicitar recuperação.'
      throw new Error(errorMsg)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.client.get<{ user: User }>('/auth/me')
      return response.data.user
    } catch { return null }
  }

  async getProducts(): Promise<Product[]> {
    try { const response = await this.client.get<{ products: Product[] }>('/products'); return response.data.products } 
    catch { return [] }
  }

  async getProductByCode(code: string): Promise<Product | null> {
    try { const response = await this.client.get<Product>(`/products/code/${code}`); return response.data } 
    catch { return null }
  }

  async importProducts(file: File): Promise<ProductImportResult> {
    try {
      const formData = new FormData(); formData.append('file', file)
      const response = await this.client.post<ProductImportResult>('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      return response.data
    } catch { return { success: false, totalRows: 0, imported: 0, skipped: 0, errors: [] } }
  }

  async getOrders(): Promise<Order[]> {
    try { const response = await this.client.get<{ orders: Order[] }>('/orders'); return response.data.orders } 
    catch { return [] }
  }

  async getOrderByInvoice(invoiceNumber: string): Promise<Order | null> {
    try { const response = await this.client.get<Order>(`/orders/${invoiceNumber}`); return response.data } 
    catch { return null }
  }

  async createOrder(invoiceNumber: string): Promise<Order | null> {
    try { const response = await this.client.post<Order>('/orders', { invoiceNumber }); return response.data } 
    catch { return null }
  }

  async updateOrderStatus(invoiceNumber: string, status: string, operatorName: string): Promise<boolean> {
    try { await this.client.post(`/orders/${invoiceNumber}/status`, { status, operatorName }); return true } 
    catch { return false }
  }

  async getCarriers(): Promise<Carrier[]> {
    try { const response = await this.client.get<{ carriers: Carrier[] }>('/carriers'); return response.data.carriers } 
    catch { return [] }
  }

  async startPackingSession(invoiceNumber: string): Promise<PackingSession | null> {
    try { const response = await this.client.post<PackingSession>('/packing/sessions', { invoiceNumber }); return response.data } 
    catch { return null }
  }

  async addPackingItem(sessionId: string, productId: string, quantity: number): Promise<boolean> {
    try { await this.client.post(`/packing/sessions/${sessionId}/items`, { productId, quantity }); return true } 
    catch { return false }
  }

  async completePackingSession(sessionId: string, operatorName: string): Promise<boolean> {
    try { await this.client.post(`/packing/sessions/${sessionId}/complete`, { operatorName }); return true } 
    catch { return false }
  }

  async startPickingSession(invoiceNumber: string): Promise<PickingSession | null> {
    try { const response = await this.client.post<PickingSession>('/picking/sessions', { invoiceNumber }); return response.data } 
    catch { return null }
  }

  async addPickingItem(sessionId: string, productId: string, pickedQty: number, requestedQty: number): Promise<boolean> {
    try { await this.client.post(`/picking/sessions/${sessionId}/items`, { productId, pickedQty, requestedQty }); return true } 
    catch { return false }
  }

  async completePickingSession(sessionId: string, operatorName: string): Promise<boolean> {
    try { await this.client.post(`/picking/sessions/${sessionId}/complete`, { operatorName }); return true } 
    catch { return false }
  }

  async startShippingSession(carrierId: string): Promise<ShippingSession | null> {
    try { const response = await this.client.post<ShippingSession>('/shipping/sessions', { carrierId }); return response.data } 
    catch { return null }
  }

  async addShippingItem(sessionId: string, orderId: string, labelNumber: string): Promise<boolean> {
    try { await this.client.post(`/shipping/sessions/${sessionId}/items`, { orderId, labelNumber }); return true } 
    catch { return false }
  }
  
  async completeShippingSession(sessionId: string, driverSignature: string, driverIdentification: string, invoices: string[], operatorName: string): Promise<boolean> {
    try { await this.client.post(`/shipping/sessions/${sessionId}/complete`, { driverSignature, driverIdentification, invoices, operatorName }); return true } 
    catch { return false }
  }

  async getDailyStats(): Promise<any> {
    try { const response = await this.client.get('/kpi/daily'); return response.data } 
    catch { return { totalToPack: 0, totalPacked: 0, totalPending: 0, totalShipped: 0 } }
  }

  async healthCheck(): Promise<boolean> {
    try { await this.client.get('/health'); return true } 
    catch { return false }
  }

  async getOrderHistory(query: string = ''): Promise<any[]> {
    try { const response = await this.client.get(`/history?q=${query}`); return response.data.history } 
    catch { return [] }
  }

  // --- NOVAS FUNÇÕES: GESTÃO DE EQUIPE ---
  async getUsers(): Promise<any[]> {
    try { const response = await this.client.get('/users'); return response.data.users || [] } 
    catch { return [] }
  }

  async approveUser(userId: string): Promise<boolean> {
    try { await this.client.post(`/users/${userId}/approve`); return true } 
    catch { return false }
  }

  async revokeUser(userId: string): Promise<boolean> {
    try { await this.client.post(`/users/${userId}/revoke`); return true } 
    catch { return false }
  }
}

export const apiClient = new APIClient()