import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Badge, Spinner, Modal } from '@components/UI'
import { useToast } from '@components/Toast'
import { useAuth } from '@hooks/index'
import { apiClient } from '@services/api'
import * as xlsx from 'xlsx'
import { ThemeToggle } from '@components/ThemeToggle'
import { Search, Filter, ChevronRight, Package, AlertTriangle, CheckCircle, Truck, Clock, Medal, FileSpreadsheet, FileText, Printer, Upload, RefreshCw, Box, BarChart2, Users, UserCheck, UserX, ShieldAlert, FastForward, Eye } from 'lucide-react'

const getStatusColor = (status: string) => { switch (status) { case 'shipped': return 'success'; case 'packed': return 'info'; case 'pending': return 'warning'; default: return 'gray' } }
const getStatusLabel = (status: string) => { switch (status) { case 'shipped': return 'Expedido'; case 'packed': return 'Embalado'; case 'pending': return 'Pendente'; case 'picked': return 'Separado'; default: return 'Aberto' } }

const getActionIcon = (action: string) => {
  if (action.includes('Pulada')) return <FastForward size={16} className="text-orange-500" />
  if (action.includes('Separação')) return <Search size={16} className="text-blue-500" />
  if (action.includes('Embalagem')) return <Package size={16} className="text-purple-500" />
  if (action.includes('Pendência') || action.includes('Pendente')) return <AlertTriangle size={16} className="text-yellow-500" />
  if (action.includes('Expedido')) return <Truck size={16} className="text-green-500" />
  return <CheckCircle size={16} className="text-gray-500" />
}

