'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createUserProfile } from '@/app/actions/auth-actions'
import Link from 'next/link'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleCadastro() {
    setLoading(true)
    setError('')
    if (!nome || !email || !password) {
      setError('Preencha todos os campos.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } }
    })
    if (error) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }
    if (data.user) {
      await createUserProfile(data.user.id, nome, 'student')
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
            <p className="text-gray-400 mb-6">
              Verifique seu email <strong className="text-white">{email}</strong> para ativar a conta.
            </p>
            <Link href="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition-colors text-center">
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">NexoCollege</h1>
          <p className="text-gray-400 mt-2">Crie sua conta gratuitamente</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-6 text-sm">{error}</div>
          )}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome completo</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleCadastro()} />
            </div>
            <button onClick={handleCadastro} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Já tem conta?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
