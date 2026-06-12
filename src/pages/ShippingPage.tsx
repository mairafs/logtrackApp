import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Alert, Badge } from '@components/UI'
import { useToast } from '@components/Toast'
import { useAuth, useBarcodeScanner, useAudioFeedback } from '@hooks/index'
import { apiClient } from '@services/api'
import { MESSAGES } from '@constants/index'
import type { Carrier, ShippingSession, ShippingItem } from '@appTypes/index';

export const ShippingPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, warning } = useToast()
  const { playSound } = useAudioFeedback()

  const [screen, setScreen] = useState<'init' | 'active'>('init')
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState<string>('')
  const [currentSession, setCurrentSession] = useState<ShippingSession | null>(null)
  const [items, setItems] = useState<ShippingItem[]>([])
  const [labelNumber, setLabelNumber] = useState('')
  const [driverIdentification, setDriverIdentification] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const labelInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)

  const { setIsListening } = useBarcodeScanner(handleLabelScanned)

  useEffect(() => {
    const loadCarriers = async () => {
      const data = await apiClient.getCarriers()
      setCarriers(data)
    }
    loadCarriers()
  }, [])

  async function handleLabelScanned(barcode: string) {
    if (!currentSession) return

    setError(null)
    setIsLoading(true)

    try {
      const isSuccess = await apiClient.addShippingItem(
        currentSession.id,
        'N/A', 
        barcode
      )

      if (isSuccess) {
        const newItem: ShippingItem = {
          id: Math.random().toString(),
          shippingSessionId: currentSession.id,
          orderId: 'N/A',
          labelNumber: barcode,
          shippedAt: new Date()
        }

        setItems([...items, newItem])
        playSound('success')
        success(`Volume registrado: ${barcode}`)
        setLabelNumber('')
        labelInputRef.current?.focus()
      } else {
        playSound('error')
        setError('Erro ao registrar etiqueta')
      }
    } catch (err) {
      playSound('error')
      setError('Erro ao processar etiqueta')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartSession() {
    if (!selectedCarrier) {
      setError('Selecione uma transportadora')
      return
    }

    setIsLoading(true)

    try {
      const session = await apiClient.startShippingSession(selectedCarrier)
      if (session) {
        setCurrentSession(session)
        setScreen('active')
        setItems([])
        setDriverIdentification('')
        playSound('success')
        success('Sessão de expedição iniciada')
        
        if (signatureCanvasRef.current) {
          const ctx = signatureCanvasRef.current.getContext('2d')
          if (ctx) ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height)
        }
      } else {
        setError('Não foi possível iniciar a expedição')
      }
    } catch (err) {
      setError('Erro ao iniciar expedição')
    } finally {
      setIsLoading(false)
    }
  }

  const startDrawing = (e: any) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    setIsDrawing(true)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  async function handleCompleteSession() {
    if (!currentSession) return
    if (items.length === 0) { warning('Escaneie pelo menos uma etiqueta'); return }
    if (!driverIdentification) { setError('Informe a identificação do motorista'); return }

    setIsLoading(true)
    try {
      const finalSignature = signatureCanvasRef.current?.toDataURL() || 'sem-assinatura'
      const labels = Array.from(new Set(items.map(item => item.labelNumber)))

      // ENVIANDO O NOME DO OPERADOR LOGADO (Motorista vai no identificador)
      const result = await apiClient.completeShippingSession(
        currentSession.id,
        finalSignature,
        driverIdentification,
        labels,
        user?.username || 'Operador'
      )

      if (result) {
        playSound('success')
        success(MESSAGES.SUCCESS_SHIPPED)
        setCurrentSession(null)
        setItems([])
        setScreen('init')
      }
    } catch (err) {
      setError('Erro ao finalizar expedição')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  if (screen === 'init') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-900 dark:text-white mb-2">🚚 Expedição de Pedidos</h2>
            <p className="text-gray-600 dark:text-gray-400">Registrar saída de mercadorias</p>
          </div>
          {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
          <form onSubmit={(e) => { e.preventDefault(); handleStartSession() }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transportadora *</label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Escolha a transportadora...</option>
                {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Button type="submit" variant="success" size="lg" isFullWidth isLoading={isLoading}>Iniciar Expedição</Button>
            <Button type="button" variant="ghost" size="md" isFullWidth onClick={() => navigate('/dashboard')}>← Voltar</Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-green-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🚚 Expedição</h1>
            <p className="text-green-100 text-sm">Transportadora: {carriers.find(c => c.id === currentSession?.carrierId)?.name}</p>
          </div>
          <Badge variant="success" size="md">{items.length} volumes</Badge>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col">
        {error && <Alert type="error" onClose={() => setError(null)} className="mb-4">{error}</Alert>}

        <Card className="mb-6 space-y-4">
          <Input
            ref={labelInputRef}
            label="Etiqueta de Envio do Volume"
            placeholder="Escaneie o código de rastreio (Ex: BR123456)"
            value={labelNumber}
            onChange={(e) => setLabelNumber(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </Card>

        {items.length > 0 && (
          <Card className="mb-6 flex-1 overflow-auto">
            <h3 className="font-semibold mb-4">Volumes Lidos</h3>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-100 dark:bg-gray-700 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium text-lg text-gray-900 dark:text-white">{item.labelNumber}</p>
                  </div>
                  <Badge variant="success" size="sm">✓ Expedido</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold mb-4 text-yellow-900 dark:text-yellow-100">⚠ Informações Obrigatórias</h3>
          <div className="space-y-4">
            <div onFocus={() => setIsListening(false)} onBlur={() => setIsListening(true)}>
              <Input
                label="Identificação do Motorista (CPF/Credencial)"
                placeholder="Documento"
                value={driverIdentification}
                onChange={(e) => setDriverIdentification(e.target.value)}
                isRequired
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assinatura Digital *</label>
              <canvas
                ref={signatureCanvasRef}
                width={600}
                height={200}
                className="w-full h-32 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-crosshair touch-none"
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
              />
              <button type="button" onClick={() => signatureCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 600, 200)} className="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Limpar Assinatura</button>
            </div>
          </div>
        </Card>
      </main>

      <div className="bg-white dark:bg-gray-800 p-4 border-t flex gap-2">
        <Button variant="danger" size="lg" isFullWidth onClick={() => { setCurrentSession(null); setItems([]); setScreen('init'); navigate('/dashboard') }}>← Cancelar</Button>
        <Button variant="success" size="lg" isFullWidth isLoading={isLoading} disabled={items.length === 0} onClick={handleCompleteSession}>✓ Finalizar Expedição</Button>
      </div>
    </div>
  )
}