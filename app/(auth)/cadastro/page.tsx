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
  const [termosAceitos, setTermosAceitos] = useState(false)
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

    if (!termosAceitos) {
      setError('Voce precisa aceitar os termos de uso para continuar.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/register-school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password, nomeEscola, termosAceitos }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Conta criada! Faca login manualmente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
            Nexo<span style={{ color: '#AEEA00' }}>College</span>
          </h1>
          <p style={{ color: '#888888', marginTop: '8px', fontSize: '15px' }}>
            Crie sua escola online gratuitamente
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Nome completo</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome"
                style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres"
                style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '4px' }}>
              <p style={{ fontSize: '12px', color: '#666666', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DADOS DA SUA ESCOLA</p>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Nome da sua escola</label>
                <input type="text" value={nomeEscola} onChange={(e) => setNomeEscola(e.target.value)} placeholder="Ex: Academia Biblica Online"
                  style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #7C4DFF', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '12px', color: '#666666', marginTop: '6px' }}>Este sera o nome da sua plataforma para os alunos.</p>
              </div>
            </div>

            {/* Termos */}
            <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '16px' }}>
              <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>
                Ao criar sua escola no NexoCollege voce concorda com os nossos termos de uso e politica de privacidade. Seus dados sao protegidos conforme a LGPD (Lei 13.709/2018).
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={termosAceitos}
                  onChange={(e) => setTermosAceitos(e.target.checked)}
                  style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#AEEA00', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.5' }}>
                  Li e aceito os <span style={{ color: '#AEEA00' }}>termos de uso</span> e a <span style={{ color: '#AEEA00' }}>politica de privacidade</span> do NexoCollege.
                </span>
              </label>
            </div>

            <button onClick={handleCadastro} disabled={loading || !termosAceitos}
              style={{
                width: '100%',
                backgroundColor: loading || !termosAceitos ? '#333333' : '#AEEA00',
                color: loading || !termosAceitos ? '#666666' : '#0D0D0D',
                fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '8px',
                padding: '14px', cursor: loading || !termosAceitos ? 'not-allowed' : 'pointer', marginTop: '4px',
              }}
            >
              {loading ? 'Criando sua escola...' : 'Criar minha escola gratis'}
            </button>

          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#666666', fontSize: '14px' }}>
              Ja tem conta?{' '}
              <Link href="/login" style={{ color: '#AEEA00', fontWeight: '600', textDecoration: 'none' }}>Entrar</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
