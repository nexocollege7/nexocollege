'use client'

import { useEffect, useState } from 'react'
import { getMyMentorshipEnrollments } from '@/app/actions/mentor-actions'
import { GraduationCap, Calendar, Radio } from 'lucide-react'
import { AulaComentarios } from '@/components/AulaComentarios'

function MentoriaCard({ insc }: { insc: any }) {
  const cohort = insc.mentorship_cohorts
  const mentoria = cohort?.mentorships
  if (!mentoria) return null
  const aulas = (mentoria.mentorship_classes || []).slice().sort((a: any, b: any) => a.position - b.position)

  return (
    <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
        {mentoria.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mentoria.cover_url} alt={mentoria.title} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '80px', height: '60px', borderRadius: '8px', backgroundColor: '#1E0E3F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={24} color="#7C4DFF" />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>{mentoria.title}</h2>
          {mentoria.description && (
            <p style={{ color: '#888888', fontSize: '13px', margin: '6px 0 0', lineHeight: '1.5' }}>{mentoria.description}</p>
          )}
        </div>
      </div>

      {cohort.live_active && cohort.live_url && (
        <a href={cohort.live_url} target="_blank" rel="noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
          backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid #FF4444',
          borderRadius: '8px', marginBottom: '16px', textDecoration: 'none',
        }}>
          <Radio size={16} color="#FF4444" />
          <span style={{ color: '#FF4444', fontWeight: '700', fontSize: '13px' }}>🔴 Transmissão ao vivo agora — entrar →</span>
        </a>
      )}

      {aulas.length > 0 && (
        <div>
          <p style={{ color: '#555555', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Cronograma
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {aulas.map((a: any, i: number) => (
              <div key={a.id} style={{ padding: '10px 14px', backgroundColor: '#111111', borderRadius: '8px', border: '1px solid #2A2A2A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700' }}>{i + 1}.</span>
                  <span style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '600' }}>{a.title}</span>
                </div>
                {a.scheduled_at && (
                  <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} /> {new Date(a.scheduled_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {a.materials_url && (
                  <a href={a.materials_url} target="_blank" rel="noreferrer" style={{ color: '#7C4DFF', fontSize: '12px' }}>Materiais →</a>
                )}
                <AulaComentarios classId={a.id} podeComentar={true} expandidoPorPadrao={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MinhasMentoriasPage() {
  const [inscricoes, setInscricoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getMyMentorshipEnrollments()
      setInscricoes(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando suas mentorias...</p>
      </div>
    )
  }

  const ativas = inscricoes.filter((i: any) => i.mentorship_cohorts?.status !== 'archived')
  const historico = inscricoes.filter((i: any) => i.mentorship_cohorts?.status === 'archived')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Minhas Mentorias</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
          {inscricoes.length} mentoria{inscricoes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {inscricoes.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '200px', border: '2px dashed #2A2A2A', borderRadius: '12px',
        }}>
          <GraduationCap size={32} style={{ color: '#444444', marginBottom: '8px' }} />
          <p style={{ color: '#888888', margin: 0 }}>Você ainda não está inscrito em nenhuma mentoria</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {ativas.map((insc: any) => <MentoriaCard key={insc.id} insc={insc} />)}
          </div>

          {historico.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ color: '#888888', fontSize: '14px', fontWeight: '700', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Histórico de mentorias
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: 0.8 }}>
                {historico.map((insc: any) => <MentoriaCard key={insc.id} insc={insc} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
