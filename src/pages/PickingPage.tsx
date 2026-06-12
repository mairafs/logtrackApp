import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Alert, Badge, Modal } from '@components/UI'
import { useToast } from '@components/Toast'
import { useAuth, useBarcodeScanner, useAudioFeedback } from '@hooks/index'
import { apiClient } from '@services/api'
import { MESSAGES, PENDING_REASONS_LABELS } from '@constants/index'
import type { Product, PickingSession, PickingItem } from '@appTypes/index'

type ExtendedPickingItem = PickingItem & { isConfirmed: boolean, requestedQty: number, pickedQty: number }

interface PickingUIState {
  screen: 'init' | 'tela_a' | 'tela_b'
  invoiceNumber: string
  currentSession: PickingSession | null
  items: ExtendedPickingItem[]
  barcode: string
  selectedProduct: Product | null
  requestedQty: string
  pickedQty: string
  error: string | null
  isLoading: boolean
  pendingReason: string | null
  showPendingModal: boolean
}

export const PickingPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError, warning } = useToast()
  const { playSound } = useAudioFeedback()

  const [state, setState] = useState<PickingUIState>({
    screen: 'init', invoiceNumber: '', currentSession: null, items: [], barcode: '', 
    selectedProduct: null, requestedQty: '', pickedQty: '', error: null, isLoading: false, 
    pendingReason: null, showPendingModal: false
  })

  const inputARef = useRef<HTMLInputElement>(null)
  const requestedQtyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.screen === 'tela_a') inputARef.current?.focus()
    else if (state.screen === 'tela_b') requestedQtyRef.current?.focus()
  }, [state.screen])

  useBarcodeScanner(async (code) => {
    if (state.screen !== 'tela_a') return
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const product = await apiClient.getProductByCode(code)
      if (product) {
        setState((s) => ({ 
          ...s, selectedProduct: product, requestedQty: '', 
          pickedQty: '', screen: 'tela_b', barcode: '' 
        }))
        playSound('success')
      } else {
        playSound('error'); showError(MESSAGES.ERROR_PRODUCT_NOT_FOUND)
      }
    } finally { setState((s) => ({ ...s, isLoading: false })) }
  })

  async function handleStartSession() {
    if (!state.invoiceNumber.trim()) { setState((s) => ({ ...s, error: 'Informe a NF' })); return }
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const session = await apiClient.startPickingSession(state.invoiceNumber)
      if (session) {
        setState((s) => ({ ...s, currentSession: session, screen: 'tela_a', invoiceNumber: '', items: [], error: null }))
        playSound('success'); success('Coleta iniciada')
      } else { setState((s) => ({ ...s, error: 'Erro ao iniciar coleta' })) }
    } catch (err) { setState((s) => ({ ...s, error: 'Erro de conexão' })) } 
    finally { setState((s) => ({ ...s, isLoading: false })) }
  }

  async function handleConfirmProduct() {
    if (!state.selectedProduct || !state.pickedQty || !state.requestedQty) { 
      setState((s) => ({ ...s, error: 'Informe a quantidade solicitada na NF e a quantidade coletada.' })); 
      return 
    }
    
    const pQty = parseInt(state.pickedQty)
    const rQty = parseInt(state.requestedQty)
    
    if (isNaN(pQty) || pQty < 0 || isNaN(rQty) || rQty <= 0) { 
      setState((s) => ({ ...s, error: 'Quantidades numéricas inválidas.' })); 
      return 
    }
    if (pQty > rQty) { 
      setState((s) => ({ ...s, error: 'A quantidade coletada não pode ser maior que a solicitada!' })); 
      return 
    }
    
    setState((s) => ({ ...s, isLoading: true }))
    try {
      if (state.currentSession) {
        const isSuccess = await apiClient.addPickingItem(state.currentSession.id, state.selectedProduct.id, pQty, rQty)
        if (isSuccess) {
          const newItem = {
            id: Math.random().toString(), pickingSessionId: state.currentSession.id, 
            productId: state.selectedProduct.id, product: state.selectedProduct, 
            pickedQty: pQty, requestedQty: rQty, isConfirmed: pQty === rQty
          } as ExtendedPickingItem

          setState((s) => ({ ...s, items: [...s.items, newItem], screen: 'tela_a', selectedProduct: null, pickedQty: '', requestedQty: '', barcode: '', error: null }))
          playSound('success'); success(`${pQty}x validado(s) com sucesso`)
        }
      }
    } finally { setState((s) => ({ ...s, isLoading: false })) }
  }

  async function handleCompletePicking() {
    if (!state.currentSession) return
    if (state.items.length === 0) { warning('Bipe os itens antes de finalizar a separação'); return }
    
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const hasPending = state.items.some(item => !item.isConfirmed)
      const isSuccess = await apiClient.completePickingSession(state.currentSession.id, user?.username || 'Operador')
      
      if (isSuccess) {
        if (hasPending) {
          await apiClient.updateOrderStatus(state.currentSession.invoiceNumber, 'pending', user?.username || 'Operador')
          playSound('error'); warning('Separação finalizada COM PENDÊNCIAS.')
        } else {
          playSound('success'); success('Separação concluída com sucesso!')
        }
        // CORREÇÃO: Volta para a tela inicial limpando a NF (sem ir para o dashboard)
        setState((s) => ({ ...s, currentSession: null, items: [], screen: 'init', invoiceNumber: '' }))
      }
    } finally { setState((s) => ({ ...s, isLoading: false })) }
  }

  if (!user) { navigate('/login'); return null }

  // ==========================================
  // TELA 1: INÍCIO DA SEPARAÇÃO
  // ==========================================
  if (state.screen === 'init') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-blue-600">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-2">🔍 Separação</h2>
            <p className="text-gray-600 dark:text-gray-400">Bipe a Nota Fiscal para iniciar a coleta.</p>
          </div>
          {state.error && <Alert type="error" onClose={() => setState((s) => ({ ...s, error: null }))}>{state.error}</Alert>}
          <form onSubmit={(e) => { e.preventDefault(); handleStartSession() }} className="space-y-4">
            <Input label="Número da Nota Fiscal" placeholder="Escaneie o código ou digite a NF..." value={state.invoiceNumber} onChange={(e) => setState((s) => ({ ...s, invoiceNumber: e.target.value }))} autoFocus isRequired />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" size="lg" isFullWidth isLoading={state.isLoading}>Iniciar Separação</Button>
            <Button type="button" variant="ghost" size="md" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" isFullWidth onClick={() => navigate('/dashboard')}>← Voltar ao Menu</Button>
          </form>
        </Card>
      </div>
    )
  }

  // ==========================================
  // TELA 2: LISTA DE COLETA (BIPAGEM)
  // ==========================================
  if (state.screen === 'tela_a' && state.currentSession) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex flex-col">
        <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">🔍 Separação</h1>
              <p className="text-blue-200 text-sm">NF: {state.currentSession.invoiceNumber}</p>
            </div>
            <Badge className="bg-blue-800 text-white border-none" size="md">{state.items.length} coletados</Badge>
          </div>
        </header>

        <main className="flex-1 p-4 flex flex-col">
          {state.error && <Alert type="error" className="mb-4">{state.error}</Alert>}

          <Card className="mb-6 border-blue-200 dark:border-blue-900/30">
            <Input ref={inputARef} label="Código do Produto (EAN/SKU)" placeholder="Pressione o gatilho do leitor ou digite..." value={state.barcode} onChange={(e) => setState((s) => ({ ...s, barcode: e.target.value }))} disabled={state.isLoading} autoFocus />
          </Card>

          {state.items.length > 0 && (
            <Card className="mb-6 flex-1 overflow-auto animate-fade-in">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Itens já separados</h3>
              <div className="space-y-3">
                {state.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg flex justify-between items-center shadow-sm border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{item.product?.description}</p>
                      <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>SKU: {item.product?.sku}</span>
                        <span>•</span>
                        <span>Qtd: {item.pickedQty}/{item.requestedQty}</span>
                      </div>
                    </div>
                    <Badge variant={!item.isConfirmed ? 'warning' : 'success'} size="sm">
                      {!item.isConfirmed ? '⚠ Pendente' : '✓ OK'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>

        <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <Button variant="success" size="lg" isFullWidth onClick={handleCompletePicking} isLoading={state.isLoading}>✓ Finalizar Separação da NF</Button>
          <Button variant="warning" size="lg" isFullWidth onClick={() => setState((s) => ({ ...s, showPendingModal: true }))}>⚠ Marcar NF com Pendência</Button>
          {/* Se ele clicar em cancelar, aí sim volta para o dashboard */}
          <Button variant="ghost" size="md" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" isFullWidth onClick={() => { setState((s) => ({ ...s, currentSession: null, items: [], screen: 'init' })); navigate('/dashboard') }}>Cancelar Operação</Button>
        </div>

        <Modal isOpen={state.showPendingModal} onClose={() => setState((s) => ({ ...s, showPendingModal: false }))} title="Registrar Pendência na NF">
          <div className="space-y-4">
            <select value={state.pendingReason || ''} onChange={(e) => setState((s) => ({ ...s, pendingReason: e.target.value }))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Selecione o motivo da pendência...</option>
              {Object.entries(PENDING_REASONS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <div className="mt-6 pt-4 border-t flex flex-col gap-3">
              <Button variant="warning" size="lg" isFullWidth disabled={!state.pendingReason} onClick={async () => {
                if (!state.currentSession) return;
                await apiClient.updateOrderStatus(state.currentSession.invoiceNumber, 'pending', user?.username || 'Operador');
                // CORREÇÃO: Volta para a tela inicial limpando a NF
                setState((s) => ({ ...s, showPendingModal: false, screen: 'init', currentSession: null, items: [], invoiceNumber: '' }));
                success('NF enviada para Pendências!');
              }}>Confirmar Pendência</Button>
              <Button variant="ghost" size="md" isFullWidth onClick={() => setState((s) => ({ ...s, showPendingModal: false }))}>Voltar</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // ==========================================
  // TELA 3: VALIDAÇÃO VISUAL
  // ==========================================
  if (state.screen === 'tela_b' && state.selectedProduct) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex flex-col">
        <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-10">
          <h1 className="text-xl font-bold">Validação Visual de Coleta</h1>
        </header>

        <main className="flex-1 p-4 flex flex-col overflow-auto justify-center">
          <Card className="w-full max-w-md mx-auto border-2 border-blue-500 shadow-xl animate-fade-in">
            {state.error && <Alert type="error" className="mb-4">{state.error}</Alert>}

            <div className="mb-6 text-center">
              {state.selectedProduct.photoUrl && (
                <img src={state.selectedProduct.photoUrl} alt={state.selectedProduct.description} className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-700 mb-4 bg-white p-2" />
              )}
              <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{state.selectedProduct.description}</h3>
              <p className="text-sm text-gray-500 font-mono">SKU: {state.selectedProduct.sku} | EAN: {state.selectedProduct.ean}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solicitado na NF</label>
                <input 
                  ref={requestedQtyRef}
                  type="number" 
                  placeholder="Ex: 5"
                  value={state.requestedQty} 
                  onChange={(e) => setState((s) => ({ ...s, requestedQty: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qtd Coletada</label>
                <input 
                  type="number" 
                  placeholder="Físico" 
                  value={state.pickedQty} 
                  onChange={(e) => setState((s) => ({ ...s, pickedQty: e.target.value }))} 
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                />
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <Button variant="danger" size="lg" className="w-1/3" onClick={() => setState((s) => ({ ...s, screen: 'tela_a', selectedProduct: null, pickedQty: '', requestedQty: '' }))}>✕ Desfazer</Button>
              <Button variant="success" size="lg" className="w-2/3 shadow-md" isLoading={state.isLoading} onClick={handleConfirmProduct}>✓ Confirmar Coleta</Button>
            </div>

            <div className="mt-6">
              <Button variant="warning" size="md" isFullWidth onClick={() => setState((s) => ({ ...s, showPendingModal: true }))}>⚠ Registrar Pendência</Button>
            </div>
          </Card>
        </main>

        <Modal isOpen={state.showPendingModal} onClose={() => setState((s) => ({ ...s, showPendingModal: false }))} title="Registrar Falta/Avaria neste Item">
          <div className="space-y-4">
            <select value={state.pendingReason || ''} onChange={(e) => setState((s) => ({ ...s, pendingReason: e.target.value }))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Selecione o motivo da pendência...</option>
              {Object.entries(PENDING_REASONS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            
            <div className="mt-6 pt-4 border-t flex flex-col gap-3">
              <Button variant="warning" size="lg" isFullWidth disabled={!state.pendingReason} onClick={async () => {
                if (!state.currentSession || !state.selectedProduct) return;
                await apiClient.updateOrderStatus(state.currentSession.invoiceNumber, 'pending', user?.username || 'Operador');
                
                const pQty = parseInt(state.pickedQty) || 0;
                const rQty = parseInt(state.requestedQty) || 0;
                
                const newItem = { 
                  id: Math.random().toString(), pickingSessionId: state.currentSession.id, 
                  productId: state.selectedProduct.id, product: state.selectedProduct, 
                  pickedQty: pQty, requestedQty: rQty, isConfirmed: false 
                } as ExtendedPickingItem;

                setState((s) => ({ ...s, items: [...s.items, newItem], showPendingModal: false, screen: 'tela_a', selectedProduct: null, pickedQty: '', requestedQty: '', barcode: '', pendingReason: null }));
                warning('Produto marcado com pendência na NF.');
              }}>Confirmar Pendência no Item</Button>
              <Button variant="ghost" size="md" isFullWidth onClick={() => setState((s) => ({ ...s, showPendingModal: false }))}>Voltar</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  return null
}