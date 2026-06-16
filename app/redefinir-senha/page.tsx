'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RedefinirSenhaContent() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // O Supabase troca o token da URL por uma sessão automaticamente ao carregar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessaoAtiva(true)
      }
      setVerificando(false)
    })

    // Verificar se já há sessão ativa (caso o token já tenha sido processado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessaoAtiva(true)
      setVerificando(false)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRedefinir() {
    setErro('')

    if (!novaSenha || !confirmar) {
      setErro('Preencha os dois campos.')
      return
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: novaSenha })

    if (error) {
      setErro('Não foi possível redefinir a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    setSucesso(true)

    // Redirecionar após sucesso
    const { data: { user } } = await supabase.auth.getUser()
    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL
    setTimeout(() => {
      if (user?.email === masterEmail) {
        router.push('/master')
      } else {
        router.push('/dashboard')
      }
    }, 2000)
  }

  if (verificando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0D0D0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#888888' }}>Verificando link...</p>
      </div>
    )
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
              backgroundColor: '#1A1040',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
            }}
          >
            🔐
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 8px' }}>
            Nova senha
          </h1>
          <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
            Escolha uma senha segura para sua conta.
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
          {sucesso ? (
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
                Senha redefinida!
              </p>
              <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
                Redirecionando para o painel...
              </p>
            </div>
          ) : !sessaoAtiva ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#FF5555', fontSize: '15px', margin: '0 0 20px' }}>
                Link inválido ou expirado.
              </p>
              <Link
                href="/esqueci-senha"
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#AEEA00',
                  color: '#0D0D0D',
                  fontWeight: '700',
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {erro && (
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
                  {erro}
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
                  Nova senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRedefinir()}
                  placeholder="Repita a nova senha"
                  style={{
                    width: '100%',
                    backgroundColor: '#111111',
                    border: `1px solid ${confirmar && confirmar !== novaSenha ? '#FF5555' : '#333333'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {confirmar && confirmar !== novaSenha && (
                  <p style={{ color: '#FF5555', fontSize: '12px', marginTop: '6px' }}>
                    As senhas não coincidem.
                  </p>
                )}
              </div>

              <button
                onClick={handleRedefinir}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#555555' : '#7C4DFF',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaContent />
    </Suspense>
  )
}
