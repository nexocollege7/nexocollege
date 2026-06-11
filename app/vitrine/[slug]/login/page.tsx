'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSchoolBySlug } from '@/app/actions/vitrine-actions'
import { useEffect } from 'react'

export default function LoginEscolaPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const supabase = createClient()

  const [school, setSchool] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchool, setLoadingSchool] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getSchoolBySlug(slug)
      setSchool(data)
      setLoadingSchool(false)
    }
    load()
  }, [slug])

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard/meus-cursos')
    router.refresh()
  }

  if (loadingSchool) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888888' }}>Carregando...</p>
      </div>
    )
  }

  const cor = school?.primary_color || '#AEEA00'
  const nome = school?.name || 'NexoCollege'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo da escola */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            backgroundColor: cor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            fontSize: '28px', fontWeight: '800', color: '#0D0D0D',
          }}>
            {nome.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 4px' }}>
            {nome}
          </h1>
          <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
            Entre na sua conta para acessar os cursos
          </p>
        </div>

        {/* Card de login */}
        <div style={{
          backgroundColor: '#1A1A1A', borderRadius: '16px',
          padding: '32px', border: '1px solid #2A2A2A',
        }}>

          {error && (
            <div style={{
              backgroundColor: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)',
              color: '#FF5555', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '8px',
                  border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
                  color: '#F0F0F0', fontSize: '14px', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '8px',
                  border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
                  color: '#F0F0F0', fontSize: '14px', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: 'none', backgroundColor: cor, color: '#0D0D0D',
                fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 8px' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: cor, fontWeight: '600', textDecoration: 'none' }}>
                Criar conta gratuita
              </Link>
            </p>
            <Link href={`/vitrine/${slug}`} style={{ color: '#555555', fontSize: '12px', textDecoration: 'none' }}>
              ← Voltar para a vitrine
            </Link>
          </div>
        </div>

        <p style={{ color: '#333333', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
          Powered by <span style={{ color: '#555555' }}>NexoCollege</span>
        </p>
      </div>
    </div>
  )
}
