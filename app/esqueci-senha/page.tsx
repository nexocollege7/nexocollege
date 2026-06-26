'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleEnviar() {
    setLoading(true)
    setError('')

    if (!email.trim()) {
      setError('Informe seu e-mail.')
      setLoading(false)
      return
    }

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://nexocollege.com.br/redefinir-senha',
    })

    if (supabaseError) {
      setError('Não foi possível enviar o link. Verifique o e-mail e tente novamente.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#1A2E00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
            }}
          >
            🔑
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 8px' }}>
            Recuperar senha
          </h1>
          <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '16px',
            padding: '36px',
            border: '1px solid #2A2A2A',
          }}
        >
          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#1A2E00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '22px',
                }}
              >
                ✓
              </div>
              <p style={{ color: '#AEEA00', fontWeight: '700', fontSize: '16px', margin: '0 0 8px' }}>
                Link enviado!
              </p>
              <p style={{ color: '#888888', fontSize: '14px', margin: '0 0 24px' }}>
                Enviamos um link para seu e-mail. Verifique também a caixa de spam.
              </p>
              <Link
                href="/login"
                style={{
                  color: '#AEEA00',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#CCCCCC',
                    marginBottom: '8px',
                  }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                  placeholder="seu@email.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#111111',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={handleEnviar}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#555555' : '#AEEA00',
                  color: '#0D0D0D',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link
                  href="/login"
                  style={{ color: '#555555', fontSize: '13px', textDecoration: 'none' }}
                >
                  ← Voltar para o login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
