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
  const [slugPreview, setSlugPreview] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugSugestoes, setSlugSugestoes] = useState<string[]>([])
  const [slugCustom, setSlugCustom] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function gerarSlugLocal(nome: string): string {
    const palavras = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
    let slug = ''
    for (const palavra of palavras) {
      if ((slug + palavra).length > 20) break
      slug += palavra
    }
    return slug || palavras[0]?.slice(0, 20) || ''
  }

  async function verificarSlug() {
    if (!nomeEscola.trim()) return
    setSlugStatus('checking')
    setSlugSugestoes([])
    try {
      const res = await fetch('/api/verificar-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeEscola: slugCustom || nomeEscola }),
      })
      const data = await res.json()
      if (data.disponivel) {
        setSlugStatus('available')
        setSlugPreview(data.slug)
      } else {
        setSlugStatus('taken')
        setSlugSugestoes(data.sugestoes || [])
      }
    } catch {
      setSlugStatus('idle')
    }
  }

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

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.')
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
      body: JSON.stringify({ nome, email, password, nomeEscola, termosAceitos: true, slug: slugCustom || undefined }),
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
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                    style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 44px 12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888888', fontSize: '16px', padding: '0' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Confirmar senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha"
                    style={{ width: '100%', backgroundColor: '#111111', border: `1px solid ${confirmPassword && confirmPassword !== password ? '#FF5555' : '#333333'}`, borderRadius: '8px', padding: '12px 44px 12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888888', fontSize: '16px', padding: '0' }}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ color: '#FF5555', fontSize: '12px', marginTop: '6px' }}>As senhas não coincidem.</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '4px' }}>
                <p style={{ fontSize: '12px', color: '#666666', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DADOS DA SUA ESCOLA</p>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>
                    Nome da sua escola
                  </label>
                  <input
                    type="text"
                    value={nomeEscola}
                    onChange={(e) => {
                      setNomeEscola(e.target.value)
                      setSlugPreview(gerarSlugLocal(e.target.value))
                      setSlugStatus('idle')
                      setSlugCustom('')
                      setSlugSugestoes([])
                    }}
                    placeholder="Ex: Academia Biblica Online"
                    style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #7C4DFF', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const }}
                  />

                  {/* Alerta de subdomínio permanente */}
                  <div style={{ marginTop: '10px', backgroundColor: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                    <p style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700', margin: '0 0 4px' }}>
                      ⚠️ Atenção: este nome se tornará seu endereço permanente
                    </p>
                    {slugPreview ? (
                      <p style={{ color: '#CCCCCC', fontSize: '12px', margin: '0 0 4px', fontFamily: 'monospace' }}>
                        🌐 {slugPreview}.nexocollege.com.br
                      </p>
                    ) : (
                      <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px' }}>
                        🌐 seuslug.nexocollege.com.br
                      </p>
                    )}
                    <p style={{ color: '#666666', fontSize: '11px', margin: 0 }}>
                      O endereço não poderá ser alterado após o cadastro. Alteração disponível a partir do plano Pro.
                    </p>
                  </div>

                  {/* Verificação de disponibilidade */}
                  {slugPreview && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={verificarSlug}
                        disabled={slugStatus === 'checking'}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #2A2A2A', backgroundColor: '#111', color: '#888', fontSize: '12px', cursor: slugStatus === 'checking' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                      >
                        {slugStatus === 'checking' ? 'Verificando...' : '🔍 Verificar disponibilidade'}
                      </button>

                      {slugStatus === 'available' && (
                        <p style={{ color: '#AEEA00', fontSize: '12px', marginTop: '6px' }}>
                          ✅ Disponível! Seu endereço será: <strong>{slugPreview}.nexocollege.com.br</strong>
                        </p>
                      )}

                      {slugStatus === 'taken' && (
                        <div style={{ marginTop: '6px' }}>
                          <p style={{ color: '#FF5555', fontSize: '12px', margin: '0 0 6px' }}>
                            ❌ Este endereço já está em uso.
                          </p>
                          {slugSugestoes.length > 0 && (
                            <div>
                              <p style={{ color: '#888', fontSize: '12px', margin: '0 0 6px' }}>Sugestões disponíveis:</p>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {slugSugestoes.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setSlugCustom(s); setSlugPreview(s); setSlugStatus('available') }}
                                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(174,234,0,0.4)', backgroundColor: 'rgba(174,234,0,0.08)', color: '#AEEA00', fontSize: '12px', cursor: 'pointer', fontFamily: 'monospace' }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: '8px' }}>
                            <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px' }}>Ou escolha outro nome:</p>
                            <input
                              type="text"
                              value={slugCustom}
                              onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
                                setSlugCustom(val)
                                setSlugPreview(val)
                                setSlugStatus('idle')
                              }}
                              placeholder="meuslug"
                              maxLength={20}
                              style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333', borderRadius: '6px', padding: '8px 12px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'monospace' }}
                            />
                            <p style={{ color: '#555', fontSize: '11px', margin: '4px 0 0' }}>
                              Apenas letras minúsculas e números, máx. 20 caracteres
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
