'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import {
  getMentoresEscola,
  inabilitarMentor,
  reabilitarMentor,
  removerMentor,
} from '@/app/actions/mentor-actions'
import { getMySchool } from '@/app/actions/school-actions'
import { MentorModuleLock } from '@/components/MentorModuleLock'
import { SkeletonGrid, SkeletonCard } from '@/components/ui/skeleton'

type MentorRow = {
  mentorshipId: string
  mentorshipTitle: string
  mentorId: string
  fullName: string
  role: string
  email: string
}

export default function MentoresPage() {
  const [mentores, setMentores] = useState<MentorRow[]>([])
  const [school, setSchool] = useState<any>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [data, escola] = await Promise.all([getMentoresEscola(), getMySchool()])
      setMentores(data)
      setSchool(escola)
      setSchoolId(escola?.id ?? null)
      setLoading(false)
    }
    load()
  }, [])

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleInabilitar(mentorId: string) {
    if (!schoolId) return
    setLoadingId(mentorId + ':inabilitar')
    const result = await inabilitarMentor(mentorId, schoolId)
    setLoadingId(null)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    setMentores(mentores.map((m) => m.mentorId === mentorId ? { ...m, role: 'mentor_guest_inactive' } : m))
    showMsg('✅ Mentor inabilitado.')
  }

  async function handleReabilitar(mentorId: string) {
    if (!schoolId) return
    setLoadingId(mentorId + ':reabilitar')
    const result = await reabilitarMentor(mentorId, schoolId)
    setLoadingId(null)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    setMentores(mentores.map((m) => m.mentorId === mentorId ? { ...m, role: 'mentor_guest' } : m))
    showMsg('✅ Mentor reabilitado.')
  }

  async function handleRemover(mentorshipId: string) {
    if (!schoolId) return
    if (!confirm('Remover o mentor desta mentoria? O usuário não será deletado.')) return
    setLoadingId(mentorshipId + ':remover')
    const result = await removerMentor(mentorshipId, schoolId)
    setLoadingId(null)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    setMentores(mentores.filter((m) => m.mentorshipId !== mentorshipId))
    showMsg('✅ Mentor removido da mentoria.')
  }

  if (loading) return <SkeletonCard lines={4} />

  if (!school?.mentor_module) return <MentorModuleLock />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Users size={22} style={{ color: '#7C4DFF' }} />
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Professores convidados
        </h1>
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(124,77,255,0.1)',
          border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF'}`,
          borderRadius: '8px', padding: '12px 16px',
          color: msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF', fontSize: '14px',
        }}>
          {msg}
        </div>
      )}

      {mentores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555', fontSize: '14px' }}>
          Nenhum professor convidado vinculado às mentorias desta escola.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* cabeçalho */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto',
            gap: '12px', padding: '8px 16px',
            color: '#555', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Nome</span>
            <span>Email</span>
            <span>Mentoria</span>
            <span>Status</span>
            <span>Ações</span>
          </div>

          {mentores.map((m) => {
            const ativo = m.role === 'mentor_guest'
            const isLoadingInabilitar = loadingId === m.mentorId + ':inabilitar'
            const isLoadingReabilitar = loadingId === m.mentorId + ':reabilitar'
            const isLoadingRemover    = loadingId === m.mentorshipId + ':remover'
            return (
              <div key={m.mentorshipId} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto',
                gap: '12px', padding: '14px 16px', alignItems: 'center',
                backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px',
              }}>
                <span style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.fullName || '—'}
                </span>
                <span style={{ color: '#888', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.email || '—'}
                </span>
                <span style={{ color: '#888', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.mentorshipTitle}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px',
                  color: ativo ? '#AEEA00' : '#FF5555',
                  backgroundColor: ativo ? '#1A2E00' : '#2A0A0A',
                  whiteSpace: 'nowrap',
                }}>
                  {ativo ? 'Ativo' : 'Inabilitado'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {ativo ? (
                    <button
                      onClick={() => handleInabilitar(m.mentorId)}
                      disabled={!!loadingId}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: '1px solid #FF5555',
                        backgroundColor: 'transparent', color: '#FF5555',
                        fontSize: '12px', fontWeight: '600', cursor: loadingId ? 'default' : 'pointer',
                        opacity: isLoadingInabilitar ? 0.6 : 1, fontFamily: 'inherit',
                      }}
                    >
                      {isLoadingInabilitar ? '...' : 'Inabilitar'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReabilitar(m.mentorId)}
                      disabled={!!loadingId}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: '1px solid #AEEA00',
                        backgroundColor: 'transparent', color: '#AEEA00',
                        fontSize: '12px', fontWeight: '600', cursor: loadingId ? 'default' : 'pointer',
                        opacity: isLoadingReabilitar ? 0.6 : 1, fontFamily: 'inherit',
                      }}
                    >
                      {isLoadingReabilitar ? '...' : 'Reabilitar'}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemover(m.mentorshipId)}
                    disabled={!!loadingId}
                    style={{
                      padding: '5px 12px', borderRadius: '6px', border: '1px solid #333',
                      backgroundColor: 'transparent', color: '#666',
                      fontSize: '12px', fontWeight: '600', cursor: loadingId ? 'default' : 'pointer',
                      opacity: isLoadingRemover ? 0.6 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {isLoadingRemover ? '...' : 'Remover'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
