'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getMyMentorshipsAsGuest } from '@/app/actions/mentor-guest-actions'
import { updateClassScheduledAt } from '@/app/actions/mentor-actions'
import VideoRoom from '@/components/ui/VideoRoom'
import { SkeletonGrid, SkeletonCard } from '@/components/ui/skeleton'

export default function MinistrarMentoriaGuestPage() {
  const params = useParams()
  const id = params.id as string

  const [mentoria, setMentoria] = useState<any>(null)
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [savingClassId, setSavingClassId] = useState<string | null>(null)
  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null)
  const [videoRoomCohortId, setVideoRoomCohortId] = useState<string | null>(null)
  const [activeClassId, setActiveClassId] = useState<string | null>(null)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState<string>('')

  useEffect(() => {
    async function load() {
      const todas = await getMyMentorshipsAsGuest()
      const encontrada = todas.find((m: any) => m.id === id) ?? null
      setMentoria(encontrada)
      setCohorts(encontrada?.cohorts ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleIniciarSessao(classId: string) {
    if (savingClassId !== null || videoRoomUrl !== null) return
    const turmaAberta = cohorts.find((c: any) => c.status === 'open')
    if (!turmaAberta) { showMsg('Nenhuma turma aberta para iniciar sessão'); return }
    setSavingClassId(classId)
    try {
      const res = await fetch('/api/mentoria/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId: turmaAberta.id }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) { showMsg('Erro: ' + (data.error ?? 'Falha ao criar sala')); return }
      setCohorts(cohorts.map((c: any) =>
        c.id === turmaAberta.id ? { ...c, live_url: data.url, live_active: true } : c
      ))
      setVideoRoomUrl(data.url)
      setVideoRoomCohortId(turmaAberta.id)
      setActiveClassId(classId)
    } finally {
      setSavingClassId(null)
    }
  }

  async function handleEncerrarSessao() {
    if (!videoRoomCohortId) {
      console.error('handleEncerrarSessao: videoRoomCohortId é nulo')
      return
    }
    await fetch('/api/mentoria/delete-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohortId: videoRoomCohortId }),
    })
    setCohorts(cohorts.map((c: any) =>
      c.id === videoRoomCohortId ? { ...c, live_url: null, live_active: false } : c
    ))
    setVideoRoomUrl(null)
    setVideoRoomCohortId(null)
    setActiveClassId(null)
  }

  if (loading) return <SkeletonCard lines={3} />

  if (!mentoria) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888' }}>Mentoria não encontrada.</p>
    </div>
  )

  const turmaAberta = cohorts.find((c: any) => c.status === 'open')
  const aulas: any[] = mentoria.classes ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>

      {msg && (
        <div style={{
          backgroundColor: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(174,234,0,0.1)',
          border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#AEEA00'}`,
          borderRadius: '8px', padding: '12px 16px',
          color: msg.startsWith('Erro') ? '#FF5555' : '#AEEA00', fontSize: '14px',
        }}>
          {msg}
        </div>
      )}

      <div>
        <h1 style={{ color: '#F0F0F0', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
          {mentoria.title}
        </h1>
        <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
          {turmaAberta
            ? `Turma aberta · ${turmaAberta.enrolled_count ?? 0}/${turmaAberta.max_students ?? 0} alunos`
            : 'Nenhuma turma aberta — aguarde o dono da escola criar uma turma'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {aulas.length === 0 && (
          <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            Nenhum encontro no cronograma ainda.
          </p>
        )}
        {aulas.map((c: any, index: number) => {
          const emAndamento = activeClassId === c.id && videoRoomUrl !== null
          const outraSessaoAtiva = videoRoomUrl !== null && activeClassId !== c.id
          return (
            <div key={c.id} style={{
              backgroundColor: '#1A1A1A',
              border: `1px solid ${emAndamento ? '#7C4DFF' : '#2A2A2A'}`,
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700' }}>{index + 1}.</span>
                  <span style={{ color: '#F0F0F0', fontSize: '15px', fontWeight: '600' }}>{c.title}</span>
                  {emAndamento && (
                    <span style={{
                      backgroundColor: '#7C4DFF', color: '#fff',
                      fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                    }}>
                      AO VIVO
                    </span>
                  )}
                </div>
                {c.summary && (
                  <p style={{ color: '#888', fontSize: '13px', margin: '0 0 4px' }}>{c.summary}</p>
                )}
                {editingClassId === c.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                    <input
                      type="datetime-local"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#F0F0F0' }}
                    />
                    <button
                      onClick={async () => {
                        const iso = editingDate ? new Date(editingDate).toISOString() : null
                        await updateClassScheduledAt(c.id, mentoria.id, iso)
                        setMentoria({ ...mentoria, classes: mentoria.classes.map((cl: any) => cl.id === c.id ? { ...cl, scheduled_at: iso } : cl) })
                        setEditingClassId(null)
                      }}
                      style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#7C4DFF', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingClassId(null)}
                      style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'transparent', color: '#888', border: '1px solid #2A2A2A', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                      {c.scheduled_at ? `📅 ${new Date(c.scheduled_at).toLocaleString('pt-BR')}` : 'Sem data definida'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingClassId(c.id)
                        setEditingDate(c.scheduled_at ? new Date(c.scheduled_at).toISOString().slice(0, 16) : '')
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '0 2px', lineHeight: 1 }}
                      title="Editar data"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flexShrink: 0 }}>
                {emAndamento ? (
                  <button
                    onClick={() => setVideoRoomUrl(videoRoomUrl)}
                    style={{
                      backgroundColor: '#7C4DFF', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Entrar na sessão
                  </button>
                ) : (
                  <button
                    onClick={() => void handleIniciarSessao(c.id)}
                    disabled={!turmaAberta || savingClassId === c.id || outraSessaoAtiva}
                    style={{
                      backgroundColor: !turmaAberta || outraSessaoAtiva ? '#333' : '#22c55e',
                      color: '#fff', border: 'none', borderRadius: 8,
                      padding: '10px 18px', fontWeight: 600, fontSize: 14,
                      cursor: !turmaAberta || outraSessaoAtiva ? 'default' : 'pointer',
                      opacity: savingClassId === c.id ? 0.6 : 1,
                    }}
                  >
                    {savingClassId === c.id ? 'Aguarde...' : 'Iniciar sessão'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {videoRoomUrl && (
        <VideoRoom
          url={videoRoomUrl}
          isMentor={true}
          onLeave={() => setVideoRoomUrl(null)}
          onEnd={async () => { await handleEncerrarSessao() }}
        />
      )}
    </div>
  )
}