const getLocalYYYYMMDD = (dateString: string) => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { error: showError, success, warning } = useToast()

  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'produtos' | 'romaneio' | 'usuarios'>('pedidos')
  const [isLoading, setIsLoading] = useState(false)
  
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [teamProductivity, setTeamProductivity] = useState<any[]>([])
  const [fullHistory, setFullHistory] = useState<any[]>([])
  
  const [carriers, setCarriers] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  
  const [orderSearch, setOrderSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterEmployee, setFilterEmployee] = useState('Todos')
  const [filterCarrier, setFilterCarrier] = useState('Todas')
  const [selectedDate, setSelectedDate] = useState('') 
  const [dateInputMask, setDateInputMask] = useState('') 
  const [showFilters, setShowFilters] = useState(false)
  
  const [romaneioDate, setRomaneioDate] = useState('') 
  const [romaneioDateMask, setRomaneioDateMask] = useState('') 
  const [romaneioCarrier, setRomaneioCarrier] = useState('Todas')
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [orderTimeline, setOrderTimeline] = useState<any[]>([])
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)
  
  const [itemsModalState, setItemsModalState] = useState<{ type: 'all' | 'pending', phase?: string } | null>(null)
  
  const [products, setProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/login'); return }
    loadDashboardAndOrders()
  }, [user, navigate])

  useEffect(() => {
    if (activeTab === 'produtos' && products.length === 0) handleLoadProducts()
    if (activeTab === 'usuarios' && usersList.length === 0) loadUsers()
  }, [activeTab])

  async function loadDashboardAndOrders() {
    setIsLoading(true)
    try {
      const [ordersData, statsData, historyData, carriersData, usersData] = await Promise.all([ 
        apiClient.getOrders(), 
        apiClient.getDailyStats(), 
        apiClient.getOrderHistory(''),
        apiClient.getCarriers(),
        apiClient.getUsers()
      ])
      
      setOrders(ordersData)
      setStats(statsData)
      setFullHistory(historyData)
      setCarriers(carriersData || [])
      setUsersList(usersData || [])

      const todayStr = new Date().toLocaleDateString('pt-BR')
      const todayLogs = historyData.filter((log: any) => new Date(log.created_at).toLocaleDateString('pt-BR') === todayStr)

      const prodMap: Record<string, any> = {}
      todayLogs.forEach((log: any) => {
        if (log.operator_name) {
          const op = log.operator_name
          if (!prodMap[op]) prodMap[op] = { name: op, embalados: 0, separados: 0, total: 0 }
          
          if (log.action === '📦 Embalagem Concluída') { prodMap[op].embalados++; prodMap[op].total++; }
          if (log.action === '✅ Separação Concluída') { prodMap[op].separados++; prodMap[op].total++; }
        }
      })
      setTeamProductivity(Object.values(prodMap).sort((a, b) => b.total - a.total))
    } catch (err) { showError('Erro ao carregar dados do sistema') } 
    finally { setIsLoading(false) }
  }

  async function openOrderTimeline(order: any) {
    setSelectedOrder(order); setIsLoadingTimeline(true)
    try {
      const invoiceNumber = order.invoice_number || order.invoiceNumber
      const [history, fullOrder] = await Promise.all([
        apiClient.getOrderHistoryExact(invoiceNumber),
        apiClient.getOrderByInvoice(invoiceNumber)
      ])
      
      setOrderTimeline(history)
      if (fullOrder && fullOrder.items) {
        setSelectedOrder(fullOrder) 
      }
    } catch (err) { showError('Erro ao carregar linha do tempo e itens') }
    finally { setIsLoadingTimeline(false) }
  }

  const handleDateMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2)
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9)
    setDateInputMask(val)
    if (val.length === 10) { const [day, month, year] = val.split('/'); setSelectedDate(`${year}-${month}-${day}`) } 
    else { setSelectedDate('') }
  }

  const handleRomaneioDateMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2)
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9)
    setRomaneioDateMask(val)
    if (val.length === 10) { const [day, month, year] = val.split('/'); setRomaneioDate(`${year}-${month}-${day}`) } 
    else { setRomaneioDate('') }
  }

  let baseOrders = orders;
  if (filterStatus === 'Expedido') {
    const expedidosLogs = fullHistory.filter(log => log.action.includes('Expedido'));
    baseOrders = expedidosLogs.map(log => ({
      id: log.id,
      invoice_number: log.invoice_number,
      status: 'shipped',
      created_at: log.created_at,
      operator_name: log.operator_name,
    }));
    baseOrders = baseOrders.filter((v, i, a) => a.findIndex(t => (t.invoice_number === v.invoice_number)) === i);
  }

  const filteredOrders = baseOrders.filter(o => { 
    const invoice = o.invoice_number || o.invoiceNumber || ''; 
    const matchesSearch = invoice.toLowerCase().includes(orderSearch.toLowerCase()); 
    const matchesStatus = filterStatus === 'Todos' || filterStatus === 'Expedido' || getStatusLabel(o.status) === filterStatus; 
    
    let matchesDate = true;
    if (selectedDate) { matchesDate = fullHistory.some(log => log.invoice_number?.trim().toUpperCase() === invoice.trim().toUpperCase() && getLocalYYYYMMDD(log.created_at) === selectedDate); }

    let matchesEmployee = filterEmployee === 'Todos';
    if (!matchesEmployee) { 
      const opNameClean = filterEmployee.trim().toLowerCase(); 
      matchesEmployee = fullHistory.some(log => log.invoice_number?.trim().toUpperCase() === invoice.trim().toUpperCase() && (log.operator_name || '').toLowerCase().includes(opNameClean)); 
    }
    
    let matchesCarrier = filterCarrier === 'Todas';
    if (!matchesCarrier) {
      matchesCarrier = fullHistory.some(log => log.invoice_number?.trim().toUpperCase() === invoice.trim().toUpperCase() && (log.action || '').includes(filterCarrier));
    }
    
    return matchesSearch && matchesStatus && matchesDate && matchesEmployee && matchesCarrier; 
  })

  const dailyShipped = fullHistory.filter(log => {
    if (!log.action.includes('Expedido')) return false;
    
    let matchesDate = true;
    if (romaneioDate) { matchesDate = getLocalYYYYMMDD(log.created_at) === romaneioDate; } 
    else { const todayStr = new Date().toLocaleDateString('pt-BR'); matchesDate = new Date(log.created_at).toLocaleDateString('pt-BR') === todayStr; }

    let matchesCarrier = true;
    if (romaneioCarrier !== 'Todas') {
      matchesCarrier = log.action.includes(romaneioCarrier);
    }

    return matchesDate && matchesCarrier;
  });

  const referenceDate = romaneioDate ? new Date(romaneioDate + 'T12:00:00') : new Date()
  const displayDateFormatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(referenceDate)

  // LÓGICA ATUALIZADA: EXPORTAÇÃO EXCEL COM CABEÇALHO ZIG
  function handleExportRomaneio(format: 'csv' | 'excel') {
    if (dailyShipped.length === 0) { showError('Nenhum volume expedido na data selecionada.'); return }
    
    try {
      let worksheet;

      if (format === 'excel') {
        // Formato avançado para Excel (Array of Arrays)
        const wsData: any[][] = [
          ["ZIG MATERIAIS ELÉTRICOS LTDA"],
          ["CNPJ: 39.574.568/0001-51"],
          ["R FELIPE CAMARÃO, 17, LOJA 06 – NOSSA SENHORA DAS DORES"],
          ["55.004-530 CARUARU – PE"],
          ["PROTOCOLO DE RECEBIMENTO"],
          [], // Linha em branco
          ["Data e Hora", "Etiqueta / Volume", "Operador LogTrack", "Detalhes da Coleta"]
        ];

        // Adiciona os dados reais
        dailyShipped.forEach(log => {
          wsData.push([
            new Date(log.created_at).toLocaleString('pt-BR'),
            log.invoice_number,
            log.operator_name,
            log.action
          ]);
        });

        // Adiciona rodapé de assinatura
        wsData.push([]);
        wsData.push([]);
        wsData.push([null, "____________________________________________________"]);
        wsData.push([null, "Assinatura do motorista"]);

        worksheet = xlsx.utils.aoa_to_sheet(wsData);

        // Mesclar células do cabeçalho e assinatura
        worksheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Nome da Empresa
          { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // CNPJ
          { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Endereço
          { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // CEP
          { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Protocolo
          { s: { r: wsData.length - 2, c: 1 }, e: { r: wsData.length - 2, c: 2 } }, // Linha assinatura
          { s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 2 } }  // Texto assinatura
        ];

        // Largura das colunas
        worksheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 50 }];

      } else {
        // Formato simples para CSV
        const exportData = dailyShipped.map(log => ({ 
          'Data e Hora': new Date(log.created_at).toLocaleString('pt-BR'), 
          'Etiqueta / Volume': log.invoice_number, 
          'Operador LogTrack': log.operator_name, 
          'Detalhes da Coleta': log.action 
        }))
        worksheet = xlsx.utils.json_to_sheet(exportData)
      }

      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, "Romaneio")
      
      const dateTag = romaneioDate || new Date().toISOString().split('T')[0];
      if (format === 'excel') { 
        xlsx.writeFile(workbook, `romaneio-expedicao-${dateTag}.xlsx`); 
        success('Romaneio exportado em formato XLSX!') 
      } else { 
        xlsx.writeFile(workbook, `romaneio-expedicao-${dateTag}.csv`); 
        success('Romaneio exportado em formato CSV!') 
      }
    } catch (err) { 
      showError('Erro ao exportar. O componente não conseguiu processar a planilha.') 
    }
  }

  async function handleLoadProducts() {
    setIsLoadingProducts(true)
    try { const data = await apiClient.getProducts ? await apiClient.getProducts() : []; setProducts(data || []) } 
    catch (err) { showError('Erro ao carregar catálogo de produtos') } 
    finally { setIsLoadingProducts(false) }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsImporting(true)
    try {
      const result = await apiClient.importProducts(file)
      if (result && result.success) { success(`Sucesso! ${result.imported} produtos na base.`); handleLoadProducts() } 
      else { showError('Erro ao processar a planilha.') }
    } catch (err) { showError('Falha de conexão com o servidor.') } 
    finally { setIsImporting(false) }
  }

  async function loadUsers() {
    setIsLoadingUsers(true)
    try { setUsersList(await apiClient.getUsers()) } catch (err) { showError('Erro ao carregar equipe') } finally { setIsLoadingUsers(false) }
  }
  async function handleApproveUser(id: string) { if (await apiClient.approveUser(id)) { success('Administrador aprovado!'); loadUsers() } else { showError('Erro ao aprovar.') } }
  async function handleRevokeUser(id: string, name: string) { if (!window.confirm(`ATENÇÃO: Revogar o acesso de ${name}?`)) return; if (await apiClient.revokeUser(id)) { warning(`Acesso revogado.`); loadUsers() } else { showError('Erro ao revogar.') } }

  const handleLogout = () => { logout(); navigate('/login') }

  if (!user || user.role !== 'admin') return null

  const filteredProducts = products.filter(p => { const term = productSearch.toLowerCase(); return ( (p.sku && p.sku.toLowerCase().includes(term)) || (p.ean && p.ean.toLowerCase().includes(term)) || (p.description && p.description.toLowerCase().includes(term)) ) })
  
  const totalGeralPedidos = orders.length
  const romaneioTotalExpedidos = dailyShipped.length
  const romaneioPercentage = totalGeralPedidos > 0 ? Math.round((romaneioTotalExpedidos / totalGeralPedidos) * 100) : 0
  
  const pendingUsers = usersList.filter(u => u.role === 'pending_admin' && u.status !== 'revoked')
  const activeUsers = usersList.filter(u => u.role !== 'pending_admin' && u.status !== 'revoked')

  const tabActiveStyle = "px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap border border-green-500 text-green-500 bg-green-500/10"
  const tabInactiveStyle = "px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap border border-gray-800 text-gray-400 bg-[#161925] hover:text-gray-200 hover:border-gray-700"

  const rawItems = selectedOrder?.items || []
  const subModalItems = itemsModalState?.type === 'pending' 
    ? rawItems.filter((i: any) => !i.isConfirmed || i.pendingReason) 
    : rawItems.filter((i: any) => i.phase === itemsModalState?.phase)

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-200 transition-colors font-sans selection:bg-blue-500/30 print:bg-white print:text-black print:min-h-0 print:h-auto overflow-x-hidden">
      {/* HEADER OCULTO NA IMPRESSÃO */}
      <header className="bg-[#0f111a] border-b border-gray-800 sticky top-0 z-20 print:hidden pt-4 pb-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white tracking-wide">LogTrack<span className="text-blue-500">.WMS</span></h1><div className="flex md:hidden gap-4 items-center"><ThemeToggle /><Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400">Sair</Button></div></div>
          <nav className="flex overflow-x-auto gap-3 pb-1 md:pb-0 scrollbar-hide w-full md:w-auto">
            <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? tabActiveStyle : tabInactiveStyle}><div className="w-4 h-4 rounded-sm border border-current grid grid-cols-2 gap-[1px] p-[1px]"><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div></div> Dashboard</button>
            <button onClick={() => setActiveTab('pedidos')} className={activeTab === 'pedidos' ? tabActiveStyle : tabInactiveStyle}><Package size={18}/> Pedidos</button>
            <button onClick={() => setActiveTab('produtos')} className={activeTab === 'produtos' ? tabActiveStyle : tabInactiveStyle}><BarChart2 size={18}/> Produtos</button>
            <button onClick={() => setActiveTab('romaneio')} className={activeTab === 'romaneio' ? tabActiveStyle : tabInactiveStyle}><FileText size={18}/> Expedição</button>
            <button onClick={() => setActiveTab('usuarios')} className={activeTab === 'usuarios' ? tabActiveStyle : tabInactiveStyle}><Users size={18}/> Equipe</button>
          </nav>
          <div className="hidden md:flex gap-4 items-center"><div className="text-sm text-gray-400">👤 {user.username || user.email}</div><ThemeToggle /><Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">Sair</Button></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:m-0 print:w-full">
        {activeTab === 'usuarios' && (
          <div className="animate-fade-in space-y-10 print:hidden">
            <div><h2 className="text-2xl font-bold text-white mb-1">Aprovações de Gestão</h2><p className="text-gray-500 text-sm mb-6">Novos cadastros aguardando liberação de acesso</p>{isLoadingUsers ? <div className="flex justify-center py-12"><Spinner /></div> : pendingUsers.length === 0 ? <div className="bg-[#141b23] border border-blue-900/30 rounded-xl p-6 text-center text-blue-400 flex flex-col items-center gap-2"><UserCheck size={32} /><span>Nenhum cadastro pendente no momento.</span></div> : (<div className="space-y-4">{pendingUsers.map(u => (<div key={u.id} className="bg-[#2a161b] border border-red-900/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h3 className="text-white font-bold text-lg flex items-center gap-2"><AlertTriangle size={18} className="text-red-400"/> {u.username}</h3><p className="text-sm text-red-300/80 mt-1">{u.email} • Solicitou acesso como Administrador</p></div><div className="flex items-center gap-3 w-full sm:w-auto"><Button variant="danger" size="md" className="flex-1 sm:flex-none" onClick={() => handleRevokeUser(u.id, u.username)}>Recusar</Button><Button variant="success" size="md" className="flex-1 sm:flex-none" onClick={() => handleApproveUser(u.id)}>✓ Aprovar Acesso</Button></div></div>))}</div>)}</div>
            <div><h2 className="text-2xl font-bold text-white mb-1">Equipe Ativa</h2><p className="text-gray-500 text-sm mb-6">Gestores e Operadores com acesso ao WMS</p><div className="space-y-3">{isLoadingUsers ? <div className="flex justify-center py-12"><Spinner /></div> : activeUsers.length === 0 ? <div className="text-center py-12 text-gray-500 bg-[#161925] rounded-xl border border-gray-800">Nenhum usuário ativo.</div> : (activeUsers.map(u => { const isAdmin = u.role === 'admin'; return (<div key={u.id} className="bg-[#161925] border border-gray-800 rounded-xl p-4 flex items-center justify-between transition-all hover:border-gray-600"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>{isAdmin ? <ShieldAlert size={20} /> : <Package size={20} />}</div><div><h3 className="text-white font-bold text-lg">{u.username} {user.email === u.email && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full ml-2">Você</span>}</h3><p className="text-sm text-gray-500 mt-0.5">{u.email}</p></div></div><div className="flex items-center gap-6"><Badge variant={isAdmin ? 'primary' : 'info'} size="md" className="hidden sm:flex">{isAdmin ? 'Administrador' : 'Operador'}</Badge>{user.email !== u.email && (<button onClick={() => handleRevokeUser(u.id, u.username)} className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"><UserX size={20} /></button>)}</div></div>)}))}</div></div>
          </div>
        )}

        {activeTab === 'produtos' && (
          <div className="animate-fade-in space-y-10 print:hidden">
            <div><h2 className="text-2xl font-bold text-white mb-4">Importar catálogo</h2><input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" /><div className="bg-[#161925] border border-gray-800 rounded-xl p-5 mb-8"><div className="grid grid-cols-2 gap-4 mb-4"><button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="border border-dashed border-green-500/50 hover:border-green-500 bg-green-500/5 hover:bg-green-500/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-green-500 transition-colors cursor-pointer group">{isImporting ? <Spinner /> : <FileSpreadsheet size={32} className="group-hover:scale-110 transition-transform" />}<span className="font-bold">Importar Excel</span></button><button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="border border-dashed border-blue-500/50 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-blue-500 transition-colors cursor-pointer group">{isImporting ? <Spinner /> : <Upload size={32} className="group-hover:scale-110 transition-transform" />}<span className="font-bold">Importar CSV</span></button></div><button onClick={handleLoadProducts} className="w-full border border-orange-500/50 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 rounded-xl p-4 flex items-center justify-center gap-3 text-orange-500 transition-colors font-bold group"><RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${isLoadingProducts ? 'animate-spin' : ''}`} /> Atualizar catálogo</button></div></div>
            <div><h2 className="text-2xl font-bold text-white mb-4">Catálogo de produtos</h2><div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} /><input type="text" placeholder="SKU, EAN, descrição..." className="w-full bg-[#161925] border border-gray-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} /></div><div className="text-sm text-gray-500 font-medium mb-3">{filteredProducts.length} produto(s) listado(s)</div><div className="space-y-3">{isLoadingProducts ? <div className="flex justify-center py-12"><Spinner /></div> : filteredProducts.length === 0 ? <div className="text-center py-12 text-gray-500 bg-[#161925] rounded-xl border border-gray-800">Nenhum produto.</div> : (filteredProducts.map(product => (<div key={product.id} className="bg-[#161925] border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-all">{product.photoUrl ? <img src={product.photoUrl} alt={product.description} className="w-16 h-16 object-contain rounded-lg bg-white p-1 flex-shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0"><Box size={24} /></div>}<div className="flex-1 overflow-hidden"><h3 className="text-white font-bold truncate">{product.description}</h3><div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-400 font-mono"><span>SKU: {product.sku}</span><span className="hidden sm:inline">•</span><span>EAN: {product.ean}</span></div></div></div>)))}</div></div>
          </div>
        )}

        {activeTab === 'romaneio' && (
          <div className="animate-fade-in space-y-10 print:space-y-0">
            {/* ÁREA DE EXPORTAÇÃO E BOTÕES - OCULTA NA IMPRESSÃO */}
            <div className="print:hidden">
              <h2 className="text-2xl font-bold text-white mb-4">Exportar relatório</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button onClick={() => handleExportRomaneio('excel')} className="bg-[#14231b] border border-green-900/40 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-green-400 hover:bg-[#1a2e24] transition-colors cursor-pointer group"><FileSpreadsheet size={32} className="group-hover:scale-110 transition-transform" /><span className="font-bold">Excel (XLSX)</span></button>
                <button onClick={() => handleExportRomaneio('csv')} className="bg-[#131b2f] border border-blue-900/40 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-blue-400 hover:bg-[#1a2541] transition-colors cursor-pointer group"><FileText size={32} className="group-hover:scale-110 transition-transform" /><span className="font-bold">CSV</span></button>
              </div>
              <button onClick={() => setTimeout(() => window.print(), 100)} className="w-full bg-[#2d1b2e] border border-pink-900/40 rounded-xl p-4 flex items-center justify-center gap-3 text-pink-400 hover:bg-[#3d253f] transition-colors font-bold"><Printer size={20} /> Imprimir relatório</button>
            </div>
            
            {/* CORPO DO RELATÓRIO - ESTILIZADO PARA TELA E PARA IMPRESSÃO */}
            <div className="bg-[#0f111a] print:bg-white print:text-black mt-8 print:mt-0">
              
              <div className="print:hidden flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative w-full sm:w-64">
                  <select value={romaneioCarrier} onChange={(e) => setRomaneioCarrier(e.target.value)} className="w-full bg-[#161925] border border-gray-700 text-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-sm cursor-pointer">
                    <option value="Todas">Transportadora (Todas)</option>
                    {carriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="relative w-full sm:w-48">
                  <input 
                    type="text" 
                    placeholder="Data (DD/MM/AAAA)"
                    maxLength={10}
                    value={romaneioDateMask}
                    onChange={handleRomaneioDateMaskChange}
                    className="w-full bg-[#161925] border border-gray-700 text-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-sm" 
                  />
                </div>
              </div>

              {/* TÍTULO NORMAL PARA TELA */}
              <div className="print:hidden">
                <h2 className="text-2xl font-bold text-white mb-1">Relatório de expedição</h2>
                <p className="text-gray-500 text-sm mb-6 capitalize">{displayDateFormatted}</p>
              </div>

              {/* TÍTULO E CAIXAS ESPECÍFICAS PARA IMPRESSÃO (ESTILO DO DESENHO) */}
              <div className="hidden print:block mb-8">
                <h2 className="text-3xl font-bold text-black mb-1">Lista de Romaneio</h2>
                <p className="text-gray-600 text-sm mb-6 capitalize">{displayDateFormatted}</p>
                
                <div className="flex gap-6">
                  {/* Bloco Transportadora */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6 flex items-center justify-center min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <Truck size={32} className={romaneioCarrier.toLowerCase().includes('correios') ? 'text-yellow-500' : 'text-blue-600'} />
                      <span className="text-2xl font-black text-gray-800 tracking-tight">
                        {romaneioCarrier === 'Todas' ? 'Geral' : romaneioCarrier}
                      </span>
                    </div>
                  </div>
                  {/* Bloco Total */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[200px]">
                    <span className="text-3xl font-black text-black">{romaneioTotalExpedidos}</span>
                    <span className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">Total pedidos do dia</span>
                  </div>
                </div>
              </div>
              
              {/* CAIXAS NORMAIS PARA A TELA */}
              <div className="grid grid-cols-3 gap-4 mb-8 print:hidden">
                <div className="bg-[#161925] border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-gray-300">{totalGeralPedidos}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Total pedidos do dia</div>
                </div>
                <div className="bg-[#161925] border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-green-400">{romaneioTotalExpedidos}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Expedidos na busca</div>
                </div>
                <div className="bg-[#161925] border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-blue-400">{romaneioPercentage}%</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">% Concluído</div>
                </div>
              </div>

              <h3 className="font-bold text-gray-300 print:text-gray-800 mb-3">Pedidos expedidos</h3>
              {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : dailyShipped.length === 0 ? <div className="text-center py-12 text-gray-500 bg-[#161925] print:bg-white rounded-xl border border-gray-800 print:border-dashed">Nenhuma expedição para estes filtros.</div> : (
                <div className="space-y-3 print:space-y-4">
                  {dailyShipped.map(log => (
                    <div key={log.id} className="bg-[#161925] print:bg-white print:border-gray-200 print:border-2 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 print:bg-transparent print:text-green-600 flex items-center justify-center text-green-500">
                          <Truck size={20} />
                        </div>
                        <div>
                          <h4 className="text-white print:text-black font-bold text-lg">{log.invoice_number}</h4>
                          <p className="text-sm text-gray-500 print:text-gray-600 mt-0.5">{log.operator_name} · Coletado</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 print:text-black print:font-bold font-medium">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* ASSINATURA EXCLUSIVA PARA IMPRESSÃO */}
              <div className="hidden print:block mt-24 pt-8 border-t border-dashed border-gray-300 text-center">
                <p className="font-bold text-black mb-12">Assinatura do Motorista / Transportadora</p>
                <div className="w-80 border-b border-black mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Data: ___ / ___ / _____</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-10 print:hidden">
            <div><h2 className="text-2xl font-bold text-white mb-1">KPIs do dia</h2><p className="text-gray-500 text-sm mb-6 capitalize">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</p>{isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : (<div className="grid grid-cols-2 gap-4"><div className="bg-[#1e2333] p-5 rounded-2xl border border-gray-800 flex flex-col justify-between"><div className="text-gray-400 flex items-center gap-2 font-medium mb-3"><Package size={18}/> Total de pedidos</div><div className="text-4xl font-black text-white">{orders.length}</div></div><div className="bg-[#2a161b] p-5 rounded-2xl border border-red-900/30 flex flex-col justify-between"><div className="text-red-400/90 flex items-center gap-2 font-medium mb-3"><Clock size={18}/> Falta embalar</div><div className="text-4xl font-black text-white">{stats?.totalToPack || 0}</div></div><div className="bg-[#131b2f] p-5 rounded-2xl border border-blue-900/30 flex flex-col justify-between"><div className="text-blue-400/90 flex items-center gap-2 font-medium mb-3"><CheckCircle size={18}/> Embalados</div><div className="text-4xl font-black text-white">{stats?.totalPacked || 0}</div></div><div className="bg-[#2a2216] p-5 rounded-2xl border border-yellow-900/30 flex flex-col justify-between"><div className="text-yellow-400/90 flex items-center gap-2 font-medium mb-3"><AlertTriangle size={18}/> Pendentes</div><div className="text-4xl font-black text-white">{stats?.totalPending || 0}</div></div><div className="col-span-2 bg-[#14231b] p-5 rounded-2xl border border-green-900/30 flex items-center justify-between"><div className="text-green-400/90 flex items-center gap-3 font-medium text-lg"><Truck size={24}/> Expedidos na Doca</div><div className="text-5xl font-black text-white">{stats?.totalShipped || 0}</div></div></div>)}</div>
            <div><h2 className="text-2xl font-bold text-white mb-1">Produtividade da equipe</h2><p className="text-gray-500 text-sm mb-6">Processado hoje</p>{isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : teamProductivity.length === 0 ? <div className="text-center py-12 text-gray-500 bg-[#161925] rounded-xl border border-gray-800">Nenhuma tarefa finalizada no sistema hoje.</div> : (<div className="space-y-4">{teamProductivity.map((member, index) => { const rank = index + 1; return ( <div key={member.name} className="bg-[#161925] border border-gray-800 p-5 rounded-2xl flex flex-col gap-4"><div className="flex justify-between items-center"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-[#1e2333] text-gray-400'}`}>{rank === 1 ? <Medal size={24}/> : `#${rank}`}</div><div><h3 className="text-white font-bold text-xl">{member.name}</h3><p className="text-sm text-gray-500">{member.total} pedidos processados no dia</p></div></div><div className="text-4xl font-black text-green-400">{member.total}</div></div><div className="grid grid-cols-2 gap-3"><div className="bg-[#1c223b] rounded-xl p-3 flex flex-col items-center justify-center border border-blue-900/30"><div className="text-2xl font-black text-blue-400">{member.embalados}</div><div className="text-xs text-gray-400 font-medium">Embalados</div></div><div className="bg-[#2d1b2e] rounded-xl p-3 flex flex-col items-center justify-center border border-pink-900/30"><div className="text-2xl font-black text-pink-400">{member.separados}</div><div className="text-xs text-gray-400 font-medium">Separados</div></div></div></div> ) })}</div>)}</div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="animate-fade-in space-y-6 print:hidden">
            <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} /><input type="text" placeholder="NF, pedido, funcionário..." className="w-full bg-[#161925] border border-gray-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} /></div><button onClick={() => setShowFilters(!showFilters)} className={`px-4 rounded-xl border transition-all flex items-center justify-center ${showFilters ? 'bg-[#1e2333] border-blue-500 text-blue-400' : 'bg-[#161925] border-gray-700 text-gray-400 hover:border-gray-500'}`}><Filter size={20} /></button></div>
            {showFilters && (
              <div className="bg-[#161925] border border-gray-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#0f111a] border border-gray-700 text-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-sm">
                    <option>Todos</option><option>Pendente</option><option>Embalado</option><option>Expedido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Funcionário</label>
                  <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="w-full bg-[#0f111a] border border-gray-700 text-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-sm">
                    <option value="Todos">Todos</option>
                    {usersList.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Transportadora</label>
                  <select value={filterCarrier} onChange={(e) => setFilterCarrier(e.target.value)} className="w-full bg-[#0f111a] border border-gray-700 text-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-sm">
                    <option value="Todas">Todas</option>
                    {carriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Data</label>
                  <input 
                    type="text" 
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={dateInputMask}
                    onChange={handleDateMaskChange}
                    className="w-full bg-[#0f111a] border border-gray-700 text-gray-300 rounded-lg p-2.5 focus:border-blue-500 outline-none text-sm" 
                  />
                </div>
              </div>
            )}
            <div className="text-sm text-gray-500 font-medium">{filteredOrders.length} pedido(s) encontrado(s)</div>
            <div className="space-y-3">{isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : filteredOrders.length === 0 ? <div className="text-center py-12 text-gray-500 bg-[#161925] rounded-xl border border-gray-800">Nenhum pedido encontrado. Tente ajustar os filtros.</div> : (filteredOrders.map(order => { const invoiceStr = order.invoice_number || order.invoiceNumber || ''; const dateVal = order.created_at || order.createdAt; const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('pt-BR') : ''; return ( <div key={order.id} onClick={() => openOrderTimeline(order)} className="bg-[#161925] border border-gray-800 hover:border-gray-600 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-[#1a1d2d] group"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-800/50`}><div className={`w-3 h-3 rounded-full ${order.status === 'shipped' ? 'bg-green-500' : order.status === 'pending' ? 'bg-yellow-500' : order.status === 'packed' ? 'bg-blue-500' : 'bg-gray-400'}`}></div></div><div><h3 className="text-white font-bold text-lg">NF: {invoiceStr}</h3><p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">📅 {dateStr}</p></div></div><div className="flex items-center gap-4"><Badge variant={getStatusColor(order.status)} size="md" className="bg-opacity-10 border border-current">{getStatusLabel(order.status)}</Badge><ChevronRight className="text-gray-600 group-hover:text-gray-400 transition-colors" size={20} /></div></div> ) }))}</div>
          </div>
        )}
      </main>

      <Modal isOpen={!!selectedOrder && !itemsModalState} onClose={() => setSelectedOrder(null)} title={`Rastreio - NF: ${selectedOrder?.invoice_number || selectedOrder?.invoiceNumber}`} size="lg">
        <div className="p-2 overflow-y-auto max-h-[70vh] pr-2">
          {isLoadingTimeline ? ( <div className="flex justify-center py-12"><Spinner /></div> ) : orderTimeline.length === 0 ? ( <p className="text-center text-gray-500 py-8">Nenhum histórico registrado.</p> ) : (
            <div className="relative border-l-2 border-gray-700 ml-4 space-y-8 py-2">
              {orderTimeline.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <span className="absolute -left-[17px] bg-[#161925] border-2 border-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                    {getActionIcon(log.action)}
                  </span>
                  <div className="bg-[#161925] border border-gray-800 rounded-xl p-4 shadow-sm">
                    <h3 className={`font-bold text-base ${
                      log.action.includes('Pendente') ? 'text-yellow-400' : 
                      log.action.includes('Pulada') ? 'text-orange-400' : 
                      'text-gray-100'
                    }`}>
                      {log.action}
                    </h3>
                    
                    {log.action.includes('Pendente') && (
                      <button onClick={() => setItemsModalState({ type: 'pending' })} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mt-2 mb-1 cursor-pointer">
                        <Eye size={16} /> Ver Pendência
                      </button>
                    )}
                    {(log.action.includes('Separação')) && (
                      <button onClick={() => setItemsModalState({ type: 'all', phase: 'picking' })} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mt-2 mb-1 cursor-pointer">
                        <Eye size={16} /> Produtos
                      </button>
                    )}
                    {(log.action.includes('Embalagem')) && (
                      <button onClick={() => setItemsModalState({ type: 'all', phase: 'packing' })} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mt-2 mb-1 cursor-pointer">
                        <Eye size={16} /> Produtos
                      </button>
                    )}

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800/50 text-xs text-gray-500">
                      <span className="flex items-center gap-1">👤 {log.operator_name || 'Sistema'}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={!!itemsModalState} 
        onClose={() => setItemsModalState(null)} 
        title={itemsModalState?.type === 'pending' ? 'Item(s) pendente(s)' : 'Item(s) do pedido'} 
        size="md"
      >
        <div className="p-2 space-y-3">
          {subModalItems.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Nenhum produto listado no banco de dados para este pedido.</p>
          ) : (
            subModalItems.map((item: any, i: number) => (
              <div key={i} className="bg-[#1a1d2d] border border-gray-700 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-white font-bold text-[15px] mb-1">
                      {item.product?.description || item.description || 'Produto não identificado'}
                    </h4>
                    <div className="text-sm text-gray-400 font-mono flex items-center flex-wrap gap-2">
                      <span>SKU: {item.product?.sku || item.sku || 'N/A'}</span>
                      <span>•</span>
                      <span>Qtd: {item.quantity || 1}x</span>
                      
                      {itemsModalState?.type === 'pending' && (
                        <Badge variant="info" size="sm" className="ml-1 bg-blue-900/50 text-blue-300 border-none">
                          {item.phase === 'packing' ? 'Embalagem' : 'Separação'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {itemsModalState?.type === 'pending' && (item.pendingReason || !item.isConfirmed) && (
                  <div className="mt-3 text-yellow-500 font-bold text-sm tracking-wide">
                    Motivo: {item.pendingReason || 'Avaria/Falta reportada'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>

    </div>
  )
}