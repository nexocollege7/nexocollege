'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCadastro() {
    setLoading(true)
    setError('')

    if (!nome || !email || !password || !nomeEscola) {
      setError('Preencha todos os campos.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    // 1. Criar usuário + escola via API
    const res = await fetch('/api/register-school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password, nomeEscola }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // 2. Fazer login automático após cadastro
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Conta criada! Mas houve um erro ao entrar. Faça login manualmente.')
      setLoading(false)
      return
    }

    // 3. Redirecionar para o painel da escola
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
            Nexo<span style={{ color: '#AEEA00' }}>College</span>
          </h1>
          <p style={{ color: '#888888', marginTop: '8px', fontSize: '15px' }}>
            Crie sua escola online gratuitamente
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '16px',
          padding: '36px',
          border: '1px solid #2A2A2A',
        }}>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Nome completo */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                style={{
                  width: '100%', backgroundColor: '#111111', border: '1px solid #333333',
                  borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF',
                  fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%', backgroundColor: '#111111', border: '1px solid #333333',
                  borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF',
                  fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Senha */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%', backgroundColor: '#111111', border: '1px solid #333333',
                  borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF',
                  fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Divisor */}
            <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '4px' }}>
              <p style={{ fontSize: '12px', color: '#666666', margin: '0 0 16px 0' }}>
                DADOS DA SUA ESCOLA
              </p>

              {/* Nome da escola */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>
                  Nome da sua escola
                </label>
                <input
                  type="text"
                  value={nomeEscola}
                  onChange={(e) => setNomeEscola(e.target.value)}
                  placeholder="Ex: Academia Bíblica Online"
                  onKeyDown={(e) => e.key === 'Enter' && handleCadastro()}
                  style={{
                    width: '100%', backgroundColor: '#111111', border: '1px solid #7C4DFF',
                    borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#666666', marginTop: '6px' }}>
                  Este será o nome da sua plataforma para os alunos.
                </p>
              </div>
            </div>

            {/* Botão */}
            <button
              onClick={handleCadastro}
              disabled={loading}
              style={{
                width: '100%', backgroundColor: loading ? '#555555' : '#AEEA00',
                color: '#0D0D0D', fontWeight: '700', fontSize: '15px',
                border: 'none', borderRadius: '8px', padding: '14px',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
              }}
            >
              {loading ? 'Criando sua escola...' : 'Criar minha escola grátis →'}
            </button>

          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#666666', fontSize: '14px' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: '#AEEA00', fontWeight: '600', textDecoration: 'none' }}>
                Entrar
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
