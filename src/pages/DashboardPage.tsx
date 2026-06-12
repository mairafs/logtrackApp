import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Package, Search, Truck } from 'lucide-react' // Adicionados os ícones para os botões

// Importações utilizando os aliases definidos no tsconfig.json (@)
import { useAuth } from '@/hooks/index'
import { apiClient } from '@/services/api'
import { Spinner } from '@/components/UI'
import { ThemeToggle } from '@/components/ThemeToggle'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    packedByUser: 0, 
    leftToPack: 0,
    pending: 0,
    packed: 0,
    shipped: 0
  })

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dailyStats = await apiClient.getDailyStats()
        
        if (dailyStats) {
          setStats({
            packedByUser: dailyStats.packedByUser || 0,
            leftToPack: dailyStats.totalToPack || 0,
            pending: dailyStats.totalPending || 0,
            packed: dailyStats.totalPacked || 0,
            shipped: dailyStats.totalShipped || 0
          })
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas do dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#13131A] flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13131A] text-gray-900 dark:text-white p-6 font-sans transition-colors duration-200">
      
      <header className="mb-8 mt-4 flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Olá, {user?.username ? user.username.split(' ')[0] : 'Operador'}!
        </h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            Sair <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-gray-700 dark:text-gray-300 font-medium">Resumo do dia</h2>
          <span className="text-sm text-gray-500">{today}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1C2623] border border-green-200 dark:border-green-900/30 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-sm">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Embalados por você</span>
            </div>
            <div className="text-4xl font-black text-gray-900 dark:text-white">{stats.packedByUser}</div>
          </div>

          <div className="bg-white dark:bg-[#2D211A] border border-orange-200 dark:border-orange-900/30 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Faltam embalar</span>
            </div>
            <div className="text-4xl font-black text-gray-900 dark:text-white">{stats.leftToPack}</div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-gray-700 dark:text-gray-300 font-medium mb-4">Escolha sua função</h2>
        <div className="space-y-4">
          {/* Botões atualizados com flex justify-center, ícones e cores solicitadas */}
          <button onClick={() => navigate('/packing')} className="w-full bg-orange-500 text-white rounded-2xl p-5 flex items-center justify-center gap-3 hover:bg-orange-600 shadow-md transition-colors">
            <Package size={26} />
            <div className="font-extrabold text-xl uppercase">Embalar Pedido</div>
          </button>
          
          <button onClick={() => navigate('/picking')} className="w-full bg-blue-600 text-white rounded-2xl p-5 flex items-center justify-center gap-3 hover:bg-blue-700 shadow-md transition-colors">
            <Search size={26} />
            <div className="font-extrabold text-xl uppercase">Separar Pedido</div>
          </button>
          
          <button onClick={() => navigate('/shipping')} className="w-full bg-green-600 text-white rounded-2xl p-5 flex items-center justify-center gap-3 hover:bg-green-700 shadow-md transition-colors">
            <Truck size={26} />
            <div className="font-extrabold text-xl uppercase">Expedição</div>
          </button>
        </div>
      </section>
    </div>
  )
}