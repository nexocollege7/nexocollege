'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
  getMentorship,
  updateMentorship,
  criarAulaMentoria,
  deletarAulaMentoria,
  getSchoolTeamMembers,
  ensureMentorshipCoversBucket,
  getCohorts,
  createCohort,
  closeCohort,
  updateCohortLive,
  getMentorAtual,
  createGuestMentor,
} from '@/app/actions/mentor-actions'
import { verificarPermissaoFeature } from '@/app/actions/school-actions'
import { PlanLock } from '@/components/PlanLock'
import { AulaComentarios } from '@/components/AulaComentarios'
import type { PermissaoPlano } from '@/lib/plan-permissions'
import VideoRoom from '@/components/ui/VideoRoom'
import { SkeletonGrid, SkeletonCard } from '@/components/ui/skeleton'

export default function EditarMentoriaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mentoria, setMentoria] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState('')
  const [novaAula, setNovaAula] = useState({ title: '', summary: '', scheduledAt: '', materialsUrl: '' })

  const [cohorts, setCohorts] = useState<any[]>([])
  const [permissaoLive, setPermissaoLive] = useState<PermissaoPlano | null>(null)
  const [novaTurma, setNovaTurma] = useState({ maxStudents: '20', enrollmentStart: '', enrollmentEnd: '' })
  const [abrindoTurma, setAbrindoTurma] = useState(false)
  const [liveEdits, setLiveEdits] = useState<Record<string, string>>({})
  const [savingLiveId, setSavingLiveId] = useState<string | null>(null)

  const [mentorAtual, setMentorAtual] = useState<{ full_name: string; isGuest: boolean } | null>(null)
  const [guestForm, setGuestForm] = useState({ name: '', email: '', password: '' })
  const [criandoGuest, setCriandoGuest] = useState(false)

  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null)
  const [videoRoomCohortId, setVideoRoomCohortId] = useState<string | null>(null)
  const [activeClassId, setActiveClassId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [mentoriaData, membros, cohortsData, permissao, mentorAtualData] = await Promise.all([
        getMentorship(id),
        getSchoolTeamMembers(),
        getCohorts(id),
        verificarPermissaoFeature('live_events'),
        getMentorAtual(id),
        ensureMentorshipCoversBucket(),
      ])
      setMentoria(mentoriaData)
      setTeamMembers(membros)
      setCohorts(cohortsData)
      setPermissaoLive(permissao)
      setMentorAtual(mentorAtualData)
      setLoading(false)
    }
    load()
  }, [id])

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSalvar() {
    setSalvando(true)
    const result = await updateMentorship(id, {
      title: mentoria.title,
      description: mentoria.description || '',
      price: Number(mentoria.price) || 0,
      status: mentoria.status,
      mentor_id: mentoria.mentor_id || null,
    })
    setSalvando(false)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    showMsg('✅ Mentoria salva!')
    setMentorAtual(await getMentorAtual(id))
  }

  async function handleCriarGuestMentor() {
    if (!guestForm.name.trim() || !guestForm.email.trim() || !guestForm.password) {
      showMsg('Erro: preencha nome, email e senha do professor convidado.')
      return
    }
    setCriandoGuest(true)
    const result = await createGuestMentor(id, guestForm)
    setCriandoGuest(false)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    showMsg('✅ Professor convidado cadastrado e vinculado à mentoria!')
    setGuestForm({ name: '', email: '', password: '' })
    setMentoria({ ...mentoria, mentor_id: null })
    setMentorAtual(await getMentorAtual(id))
  }

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadando(true)
    try {
      const formData = new FormData()
      formData.append('cover', file)
      formData.append('mentorshipId', id)
      const res = await fetch('/api/upload-mentorship-cover', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.url) {
        setMentoria({ ...mentoria, cover_url: result.url })
      } else {
        showMsg('Erro no upload: ' + (result.error || 'Tente novamente'))
      }
    } catch {
      showMsg('Erro ao enviar imagem. Tente novamente.')
    }
    setUploadando(false)
  }

  async function handleCriarAula() {
    if (!novaAula.title.trim()) return
    const result = await criarAulaMentoria(id, {
      title: novaAula.title.trim(),
      summary: novaAula.summary.trim(),
      scheduledAt: novaAula.scheduledAt ? new Date(novaAula.scheduledAt).toISOString() : null,
      materialsUrl: novaAula.materialsUrl.trim(),
    })
    if (result.data) {
      setMentoria({ ...mentoria, classes: [...mentoria.classes, result.data] })
      setNovaAula({ title: '', summary: '', scheduledAt: '', materialsUrl: '' })
    } else if (result.error) {
      showMsg('Erro: ' + result.error)
    }
  }

  async function handleDeletarAula(classId: string) {
    if (!confirm('Remover este item do cronograma?')) return
    await deletarAulaMentoria(classId, id)
    setMentoria({ ...mentoria, classes: mentoria.classes.filter((c: any) => c.id !== classId) })
  }

  async function handleAbrirTurma() {
    setAbrindoTurma(true)
    const result = await createCohort(id, {
      maxStudents: parseInt(novaTurma.maxStudents) || 0,
      enrollmentStart: novaTurma.enrollmentStart ? new Date(novaTurma.enrollmentStart).toISOString() : null,
      enrollmentEnd: novaTurma.enrollmentEnd ? new Date(novaTurma.enrollmentEnd).toISOString() : null,
    })
    setAbrindoTurma(false)
    if (result.data) {
      setCohorts([result.data, ...cohorts])
      setNovaTurma({ maxStudents: '20', enrollmentStart: '', enrollmentEnd: '' })
    } else if (result.error) {
      showMsg('Erro: ' + result.error)
    }
  }

  async function handleEncerrarTurma(cohortId: string) {
    if (!confirm('Encerrar esta turma? Não será possível reabri-la.')) return
    const result = await closeCohort(cohortId, id)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    setCohorts(cohorts.map((c) => c.id === cohortId ? { ...c, status: 'archived', live_active: false } : c))
  }

  async function handleAlternarLiveTurma(cohort: { id: string; live_active: boolean; live_url: string | null }) {
    setSavingLiveId(cohort.id)
    try {
      if (!cohort.live_active) {
        const res = await fetch('/api/mentoria/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cohortId: cohort.id }),
        })
        const data = (await res.json()) as { url?: string; error?: string }
        if (!res.ok || !data.url) { showMsg('Erro: ' + (data.error ?? 'Falha ao criar sala')); return }
        setCohorts(cohorts.map((c) => c.id === cohort.id ? { ...c, live_url: data.url ?? null, live_active: true } : c))
        setVideoRoomUrl(data.url)
        setVideoRoomCohortId(cohort.id)
      } else {
        const res = await fetch('/api/mentoria/delete-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cohortId: cohort.id }),
        })
        const data = (await res.json()) as { success?: boolean; error?: string }
        if (!res.ok) { showMsg('Erro: ' + (data.error ?? 'Falha ao encerrar sala')); return }
        setCohorts(cohorts.map((c) => c.id === cohort.id ? { ...c, live_url: null, live_active: false } : c))
        setVideoRoomUrl(null)
        setVideoRoomCohortId(null)
      }
    } finally {
      setSavingLiveId(null)
    }
  }

  async function handleIniciarSessaoAula(classId: string) {
    const turmaBerta = cohorts.find((c: { id: string; status: string }) => c.status === 'open')
    if (!turmaBerta) { showMsg('Nenhuma turma aberta para iniciar sessão'); return }
    setActiveClassId(classId)
    await handleAlternarLiveTurma(turmaBerta)
  }

  if (loading) return <SkeletonCard lines={4} />

  if (!mentoria) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Mentoria não encontrada.</p>
    </div>
  )

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
    color: '#F0F0F0', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#7C4DFF', color: '#fff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'inherit',
  }

  const btnPerigo: React.CSSProperties = {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid #3A1A1A',
    backgroundColor: 'transparent', color: '#FF5555',
    fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/dashboard/mentorias')}
          style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Editar Mentoria</h1>
          <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Capa, informações e cronograma</p>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(124,77,255,0.1)', border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF'}`, borderRadius: '8px', padding: '12px 16px', color: msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
          Informações da Mentoria
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              Capa
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '160px', height: '100px', borderRadius: '8px',
                  border: `2px dashed ${mentoria.cover_url ? '#7C4DFF' : '#2A2A2A'}`,
                  backgroundColor: '#0D0D0D', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0, position: 'relative',
                }}
              >
                {mentoria.cover_url ? (
                  <Image src={mentoria.cover_url} alt="Capa" fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', margin: 0 }}>🎓</p>
                    <p style={{ color: '#555555', fontSize: '11px', margin: '4px 0 0' }}>Clique para upload</p>
                  </div>
                )}
                {uploadando && (
                  <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <p style={{ color: '#7C4DFF', fontSize: '12px' }}>Enviando...</p>
                  </div>
                )}
              </div>
              <div>
                <button onClick={() => fileInputRef.current?.click()} style={btnPrimary}>
                  {mentoria.cover_url ? 'Trocar imagem' : 'Upload de imagem'}
                </button>
                <p style={{ color: '#555555', fontSize: '12px', margin: '8px 0 0', lineHeight: '1.5' }}>
                  JPG, PNG ou WebP.<br />Recomendado: 1280×720px
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUploadCover}
            />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Título *</label>
            <input style={input} value={mentoria.title}
              onChange={(e) => setMentoria({ ...mentoria, title: e.target.value })} />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Descrição</label>
            <textarea style={{ ...input, minHeight: '100px', resize: 'vertical' }} value={mentoria.description || ''}
              onChange={(e) => setMentoria({ ...mentoria, description: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Preço (R$)</label>
              <input style={input} type="number" min={0} step="0.01" value={mentoria.price}
                onChange={(e) => setMentoria({ ...mentoria, price: e.target.value })} />
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Status</label>
              <select style={input} value={mentoria.status}
                onChange={(e) => setMentoria({ ...mentoria, status: e.target.value })}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicada</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Mentor responsável</label>
              <select style={input} value={mentoria.mentor_id || ''}
                onChange={(e) => setMentoria({ ...mentoria, mentor_id: e.target.value || null })}>
                <option value="">Sem mentor definido</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name || 'Sem nome'} {m.role === 'admin' ? '(dono)' : '(colaborador)'}</option>
                ))}
              </select>
              {mentorAtual && (
                <p style={{ color: '#555555', fontSize: '11px', margin: '6px 0 0' }}>
                  Atual: <strong style={{ color: '#888888' }}>{mentorAtual.full_name}</strong>
                  {mentorAtual.isGuest ? ' (professor convidado)' : ''}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button onClick={handleSalvar} disabled={salvando} style={btnPrimary}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
          Professor convidado
        </h2>
        <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 16px' }}>
          Cadastre um professor externo (não faz parte da equipe da escola) para ser o mentor desta mentoria.
          Ele acessará apenas o ambiente restrito da própria mentoria pelo login da escola.
          {mentorAtual?.isGuest && ' Cadastrar um novo professor aqui substitui o professor convidado atual.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Nome do professor"
            style={{ ...input, flex: 1, minWidth: '160px' }}
            value={guestForm.name}
            onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
          />
          <input placeholder="Email" type="email"
            style={{ ...input, flex: 1, minWidth: '160px' }}
            value={guestForm.email}
            onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
          />
          <input placeholder="Senha (mín. 6 caracteres)" type="password"
            style={{ ...input, flex: 1, minWidth: '160px' }}
            value={guestForm.password}
            onChange={(e) => setGuestForm({ ...guestForm, password: e.target.value })}
          />
          <button onClick={handleCriarGuestMentor} disabled={criandoGuest} style={{ ...btnPrimary, whiteSpace: 'nowrap' }}>
            {criandoGuest ? 'Cadastrando...' : '+ Cadastrar professor convidado'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
          Cronograma
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {mentoria.classes.length === 0 && (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              Nenhum encontro no cronograma ainda.
            </p>
          )}
          {mentoria.classes.map((c: any, index: number) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '12px 16px', backgroundColor: '#0D0D0D', borderRadius: '8px', border: '1px solid #2A2A2A',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700' }}>{index + 1}.</span>
                  <span style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600' }}>{c.title}</span>
                </div>
                {c.summary && <p style={{ color: '#888888', fontSize: '12px', margin: '4px 0 0' }}>{c.summary}</p>}
                {c.scheduled_at && (
                  <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0' }}>
                    📅 {new Date(c.scheduled_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {c.materials_url && (
                  <a href={c.materials_url} target="_blank" rel="noreferrer" style={{ color: '#7C4DFF', fontSize: '12px' }}>Materiais →</a>
                )}
                <AulaComentarios classId={c.id} podeComentar={false} expandidoPorPadrao={false} />
              </div>
              <button onClick={() => handleDeletarAula(c.id)} style={btnPerigo}>Remover</button>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          padding: '16px', backgroundColor: '#111111',
          borderRadius: '10px', border: '1px dashed #7C4DFF',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input placeholder="Título do encontro"
              style={{ ...input, flex: 2, minWidth: '160px' }}
              value={novaAula.title}
              onChange={(e) => setNovaAula({ ...novaAula, title: e.target.value })}
            />
            <input type="datetime-local"
              style={{ ...input, flex: 1, minWidth: '160px' }}
              value={novaAula.scheduledAt}
              onChange={(e) => setNovaAula({ ...novaAula, scheduledAt: e.target.value })}
            />
          </div>
          <input placeholder="Resumo do encontro"
            style={input}
            value={novaAula.summary}
            onChange={(e) => setNovaAula({ ...novaAula, summary: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="Link de materiais (opcional)"
              style={{ ...input, flex: 1 }}
              value={novaAula.materialsUrl}
              onChange={(e) => setNovaAula({ ...novaAula, materialsUrl: e.target.value })}
            />
            <button onClick={handleCriarAula} style={{ ...btnPrimary, whiteSpace: 'nowrap' }}>
              + Adicionar
            </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
          Turmas
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {cohorts.length === 0 && (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              Nenhuma turma aberta ainda.
            </p>
          )}
          {cohorts.map((c) => {
            const aberta = c.status === 'open'
            return (
              <div key={c.id} style={{
                padding: '14px 16px', backgroundColor: '#0D0D0D', borderRadius: '8px', border: '1px solid #2A2A2A',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                      color: aberta ? '#AEEA00' : '#888888', backgroundColor: aberta ? '#1A2E00' : '#222222',
                    }}>
                      {aberta ? 'Aberta' : c.status === 'closed' ? 'Fechada' : 'Arquivada'}
                    </span>
                    <span style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '600' }}>
                      {c.enrolled_count}/{c.max_students} vagas
                    </span>
                    {(c.enrollment_start || c.enrollment_end) && (
                      <span style={{ color: '#555555', fontSize: '12px' }}>
                        {c.enrollment_start ? new Date(c.enrollment_start).toLocaleDateString('pt-BR') : '—'}
                        {' a '}
                        {c.enrollment_end ? new Date(c.enrollment_end).toLocaleDateString('pt-BR') : '—'}
                      </span>
                    )}
                  </div>
                  {aberta && (
                    <button onClick={() => handleEncerrarTurma(c.id)} style={btnPerigo}>Encerrar turma</button>
                  )}
                </div>

                {aberta && (
                  permissaoLive && !permissaoLive.allowed ? (
                    <PlanLock upgradeRequired={permissaoLive.upgradeRequired} mensagem="Eventos ao vivo disponíveis a partir do plano Pro" />
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          if (c.live_active && c.live_url) {
                            setVideoRoomUrl(c.live_url)
                            setVideoRoomCohortId(c.id)
                          } else {
                            void handleAlternarLiveTurma(c)
                          }
                        }}
                        disabled={savingLiveId === c.id}
                        style={{ backgroundColor: c.live_active ? '#7C4DFF' : '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                      >
                        {savingLiveId === c.id ? 'Aguarde...' : c.live_active ? 'Entrar na sessão' : 'Iniciar sessão Daily'}
                      </button>
                      {c.live_active && (
                        <button
                          onClick={() => void handleAlternarLiveTurma(c)}
                          disabled={savingLiveId === c.id}
                          style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                        >
                          Encerrar sessão
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
          padding: '16px', backgroundColor: '#111111',
          borderRadius: '10px', border: '1px dashed #7C4DFF',
        }}>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ color: '#888888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Vagas</label>
            <input type="number" min={0} style={input} value={novaTurma.maxStudents}
              onChange={(e) => setNovaTurma({ ...novaTurma, maxStudents: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ color: '#888888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Início das inscrições</label>
            <input type="date" style={input} value={novaTurma.enrollmentStart}
              onChange={(e) => setNovaTurma({ ...novaTurma, enrollmentStart: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ color: '#888888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Fim das inscrições</label>
            <input type="date" style={input} value={novaTurma.enrollmentEnd}
              onChange={(e) => setNovaTurma({ ...novaTurma, enrollmentEnd: e.target.value })} />
          </div>
          <button onClick={handleAbrirTurma} disabled={abrindoTurma} style={{ ...btnPrimary, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
            {abrindoTurma ? 'Abrindo...' : '+ Abrir turma'}
          </button>
        </div>
      </div>

      {videoRoomUrl && (
        <VideoRoom
          url={videoRoomUrl}
          isMentor={true}
          onLeave={() => setVideoRoomUrl(null)}
          onEnd={async () => {
            if (videoRoomCohortId) {
              await fetch('/api/mentoria/delete-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cohortId: videoRoomCohortId }),
              })
              setCohorts(cohorts.map((c) => c.id === videoRoomCohortId ? { ...c, live_url: null, live_active: false } : c))
            }
            setVideoRoomUrl(null)
            setVideoRoomCohortId(null)
          }}
        />
      )}
    </div>
  )
}
