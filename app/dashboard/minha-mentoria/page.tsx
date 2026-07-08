'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GraduationCap, Play, Users } from 'lucide-react'
import { getMyMentorshipsAsGuest } from '@/app/actions/mentor-guest-actions'

export default function MinhaMentoriaPage() {
  const [mentorias, setMentorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getMyMentorshipsAsGuest()
      setMentorias(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888' }}>Carregando...</p>
    </div>
  )

  if (mentorias.length === 0) return (
    <div style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center' }}>
      <GraduationCap size={32} style={{ color: '#444', marginBottom: '12px' }} />
      <p style={{ color: '#888' }}>Nenhuma mentoria atribuida ainda.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
        Minhas Mentorias
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mentorias.map((m: any) => {
          const turmaAberta = (m.cohorts || []).find((c: any) => c.status === 'open')
          return (
            <div key={m.id} style={{
              backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: '12px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700' }}>{m.title}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px',
                    color: turmaAberta ? '#AEEA00' : '#888',
                    backgroundColor: turmaAberta ? '#1A2E00' : '#222',
                  }}>
                    {turmaAberta ? 'Turma aberta' : 'Sem turma ativa'}
                  </span>
                </div>
                {m.description && (
                  <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '16px', color: '#555', fontSize: '12px' }}>
                  <span>{m.classes?.length ?? 0} encontro{m.classes?.length !== 1 ? 's' : ''}</span>
                  {turmaAberta && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={11} /> {turmaAberta.max_students ?? 0} vagas
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/dashboard/minha-mentoria/${m.id}/ministrar`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 18px', borderRadius: '8px',
                  backgroundColor: '#7C4DFF', color: '#fff',
                  fontWeight: '700', fontSize: '13px', textDecoration: 'none', flexShrink: 0,
                }}
              >
                <Play size={13} />
                Ministrar
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
