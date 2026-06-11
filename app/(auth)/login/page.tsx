'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/me')
    const profile = await res.json()

    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL
    if (data.user?.email === masterEmail) {
      router.push('/master')
    } else if (profile.role === 'student') {
      // Busca o slug da escola do aluno
      if (profile.school_id) {
        const { data: school } = await supabase
          .from('schools')
          .select('slug')
          .eq('id', profile.school_id)
          .single()
        if (school?.slug) {
          router.push(`/vitrine/${school.slug}`)
          router.refresh()
          return
        }
      }
      router.push('/dashboard/meus-cursos')
    } else {
      router.push('/dashboard')
    }

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">NexoCollege</h1>
          <p className="text-gray-400 mt-2">Entre na sua conta</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-6 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Não tem conta?{' '}
              <Link href="/cadastro" className="text-blue-400 hover:text-blue-300 font-medium">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
