'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const msg = searchParams.get('msg')
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

    if (profile.isMaster) {
      router.push('/master')
    } else if (profile.role === 'collaborator') {
      window.location.href = '/dashboard?t=' + Date.now()
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
      window.location.href = '/dashboard?t=' + Date.now()
    } else {
      window.location.href = '/dashboard?t=' + Date.now()
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
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

          {msg === 'escola-excluida' && (
            <div style={{ backgroundColor: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#FFAA00', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
              Sua escola foi encerrada e seu acesso foi removido.
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <button
              onClick={handleGoogleLogin}
              type="button"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB',
                borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', fontSize: '15px',
                fontWeight: '600', color: '#1A1A1A', fontFamily: 'inherit',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#2A2A2A' }} />
              <span style={{ color: '#555555', fontSize: '13px' }}>ou</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#2A2A2A' }} />
            </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
