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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
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
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onKeyDown={(e) => e.key === 'Enter' && (modo === 'login' ? handleLogin() : handleCadastro())}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888888', fontSize: '16px', padding: '0' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {modo === 'cadastro' && (
              <div>
                <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Confirmar senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: '8px', border: `1px solid ${confirmPassword && confirmPassword !== password ? '#FF5555' : '#2A2A2A'}`, backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888888', fontSize: '16px', padding: '0' }}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ color: '#FF5555', fontSize: '12px', marginTop: '6px' }}>As senhas não coincidem.</p>
                )}
              </div>
            )}

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
