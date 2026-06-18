'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getMeuscursos, getLessonProgress } from '@/app/actions/aluno-actions'
import Link from 'next/link'
import { diasRestantes, corDiasRestantes } from '@/lib/enrollment'

export default function MeusCursosPage() {
  const [cursos, setCursos] = useState<any[]>([])
  const [progressos, setProgressos] = useState<{ [courseId: string]: number }>({})
  const [myId, setMyId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [data, me] = await Promise.all([
        getMeuscursos(),
        fetch('/api/me').then(r => r.json()),
      ])
      setCursos(data || [])
      setMyId(me.id || '')

      // Busca progresso de cada curso
      const prog: { [courseId: string]: number } = {}
      for (const matricula of (data || [])) {
        const courseId = (matricula as any).courses?.id
        if (!courseId) continue
        const progress = await getLessonProgress(me.id, courseId)
        const concluidas = progress.filter((p: any) => p.is_completed).length
        prog[courseId] = concluidas
      }
      setProgressos(prog)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando seus cursos...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Meus Cursos</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
          {cursos.length} curso{cursos.length !== 1 ? 's' : ''} matriculado{cursos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {cursos.length === 0 ? (
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>📚</p>
          <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>
            Nenhum curso ainda
          </p>
          <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
            Explore a vitrine e matricule-se em um curso.
          </p>
        </div>
      ) : (
        <div className="meus-cursos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          <style>{`
            @media (max-width: 480px) { .meus-cursos-grid { grid-template-columns: 1fr !important; } }
          `}</style>
          {cursos.map((matricula: any) => {
            const curso = matricula.courses
            const escola = curso?.schools
            const total = curso?.total_lessons ?? 0
            const concluidas = progressos[curso?.id] ?? 0
            const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0
            const corEscola = escola?.primary_color || '#22c55e'
            const dias = diasRestantes(matricula.expires_at)
            const expirado = dias !== null && dias <= 0
            const corDias = corDiasRestantes(dias)

            return (
              <div key={matricula.id} style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                {/* Capa */}
                <div style={{
                  height: '140px',
                  backgroundColor: curso?.thumbnail_url ? '#000' : corEscola,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {curso?.thumbnail_url ? (
                    <Image src={curso.thumbnail_url} alt={curso.title} fill style={{ objectFit: 'cover' }} />
                  ) : '📖'}
                </div>

                {/* Conteúdo */}
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {escola?.name || 'NexoCollege'}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#F0F0F0', margin: '0 0 4px' }}>
                    {curso?.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 16px', lineHeight: '1.4' }}>
                    {curso?.description}
                  </p>

                  {/* Barra de progresso */}
                  <div style={{
                    height: '4px',
                    backgroundColor: '#2A2A2A',
                    borderRadius: '2px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      height: '4px',
                      backgroundColor: '#AEEA00',
                      borderRadius: '2px',
                      width: `${progresso}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>

                  {dias !== null && (
                    <p style={{ fontSize: '11px', color: corDias, fontWeight: '600', margin: '0 0 8px' }}>
                      {expirado ? '⚠ Acesso expirado' : `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#555555' }}>
                      {total === 0
                        ? 'Sem aulas ainda'
                        : `${concluidas}/${total} aulas — ${progresso}%`}
                    </span>
                    {expirado ? (
                      <Link href={escola?.slug && curso?.slug ? `/vitrine/${escola.slug}/${curso.slug}` : '/dashboard/meus-cursos'} style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#FF4444',
                        textDecoration: 'none',
                      }}>
                        Renovar acesso →
                      </Link>
                    ) : (
                      <Link href={`/dashboard/aprender/${curso?.id}`} style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#AEEA00',
                        textDecoration: 'none',
                      }}>
                        {progresso === 100 ? 'Revisar →' : progresso > 0 ? 'Continuar →' : 'Começar →'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
