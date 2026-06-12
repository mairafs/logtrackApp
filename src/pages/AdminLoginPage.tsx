import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, Alert, Spinner } from '@components/UI'
import { useAuth } from '@hooks/index'
import { apiClient } from '@services/api'
import { ThemeToggle } from '@components/ThemeToggle'
import { ShieldAlert, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react'

type ViewState = 'login' | 'register' | 'forgot'

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [view, setView] = useState<ViewState>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [username, setUsername] = useState('') // Corrigido para username
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const clearMessages = () => { setError(null); setSuccessMsg(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)

    try {
      if (view === 'login') {
        if (!email || !password) throw new Error('Preencha e-mail e senha.')
        
        // CORREÇÃO: Estrutura correta enviada para o Backend, e chamada do Zustand alinhada
        const response = await apiClient.login({ username: email, password, role: 'admin' })
        
        if (response.user && response.token) {
          login(response.user, response.token)
          navigate('/admin')
        } else {
          throw new Error(response.message || 'Erro de autenticação')
        }
      } 
      
      else if (view === 'register') {
        if (!username || !email || !password) throw new Error('Preencha todos os campos.')
        if (password !== confirmPassword) throw new Error('As senhas não coincidem.')
        
        await apiClient.register({ username, email, password, role: 'admin' })
        setSuccessMsg('Cadastro enviado! Um administrador precisa aprovar o seu acesso.')
        setView('login')
        setPassword('')
        setConfirmPassword('')
      } 
      
      else if (view === 'forgot') {
        if (!email) throw new Error('Informe seu e-mail cadastrado.')
        await apiClient.recoverPassword(email)
        setSuccessMsg('Instruções de recuperação enviadas para o seu e-mail.')
        setView('login')
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na operação.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f111a] flex flex-col items-center justify-center p-4 selection:bg-purple-500/30">
      <div className="absolute top-6 right-6"><ThemeToggle /></div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-purple-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <ShieldAlert size={40} className="text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Gestão<span className="text-purple-500">.WMS</span></h1>
          <p className="text-gray-400 mt-2">Acesso Administrativo</p>
        </div>

        <Card className="bg-[#161925] border-gray-800 shadow-2xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>

          {error && <Alert type="error" className="mb-6" onClose={() => setError(null)}>{error}</Alert>}
          {successMsg && <Alert type="success" className="mb-6" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <Input icon={<UserIcon size={18}/>} placeholder="Nome completo" value={username} onChange={e => setUsername(e.target.value)} disabled={isLoading} className="bg-[#0f111a] border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500" />
            )}

            <Input type="email" icon={<Mail size={18}/>} placeholder="E-mail corporativo" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="bg-[#0f111a] border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500" />

            {view !== 'forgot' && (
              <Input type="password" icon={<Lock size={18}/>} placeholder="Senha de acesso" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="bg-[#0f111a] border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500" />
            )}
            
            {view === 'register' && (
              <Input type="password" icon={<Lock size={18}/>} placeholder="Confirme sua senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} className="bg-[#0f111a] border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500" />
            )}

            <Button type="submit" size="lg" isFullWidth className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white mt-2" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" color="text-white" /> : view === 'login' ? 'Autenticar' : view === 'register' ? 'Solicitar Acesso Admin' : 'Recuperar Acesso'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm">
            {view === 'login' && (
              <>
                <button type="button" onClick={() => { setView('forgot'); clearMessages() }} className="text-gray-400 hover:text-purple-400 transition-colors">Esqueceu sua senha?</button>
                <div className="w-full border-t border-gray-800 my-2"></div>
                <button type="button" onClick={() => { setView('register'); clearMessages() }} className="text-gray-300 hover:text-white transition-colors">Novo gestor? <span className="text-purple-500 font-bold">Cadastre-se</span></button>
              </>
            )}
            {view !== 'login' && (
              <button type="button" onClick={() => { setView('login'); clearMessages() }} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                ← Voltar para a Autenticação
              </button>
            )}
          </div>
        </Card>

        <button onClick={() => navigate('/login')} className="w-full bg-[#161925] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl p-4 flex items-center justify-center gap-3 transition-all group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar para Login de Operador
        </button>
      </div>
    </div>
  )
}