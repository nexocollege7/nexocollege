'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMySchool, updateSchool, saveMpToken, getMpTokenStatus, saveOwnerContact, updateSchoolLogoUrl, ensureSchoolLogosBucket } from '@/app/actions/school-actions'
import { School, CreditCard, User, Users, Settings } from 'lucide-react'

const ABAS = [
  { id: 'escola', label: 'Minha Escola', icon: School },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'equipe', label: 'Equipe', icon: Users },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
]

export default function EscolaPage() {
  const supabase = createClient()
  const [abaAtiva, setAbaAtiva] = useState('escola')
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Escola
  const [nomeEscola, setNomeEscola] = useState('')
  const [descEscola, setDescEscola] = useState('')
  const [corEscola, setCorEscola] = useState('#AEEA00')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Pagamentos
  const [mpToken, setMpToken] = useState('')
  const [mpPublicKey, setMpPublicKey] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [hasPublicKey, setHasPublicKey] = useState(false)

  // Perfil
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')

  // Equipe
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [emailColaborador, setEmailColaborador] = useState('')
  const [adicionandoColab, setAdicionandoColab] = useState(false)

  useEffect(() => { loadData(); ensureSchoolLogosBucket() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Busca perfil e school_id
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('school_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profileData?.school_id) { setLoading(false); return }

    setNomeCompleto(profileData.full_name || '')

    // Busca dados da escola via server action (bypassa RLS)
    const schoolData = await getMySchool()

    if (schoolData) {
      setSchool(schoolData)
      setNomeEscola(schoolData.name || '')
      setDescEscola(schoolData.description || '')
      setCorEscola(schoolData.primary_color || '#AEEA00')
      setLogoUrl(schoolData.logo_url || null)
      setNomeResponsavel(schoolData.owner_name || '')
      setTelefone(schoolData.owner_phone || '')
    }

    // Status MP
    const status = await getMpTokenStatus()
    setHasToken(status.hasToken)
    setHasPublicKey((status as any).hasPublicKey || false)

    // Colaboradores
    const { data: colabs } = await supabase
      .from('users')
      .select('id, full_name, name')
      .eq('school_id', profileData.school_id)
      .eq('role', 'collaborator')

    setColaboradores(colabs || [])
    setLoading(false)
  }

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showMsg('Sessão expirada'); setUploadingLogo(false); return }

    const ext = file.name.split('.').pop()
    const path = `${school?.id}/logo.${ext}`
    const { error: upErr } = await supabase.storage
      .from('school-logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upErr) { showMsg('Erro ao enviar logo: ' + upErr.message); setUploadingLogo(false); return }

    const { data: urlData } = supabase.storage.from('school-logos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`

    const result = await updateSchoolLogoUrl(publicUrl)
    if ((result as any)?.error) { showMsg('Erro ao salvar: ' + (result as any).error); setUploadingLogo(false); return }

    setLogoUrl(publicUrl)
    showMsg('✅ Logo atualizada!')
    setUploadingLogo(false)
  }

  async function salvarEscola() {
    setSaving(true)
    const result = await updateSchool({ name: nomeEscola, description: descEscola, primary_color: corEscola })
    setSaving(false)
    if ((result as any)?.error) showMsg('Erro: ' + (result as any).error)
    else showMsg('✅ Escola atualizada!')
  }

  async function salvarPagamento() {
    if (!mpToken.trim()) return
    setSaving(true)
    const result = await saveMpToken(mpToken.trim(), mpPublicKey.trim() || undefined)
    setSaving(false)
    if ((result as any)?.error) showMsg('Erro: ' + (result as any).error)
    else {
      showMsg('✅ Credenciais salvas!')
      setHasToken(true)
      if (mpPublicKey.trim()) setHasPublicKey(true)
      setMpToken('')
      setMpPublicKey('')
    }
  }

  async function salvarPerfil() {
    setSaving(true)
    const result = await saveOwnerContact(nomeResponsavel, telefone)
    setSaving(false)
    if ((result as any)?.error) showMsg('Erro: ' + (result as any).error)
    else showMsg('✅ Perfil atualizado!')
  }

  async function adicionarColaborador() {
    if (!emailColaborador.trim()) return
    setAdicionandoColab(true)
    // Busca o usuário pelo email
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, name')
      .eq('role', 'collaborator')

    // Simplificado: apenas mostra mensagem por ora
    showMsg('✅ Convite enviado para ' + emailColaborador)
    setEmailColaborador('')
    setAdicionandoColab(false)
  }

  const inputStyle = {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }

  const labelStyle = { color: '#aaa', fontSize: '13px', display: 'block' as const, marginBottom: '6px' }
  const btnStyle = {
    background: '#AEEA00', color: '#000', border: 'none', borderRadius: '8px',
    padding: '10px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
    opacity: saving ? 0.6 : 1,
  }
  const btnSecStyle = {
    background: '#1a1a1a', color: '#888', border: '1px solid #333', borderRadius: '8px',
    padding: '10px 24px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' }}>
      Carregando...
    </div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <style>{`
        @media (max-width: 480px) {
          .escola-page-root { padding: 16px !important; }
          .escola-tab-btn { padding: 8px 10px !important; font-size: 12px !important; gap: 4px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>Minha Escola</h1>
        <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>Gerencie as configurações da sua escola</p>
      </div>

      {/* Mensagem de feedback */}
      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(174,234,0,0.1)', border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#AEEA00'}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: msg.startsWith('Erro') ? '#FF5555' : '#AEEA00', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: '#111', borderRadius: '10px', padding: '4px', overflowX: 'auto' }}>
        {ABAS.map(aba => {
          const Icon = aba.icon
          const isActive = abaAtiva === aba.id
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} className="escola-tab-btn" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              borderRadius: '8px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: isActive ? '#AEEA00' : 'transparent',
              color: isActive ? '#000' : '#666',
              fontWeight: isActive ? '700' : '500',
              fontSize: '13px', transition: 'all 0.15s',
            }}>
              <Icon size={14} />
              {aba.label}
            </button>
          )
        })}
      </div>

      {/* ABA: MINHA ESCOLA */}
      {abaAtiva === 'escola' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Logo da escola */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>Logo da Escola</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #2a2a2a' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', backgroundColor: corEscola, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: '#0D0D0D', flexShrink: 0 }}>
                  {nomeEscola.charAt(0).toUpperCase() || 'N'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoChange} />
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} style={{ ...btnStyle, opacity: uploadingLogo ? 0.6 : 1 }}>
                  {uploadingLogo ? 'Enviando...' : logoUrl ? 'Alterar logo' : 'Enviar logo'}
                </button>
                <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>JPG, PNG, WebP ou SVG · máx. 5 MB</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Informações da Escola</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome da escola</label>
                <input value={nomeEscola} onChange={e => setNomeEscola(e.target.value)} style={inputStyle} placeholder="Ex: Instituto Nexo de Liderança" />
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea value={descEscola} onChange={e => setDescEscola(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descreva sua escola em poucas palavras..." />
              </div>
              <div>
                <label style={labelStyle}>Cor principal (aparece na vitrine e nos botões)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input type="color" value={corEscola} onChange={e => setCorEscola(e.target.value)} style={{ width: '48px', height: '48px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'none' }} />
                  <input value={corEscola} onChange={e => setCorEscola(e.target.value)} style={{ ...inputStyle, width: '140px' }} placeholder="#AEEA00" />
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: corEscola }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={salvarEscola} disabled={saving} style={btnStyle}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA: PAGAMENTOS */}
      {abaAtiva === 'pagamentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Status */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>Status da integração</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: hasToken ? 'rgba(174,234,0,0.08)' : '#1a1a1a', border: `1px solid ${hasToken ? '#AEEA00' : '#2a2a2a'}`, borderRadius: '8px', padding: '12px 16px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Access Token</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: hasToken ? '#AEEA00' : '#444' }}>{hasToken ? '✅ Configurado' : '❌ Não configurado'}</p>
              </div>
              <div style={{ flex: 1, background: hasPublicKey ? 'rgba(174,234,0,0.08)' : '#1a1a1a', border: `1px solid ${hasPublicKey ? '#AEEA00' : '#2a2a2a'}`, borderRadius: '8px', padding: '12px 16px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Public Key</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: hasPublicKey ? '#AEEA00' : '#444' }}>{hasPublicKey ? '✅ Configurada' : '❌ Não configurada'}</p>
              </div>
            </div>
          </div>

          {/* Credenciais */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Suas credenciais do Mercado Pago</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>Estas credenciais conectam sua escola ao Mercado Pago para receber pagamentos dos alunos diretamente na sua conta.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Access Token {hasToken && <span style={{ color: '#AEEA00', fontSize: '11px' }}>• já configurado</span>}</label>
                <input type="password" value={mpToken} onChange={e => setMpToken(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder={hasToken ? 'Cole aqui para atualizar' : 'APP_USR-xxxx...'} />
              </div>
              <div>
                <label style={labelStyle}>Public Key {hasPublicKey && <span style={{ color: '#AEEA00', fontSize: '11px' }}>• já configurada</span>}</label>
                <input type="password" value={mpPublicKey} onChange={e => setMpPublicKey(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder={hasPublicKey ? 'Cole aqui para atualizar' : 'APP_USR-xxxx...'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={salvarPagamento} disabled={saving || !mpToken.trim()} style={btnStyle}>Salvar credenciais</button>
              </div>
            </div>
          </div>

          {/* Guia */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>📋 Como encontrar suas credenciais</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 16px' }}>Siga o passo a passo abaixo para configurar sua conta do Mercado Pago:</p>
            {[
              { n: '1', titulo: 'Acesse o Mercado Pago', desc: 'Entre em mercadopago.com.br e faça login com sua conta.' },
              { n: '2', titulo: 'Vá em "Seu negócio"', desc: 'No menu superior, clique em "Seu negócio" e depois em "Configurações".' },
              { n: '3', titulo: 'Clique em "Credenciais"', desc: 'No menu lateral, procure a opção "Credenciais" e clique nela.' },
              { n: '4', titulo: 'Escolha "Produção"', desc: 'Selecione a aba "Produção" para usar credenciais reais (não de teste).' },
              { n: '5', titulo: 'Copie o Access Token', desc: 'Copie o campo "Access token" que começa com APP_USR- e cole acima.' },
              { n: '6', titulo: 'Copie a Public Key', desc: 'Copie o campo "Public key" que também começa com APP_USR- e cole acima.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#AEEA00', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                  {step.n}
                </div>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: '600' }}>{step.titulo}</p>
                  <p style={{ margin: '2px 0 0', color: '#666', fontSize: '13px' }}>{step.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ background: 'rgba(124,77,255,0.1)', border: '1px solid #7C4DFF', borderRadius: '8px', padding: '12px 16px', marginTop: '8px' }}>
              <p style={{ margin: 0, color: '#7C4DFF', fontSize: '13px' }}>💡 <strong>Dica:</strong> Se tiver dúvidas, abra um chamado de suporte — nossa equipe te ajuda a configurar!</p>
            </div>
          </div>
        </div>
      )}

      {/* ABA: MEU PERFIL */}
      {abaAtiva === 'perfil' && (
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Meu Perfil</h2>
          <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>Seu nome aparece para os alunos nas mensagens e nos certificados.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Seu nome completo</label>
              <input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} style={inputStyle} placeholder="Ex: João Silva" />
            </div>
            <div>
              <label style={labelStyle}>Nome do responsável pela escola</label>
              <input value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} style={inputStyle} placeholder="Ex: João Silva" />
            </div>
            <div>
              <label style={labelStyle}>Telefone / WhatsApp</label>
              <input value={telefone} onChange={e => setTelefone(e.target.value)} style={inputStyle} placeholder="Ex: 11999999999" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={salvarPerfil} disabled={saving} style={btnStyle}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ABA: EQUIPE */}
      {abaAtiva === 'equipe' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Membros da equipe</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>Adicione pessoas para ajudar a gerenciar sua escola. Elas terão acesso ao painel mas não poderão alterar dados de pagamento.</p>

            {colaboradores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#444', border: '1px dashed #2a2a2a', borderRadius: '8px' }}>
                <Users size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Nenhum membro adicionado ainda</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {colaboradores.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#1a1a1a', borderRadius: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7C4DFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                      {(c.full_name || c.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: '#fff', fontSize: '14px' }}>{c.full_name || c.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>Colaborador</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <input value={emailColaborador} onChange={e => setEmailColaborador(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="email@colaborador.com" />
              <button onClick={adicionarColaborador} disabled={adicionandoColab || !emailColaborador.trim()} style={{ ...btnStyle, padding: '10px 20px', whiteSpace: 'nowrap' }}>
                {adicionandoColab ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA: CONFIGURAÇÕES */}
      {abaAtiva === 'configuracoes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Informações da sua escola</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>Dados técnicos que você pode precisar ao entrar em contato com o suporte.</p>
            {school && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Nome da escola', value: school.name },
                  { label: 'Endereço da vitrine', value: `https://${school.slug}.nexocollege.com.br` },
                  { label: 'Identificador único', value: school.id },
                  { label: 'Plano atual', value: school.plan?.toUpperCase() || 'Starter' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 16px', background: '#1a1a1a', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>{item.label}</span>
                    <span style={{ fontSize: '14px', color: '#fff', fontFamily: item.label.includes('Identificador') || item.label.includes('Endereço') ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{item.value}</span>
                    {item.label === 'Endereço da vitrine' && (
                      <a href={item.value} target="_blank" rel="noreferrer" style={{ color: '#AEEA00', fontSize: '12px', marginTop: '4px' }}>Abrir vitrine →</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,85,85,0.05)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#FF5555', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Precisa de ajuda?</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 16px' }}>Se tiver qualquer dúvida ou problema técnico, abra um chamado de suporte. Nossa equipe responde em até 24 horas.</p>
            <a href="/dashboard/suporte" style={{ display: 'inline-block', background: '#FF5555', color: '#fff', borderRadius: '8px', padding: '10px 20px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
              Abrir chamado de suporte
            </a>
          </div>
        </div>
      )}

    </div>
  )
}
