'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMyMentorships, deleteMentorship } from '@/app/actions/mentor-actions'
import { getMySchool } from '@/app/actions/school-actions'
import { MentorModuleLock } from '@/components/MentorModuleLock'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: '#FACC15', bg: '#2E2100' },
  published: { label: 'Publicada', color: '#AEEA00', bg: '#1A2E00' },
  archived: { label: 'Arquivada', color: '#888888', bg: '#222222' },
}

export default function MentoriasPage() {
  const [school, setSchool] = useState<any>(null)
  const [mentorias, setMentorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [schoolData, mentoriasData] = await Promise.all([
      getMySchool(),
      getMyMentorships(),
    ])
    setSchool(schoolData)
    setMentorias(mentoriasData)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Tem certeza que quer excluir "${title}"? As turmas e inscrições relacionadas também serão removidas.`)) return
    await deleteMentorship(id)
    load()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando...</p>
      </div>
    )
  }

  if (!school?.mentor_module) {
    return <MentorModuleLock />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Mentorias</h1>
          <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
            {mentorias.length} mentoria{mentorias.length !== 1 ? 's' : ''} criada{mentorias.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/mentorias/novo" style={{
          backgroundColor: '#7C4DFF', color: '#fff', fontWeight: '700',
          fontSize: '14px', padding: '10px 20px', borderRadius: '8px',
          textDecoration: 'none',
        }}>
          + Nova Mentoria
        </Link>
      </div>

      {mentorias.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '200px', border: '2px dashed #2A2A2A', borderRadius: '12px',
        }}>
          <p style={{ color: '#888888', fontWeight: '500', margin: 0 }}>Nenhuma mentoria criada ainda</p>
          <p style={{ color: '#555555', fontSize: '13px', marginTop: '4px' }}>Clique em "Nova Mentoria" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {mentorias.map((m) => {
            const status = STATUS_LABEL[m.status] ?? STATUS_LABEL.draft
            return (
              <div key={m.id} style={{
                backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px',
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: 0, lineHeight: '1.3' }}>{m.title}</h3>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                    color: status.color, backgroundColor: status.bg, whiteSpace: 'nowrap',
                  }}>
                    {status.label}
                  </span>
                </div>
                <p style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>
                  {Number(m.price) > 0 ? `R$ ${Number(m.price).toFixed(2)}` : 'Gratuita'}
                </p>
                <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #2A2A2A' }}>
                  <Link href={`/dashboard/mentorias/${m.id}`} style={{
                    flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px',
                    backgroundColor: '#222222', color: '#CCCCCC', fontSize: '13px',
                    textDecoration: 'none', fontWeight: '500',
                  }}>
                    Editar
                  </Link>
                  <button onClick={() => handleDelete(m.id, m.title)} style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #3A1A1A',
                    backgroundColor: 'transparent', color: '#FF5555', fontSize: '13px', cursor: 'pointer',
                  }}>
                    Excluir
                  </button>
                  {m.status === 'published' && (
                    <Link href={`/dashboard/mentorias/${m.id}/ministrar`} style={{
                      padding: '8px 14px', borderRadius: '8px',
                      backgroundColor: '#7C4DFF', color: '#fff', fontSize: '13px',
                      textDecoration: 'none', fontWeight: '600', whiteSpace: 'nowrap',
                    }}>
                      Ministrar
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
