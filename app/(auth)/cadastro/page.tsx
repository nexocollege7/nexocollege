'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getActiveDocuments, recordAcceptances } from '@/app/actions/legal-actions'
import type { LegalDocument } from '@/app/actions/legal-actions'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const BLOCKED_DOMAINS = ['teste.com', 'test.com', 'example.com', 'foo.com', 'bar.com']
function isEmailValido(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false
  const domain = email.split('@')[1].toLowerCase()
  return !BLOCKED_DOMAINS.includes(domain)
}

function Modal({ titulo, conteudo, onFechar }: { titulo: string; conteudo: string; onFechar: () => void }) {
  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2A2A2A',
          width: '100%', maxWidth: '640px', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          margin: '0 8px',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #2A2A2A',
        }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>{titulo}</h2>
          <button
            onClick={onFechar}
            style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}
          >✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          <pre style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            {conteudo}
          </pre>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', textAlign: 'right' }}>
          <button
            onClick={onFechar}
            style={{ backgroundColor: '#AEEA00', color: '#0D0D0D', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            Entendi e fechar
          </button>
        </div>
      </div>
    </div>
  )
}

const DOC_ICONS: Record<string, string> = {
  terms_of_use: '📄',
  privacy_policy: '🔒',
  cookie_policy: '🍪',
}

function CadastroContent() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [password, setPassword] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [docs, setDocs] = useState<LegalDocument[]>([])
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [modalDoc, setModalDoc] = useState<LegalDocument | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const planoParam = searchParams.get('plano')
  const supabase = createClient()

  useEffect(() => {
    getActiveDocuments('school').then((d) => {
      setDocs(d)
      const init: Record<string, boolean> = {}
      d.forEach(doc => { init[doc.id] = false })
      setAccepted(init)
    })
  }, [])

  const todosAceitos = docs.length > 0 && docs.every(doc => accepted[doc.id])

  async function handleCadastro() {
    setLoading(true)
    setError('')
    setEmailError('')

    if (!nome || !email || !password || !nomeEscola) {
      setError('Preencha todos os campos.')
      setLoading(false)
      return
    }

    if (!isEmailValido(email)) {
      setEmailError('Por favor, informe um e-mail válido.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    if (!todosAceitos) {
      setError('Você precisa aceitar todos os documentos para continuar.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/register-school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password, nomeEscola, termosAceitos: true }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Conta criada! Faça login manualmente.')
      setLoading(false)
      return
    }

    // Registrar aceites LGPD
    await recordAcceptances(docs.map(d => d.id))

    // Se veio com plano pago, ir para checkout
    const planosPagos = ['creator', 'pro', 'scale']
    if (planoParam && planosPagos.includes(planoParam)) {
      try {
        const res = await fetch('/api/criar-preferencia-upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plano: planoParam }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
      } catch {
        // Se falhar o checkout, vai para o dashboard normalmente
      }
    }

    router.push('/dashboard')
  }

  return (
    <>
      {modalDoc && (
        <Modal titulo={modalDoc.title} conteudo={modalDoc.content} onFechar={() => setModalDoc(null)} />
      )}

      <div style={{
        minHeight: '100vh', backgroundColor: '#0D0D0D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Image src="/logo.png" alt="NexoCollege" width={140} height={48} priority style={{ height: '48px', width: 'auto', mixBlendMode: 'lighten' as any, display: 'inline-block', marginBottom: '12px' }} />
            <p style={{ color: '#888888', fontSize: '15px', margin: 0 }}>
              Crie sua escola online gratuitamente
            </p>
          </div>

          <style>{`
            @media (max-width: 480px) {
              .cadastro-card { padding: 24px 16px !important; }
            }
          `}</style>
          <div className="cadastro-card" style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '36px', border: '1px solid #2A2A2A' }}>

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
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError('') }} placeholder="seu@email.com"
                  style={{ width: '100%', backgroundColor: '#111111', border: `1px solid ${emailError ? '#f87171' : '#333333'}`, borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                {emailError && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{emailError}</p>
                )}
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

              {/* Aceite LGPD — 3 checkboxes separados */}
              <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '16px' }}>
                <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 14px', lineHeight: '1.6' }}>
                  Seus dados são protegidos conforme a LGPD (Lei 13.709/2018). Leia e aceite cada documento abaixo:
                </p>

                {docs.length === 0 ? (
                  <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>Carregando documentos...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {docs.map((doc) => (
                      <label
                        key={doc.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={accepted[doc.id] ?? false}
                          onChange={(e) => setAccepted(prev => ({ ...prev, [doc.id]: e.target.checked }))}
                          style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#AEEA00', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.5' }}>
                          {DOC_ICONS[doc.type] ?? '📄'}{' '}
                          Li e aceito a{' '}
                          <span
                            onClick={(e) => { e.preventDefault(); setModalDoc(doc) }}
                            style={{ color: '#AEEA00', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {doc.title}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleCadastro} disabled={loading || !todosAceitos}
                style={{
                  width: '100%',
                  backgroundColor: loading || !todosAceitos ? '#333333' : '#AEEA00',
                  color: loading || !todosAceitos ? '#666666' : '#0D0D0D',
                  fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '8px',
                  padding: '14px', cursor: loading || !todosAceitos ? 'not-allowed' : 'pointer', marginTop: '4px',
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
    </>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroContent />
    </Suspense>
  )
}
