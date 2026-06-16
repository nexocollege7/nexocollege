'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    } else if (profile.role === 'collaborator') {
      router.push('/dashboard')
    } else if (profile.role === 'student') {
      if (profile.school_id) {
        const { data: school } = await supabase
          .from('schools')
          .select('slug')
          .eq('id', profile.school_id)
          .single()
        if (school?.slug) {
          router.push('/vitrine/' + school.slug)
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
    <div style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Inter, sans-serif', fontSize: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Image src="/logo.png" alt="NexoCollege" width={140} height={48} priority style={{ height: '48px', width: 'auto', mixBlendMode: 'lighten' as any, display: 'inline-block', marginBottom: '12px' }} />
          <p style={{ color: '#888888', fontSize: '15px', margin: 0 }}>
            Entre na sua conta
          </p>
        </div>

        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '36px', border: '1px solid #2A2A2A' }}>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: "14px", outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: "14px", outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', backgroundColor: loading ? '#555555' : '#AEEA00',
                color: '#0D0D0D', fontWeight: '700', fontSize: '15px',
                border: 'none', borderRadius: '8px', padding: '14px',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/esqueci-senha" style={{ color: '#555555', fontSize: '13px', textDecoration: 'none' }}>
              Esqueceu sua senha?
            </Link>
            <p style={{ color: '#666666', fontSize: '14px', margin: 0 }}>
              Nao tem conta?{' '}
              <Link href="/cadastro" style={{ color: '#AEEA00', fontWeight: '600', textDecoration: 'none' }}>
                Criar escola gratis
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
