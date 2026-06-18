'use client'

import { useEffect, useState } from 'react'
import { getCoursesWithProgress } from '@/app/actions/certificate-actions'
import { getMyProfileFull } from '@/app/actions/profile-actions'
import { CertificateGenerator } from '@/components/certificate-generator'
import { Award } from 'lucide-react'

type CourseProgress = {
  enrollmentId: string
  courseId: string
  courseTitle: string
  schoolName: string
  totalLessons: number
  completedLessons: number
  isComplete: boolean
  certificate: { id: string; unique_code: string; issued_at: string } | null
}

export function CertificadosAluno() {
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [studentName, setStudentName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [data, profile] = await Promise.all([
        getCoursesWithProgress(),
        getMyProfileFull(),
      ])
      setCourses(data as CourseProgress[])
      setStudentName(profile?.full_name || profile?.email || '')
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando certificados...</p>
      </div>
    )
  }

  const concluidos = courses.filter(c => c.isComplete)
  const emAndamento = courses.filter(c => !c.isComplete)

  if (courses.length === 0) {
    return (
      <div style={{ maxWidth: '640px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', marginBottom: '8px' }}>Certificados</h1>
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <Award size={40} style={{ color: '#333', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>Você ainda não está matriculado em nenhum curso.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Certificados</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          Gere e baixe seus certificados de conclusão
        </p>
      </div>

      {/* Cursos concluídos */}
      {concluidos.length > 0 && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#AEEA00', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
            ✅ Cursos Concluídos ({concluidos.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {concluidos.map(c => (
              <div
                key={c.enrollmentId}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.courseTitle}
                  </p>
                  <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>
                    {c.schoolName}
                    {c.certificate && (
                      <> · emitido em {new Date(c.certificate.issued_at).toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                  {c.certificate && (
                    <p style={{ color: '#333333', fontSize: '11px', fontFamily: 'monospace', margin: '4px 0 0' }}>
                      {c.certificate.unique_code}
                    </p>
                  )}
                </div>
                <CertificateGenerator
                  courseId={c.courseId}
                  courseTitle={c.courseTitle}
                  studentName={studentName}
                  schoolName={c.schoolName}
                  existingCode={c.certificate?.unique_code}
                  issuedAt={c.certificate?.issued_at}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cursos em andamento */}
      {emAndamento.length > 0 && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
            📚 Em Andamento ({emAndamento.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {emAndamento.map(c => {
              const pct = c.totalLessons > 0
                ? Math.round((c.completedLessons / c.totalLessons) * 100)
                : 0

              return (
                <div
                  key={c.enrollmentId}
                  style={{
                    backgroundColor: '#111111',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    padding: '20px 24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: '0 0 2px' }}>
                        {c.courseTitle}
                      </p>
                      <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>{c.schoolName}</p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#666666', flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{ height: '6px', backgroundColor: '#1A1A1A', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: '#AEEA00',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>

                  <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>
                    {c.completedLessons} de {c.totalLessons} aula{c.totalLessons !== 1 ? 's' : ''} concluída{c.totalLessons !== 1 ? 's' : ''} · Conclua todas as aulas para liberar seu certificado
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
