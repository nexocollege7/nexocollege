'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSchoolBySlug } from '@/app/actions/vitrine-actions'
import { getActiveDocuments, recordAcceptances } from '@/app/actions/legal-actions'
import type { LegalDocument } from '@/app/actions/legal-actions'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const BLOCKED_DOMAINS = ['teste.com', 'test.com', 'example.com', 'foo.com', 'bar.com']
function isEmailValido(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false
  const domain = email.split('@')[1].toLowerCase()
  return !BLOCKED_DOMAINS.includes(domain)
}

const DOC_ICONS: Record<string, string> = {
  terms_of_use: '📄',
  privacy_policy: '🔒',
  cookie_policy: '🍪',
}

function Modal({ titulo, conteudo, cor, onFechar }: { titulo: string; conteudo: string; cor: string; onFechar: () => void }) {
  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2A2A2A', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2A2A2A' }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>{titulo}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          <pre style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            {conteudo}
          </pre>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', textAlign: 'right' }}>
          <button onClick={onFechar} style={{ backgroundColor: cor, color: '#0D0D0D', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            Entendi e fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginEscolaPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard/meus-cursos'
  const supabase = createClient()

  const [school, setSchool] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchool, setLoadingSchool] = useState(true)
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [nome, setNome] = useState('')
  const [studentDocs, setStudentDocs] = useState<LegalDocument[]>([])
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [modalDoc, setModalDoc] = useState<LegalDocument | null>(null)

  useEffect(() => {
    async function load() {
      const [schoolData, docs] = await Promise.all([
        getSchoolBySlug(slug),
        getActiveDocuments('student'),
      ])
      setSchool(schoolData)
      setLoadingSchool(false)
      setStudentDocs(docs)
      const init: Record<string, boolean> = {}
      docs.forEach((d: LegalDocument) => { init[d.id] = false })
      setAccepted(init)
    }
    load()
  }, [slug])

  const todosAceitos = studentDocs.length > 0 && studentDocs.every(d => accepted[d.id])

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleCadastro() {
    setLoading(true)
    setError('')
    setEmailError('')

    if (!nome.trim()) {
      setError('Preencha seu nome.')
      setLoading(false)
      return
    }

    if (!isEmailValido(email)) {
      setEmailError('Por favor, informe um e-mail válido.')
      setLoading(false)
      return
    }

    if (!todosAceitos) {
      setError('Você precisa aceitar todos os documentos para continuar.')
      setLoading(false)
      return
    }

    const schoolId = school?.id
    if (!schoolId) {
      setError('Escola não encontrada.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Aguarda registro do aluno e aceites LGPD antes de redirecionar
      await Promise.all([
        fetch('/api/register-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, email, fullName: nome, schoolId }),
        }),
        recordAcceptances(studentDocs.map(d => d.id)),
      ])

      // Pequeno delay para garantir que a sessão foi estabelecida
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Usar window.location para forçar reload completo e propagar sessão
    window.location.href = redirectTo
  }

  if (loadingSchool) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888888' }}>Carregando...</p>
      </div>
    )
  }

  const cor = school?.primary_color || '#AEEA00'
  const nomeEscola = school?.name || 'NexoCollege'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'sans-serif' }}>
      {modalDoc && (
        <Modal titulo={modalDoc.title} conteudo={modalDoc.content} cor={cor} onFechar={() => setModalDoc(null)} />
      )}

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo da escola */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {school?.logo_url ? (
            <Image
              src={school.logo_url}
              alt={nomeEscola}
              width={64}
              height={64}
              style={{ borderRadius: '16px', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '1px solid #2A2A2A' }}
            />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px', fontWeight: '800', color: '#0D0D0D' }}>
              {nomeEscola.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 4px' }}>
            {nomeEscola}
          </h1>
          <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
            {modo === 'login' ? 'Entre na sua conta para acessar os cursos' : 'Crie sua conta gratuita'}
          </p>
        </div>

        {/* Abas login / cadastro */}
        <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '10px', backgroundColor: '#1A1A1A', padding: '4px' }}>
          {(['login', 'cadastro'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setModo(m); setError(''); setEmailError('') }}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                backgroundColor: modo === m ? cor : 'transparent',
                color: modo === m ? '#0D0D0D' : '#888888',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '32px', border: '1px solid #2A2A2A' }}>

          {error && (
            <div style={{ backgroundColor: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#FF5555', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {modo === 'cadastro' && (
              <div>
                <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                placeholder="seu@email.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${emailError ? '#FF5555' : '#2A2A2A'}`, backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {emailError && (
                <p style={{ color: '#FF5555', fontSize: '12px', marginTop: '5px', margin: '5px 0 0' }}>{emailError}</p>
              )}
            </div>

            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onKeyDown={(e) => e.key === 'Enter' && (modo === 'login' ? handleLogin() : handleCadastro())}
              />
            </div>

            {/* LGPD — só no cadastro */}
            {modo === 'cadastro' && studentDocs.length > 0 && (
              <div style={{ backgroundColor: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '14px' }}>
                <p style={{ color: '#666666', fontSize: '11px', margin: '0 0 12px', lineHeight: '1.5' }}>
                  Seus dados são protegidos conforme a LGPD. Leia e aceite:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {studentDocs.map((doc) => (
                    <label key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={accepted[doc.id] ?? false}
                        onChange={(e) => setAccepted(prev => ({ ...prev, [doc.id]: e.target.checked }))}
                        style={{ marginTop: '2px', width: '14px', height: '14px', accentColor: cor, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ color: '#CCCCCC', fontSize: '12px', lineHeight: '1.5' }}>
                        {DOC_ICONS[doc.type] ?? '📄'}{' '}
                        Li e aceito:{' '}
                        <span
                          onClick={(e) => { e.preventDefault(); setModalDoc(doc) }}
                          style={{ color: cor, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {doc.title}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={modo === 'login' ? handleLogin : handleCadastro}
              disabled={loading || (modo === 'cadastro' && !todosAceitos)}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: 'none', backgroundColor: (modo === 'cadastro' && !todosAceitos) ? '#333333' : cor,
                color: (modo === 'cadastro' && !todosAceitos) ? '#666666' : '#0D0D0D',
                fontWeight: '700', fontSize: '15px',
                cursor: (loading || (modo === 'cadastro' && !todosAceitos)) ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {modo === 'login' && (
              <Link href="/esqueci-senha" style={{ color: '#555555', fontSize: '12px', textDecoration: 'none' }}>
                Esqueceu sua senha?
              </Link>
            )}
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
