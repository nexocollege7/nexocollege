'use client'

import { useEffect, useState } from 'react'
import { getMeuscursos } from '@/app/actions/aluno-actions'
import Link from 'next/link'

export default function MeusCursosPage() {
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getMeuscursos()
      setCursos(data || [])
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {cursos.map((matricula: any) => {
            const curso = matricula.courses
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
                  backgroundColor: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                }}>
                  📖
                </div>
                {/* Conteúdo */}
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    NexoCollege Demo
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#F0F0F0', margin: '0 0 4px' }}>
                    {curso?.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 16px' }}>
                    {curso?.description}
                  </p>
                  {/* Barra de progresso */}
                  <div style={{
                    height: '4px',
                    backgroundColor: '#2A2A2A',
                    borderRadius: '2px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      height: '4px',
                      backgroundColor: '#AEEA00',
                      borderRadius: '2px',
                      width: '0%',
                    }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#555555' }}>0 aulas</span>
                    <Link href={`/dashboard/aprender/${curso?.id}`} style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#AEEA00',
                      textDecoration: 'none',
                    }}>
                      Continuar →
                    </Link>
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