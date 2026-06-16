'use client'

import { useEffect, useState } from 'react'
import { getEnrollments, getSchoolStudents, revokeEnrollment, liberarCurso } from '@/app/actions/matricula-actions'
import { getMyCourses } from '@/app/actions/course-actions'
import { getStudentLgpdData } from '@/app/actions/legal-actions'

type Student = {
  id: string
  full_name: string | null
  created_at: string
}

type StudentDetails = {
  id: string
  full_name: string
  email: string
  created_at: string
  enrollments: any[]
  acceptances: any[]
}

const DOC_TYPE_LABELS: Record<string, string> = {
  terms_of_use: 'Termos de Uso',
  privacy_policy: 'Política de Privacidade',
  cookie_policy: 'Política de Cookies',
}

async function generateLgpdPdf(details: StudentDetails, schoolName: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()

  doc.setFillColor(13, 13, 13)
  doc.rect(0, 0, w, 297, 'F')

  doc.setTextColor(174, 234, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(schoolName.toUpperCase(), w / 2, 20, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('COMPROVANTE DE ACEITE LGPD', w / 2, 32, { align: 'center' })

  doc.setDrawColor(174, 234, 0)
  doc.setLineWidth(0.5)
  doc.line(20, 37, w - 20, 37)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(200, 200, 200)
  doc.text('Dados do Titular', 20, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(170, 170, 170)
  doc.text(`Nome: ${details.full_name}`, 20, 57)
  doc.text(`Email: ${details.email}`, 20, 64)
  doc.text(`Cadastro: ${new Date(details.created_at).toLocaleString('pt-BR')}`, 20, 71)

  doc.setDrawColor(50, 50, 50)
  doc.setLineWidth(0.3)
  doc.line(20, 76, w - 20, 76)

  let y = 86
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(200, 200, 200)
  doc.text('Documentos Aceitos', 20, y)
  y += 10

  if (details.acceptances.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Nenhum aceite registrado.', 20, y)
  }

  details.acceptances.forEach((acc: any) => {
    const docInfo = acc.legal_documents as any
    const label = DOC_TYPE_LABELS[docInfo?.type] ?? docInfo?.title ?? 'Documento'
    const version = docInfo?.version ? `v${docInfo.version}` : ''
    const timestamp = new Date(acc.accepted_at).toLocaleString('pt-BR')

    doc.setFillColor(20, 20, 20)
    doc.roundedRect(20, y, w - 40, 26, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(174, 234, 0)
    doc.text(`${label} ${version}`, 26, y + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text(`Aceito em: ${timestamp}`, 26, y + 15)

    if (acc.ip_address) {
      doc.text(`IP: ${acc.ip_address}`, 26, y + 21)
    }

    y += 32

    if (y > 260) {
      doc.addPage()
      doc.setFillColor(13, 13, 13)
      doc.rect(0, 0, w, 297, 'F')
      y = 20
    }
  })

  y += 8
  doc.setDrawColor(50, 50, 50)
  doc.line(20, y, w - 20, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} · NexoCollege LGPD v1.0 · Validade jurídica conforme Lei nº 13.709/2018.`,
    w / 2, y, { align: 'center', maxWidth: w - 40 }
  )

  doc.save(`lgpd-${details.full_name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

function StudentModal({
  studentId,
  schoolName,
  courses,
  onClose,
  onUpdated,
}: {
  studentId: string
  schoolName: string
  courses: any[]
  onClose: () => void
  onUpdated: () => void
}) {
  const [details, setDetails] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id ?? '')
  const [liberarMsg, setLiberarMsg] = useState('')
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function reload() {
    const d = await getStudentLgpdData(studentId)
    setDetails(d as StudentDetails)
    setLoading(false)
  }

  useEffect(() => { reload() }, [studentId])

  async function handleDownloadPdf() {
    if (!details) return
    setGeneratingPdf(true)
    await generateLgpdPdf(details, schoolName)
    setGeneratingPdf(false)
  }

  async function handleLiberarCurso() {
    if (!selectedCourse) return
    setLiberando(true)
    setLiberarMsg('')
    const result = await liberarCurso(studentId, selectedCourse)
    if (result?.error) {
      setLiberarMsg('Erro: ' + result.error)
    } else {
      setLiberarMsg('Curso liberado com sucesso!')
      await reload()
      onUpdated()
    }
    setLiberando(false)
  }

  async function handleRevoke(enrollmentId: string) {
    if (!confirm('Revogar acesso deste aluno neste curso?')) return
    setRevokingId(enrollmentId)
    await revokeEnrollment(enrollmentId)
    await reload()
    onUpdated()
    setRevokingId(null)
  }

  const activeEnrollmentCourseIds = new Set(
    details?.enrollments.filter(e => e.status === 'active').map((e: any) => e.course_id) ?? []
  )
  const availableCourses = courses.filter(c => !activeEnrollmentCourseIds.has(c.id))

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2A2A2A', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2A2A2A' }}>
          <div>
            <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>
              {loading ? 'Carregando...' : details?.full_name || 'Aluno'}
            </h2>
            {!loading && details?.email && (
              <p style={{ color: '#555555', fontSize: '12px', margin: '2px 0 0' }}>{details.email}</p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {loading ? (
            <p style={{ color: '#555555', textAlign: 'center', padding: '32px 0' }}>Carregando...</p>
          ) : !details ? (
            <p style={{ color: '#FF5555', textAlign: 'center', padding: '32px 0' }}>Erro ao carregar dados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Dados pessoais */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>Dados Pessoais</p>
                <div style={{ backgroundColor: '#111111', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#555555', fontSize: '13px', minWidth: '90px' }}>Cadastro</span>
                    <span style={{ color: '#CCCCCC', fontSize: '13px' }}>{new Date(details.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#555555', fontSize: '13px', minWidth: '90px' }}>Escola</span>
                    <span style={{ color: '#CCCCCC', fontSize: '13px' }}>{schoolName}</span>
                  </div>
                </div>
              </div>

              {/* Cursos ativos + revogar */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                  Cursos Matriculados ({details.enrollments.filter(e => e.status === 'active').length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {details.enrollments.filter(e => e.status === 'active').length === 0 ? (
                    <p style={{ color: '#444444', fontSize: '13px', margin: 0 }}>Nenhum curso liberado ainda.</p>
                  ) : (
                    details.enrollments.filter(e => e.status === 'active').map((enr: any) => (
                      <div key={enr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111111', borderRadius: '8px', padding: '10px 14px' }}>
                        <div>
                          <span style={{ color: '#CCCCCC', fontSize: '13px' }}>{(enr.courses as any)?.title ?? '—'}</span>
                          {enr.payment_status === 'manual' && (
                            <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '10px', color: '#7C4DFF', backgroundColor: 'rgba(124,77,255,0.1)', padding: '1px 6px', borderRadius: '10px' }}>
                              Manual
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRevoke(enr.id)}
                          disabled={revokingId === enr.id}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,85,85,0.3)', backgroundColor: 'transparent', color: '#FF5555', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {revokingId === enr.id ? '...' : 'Revogar'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Liberar Curso */}
              {availableCourses.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>Liberar Curso</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#111111', color: '#F0F0F0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                    >
                      {availableCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleLiberarCurso}
                      disabled={liberando || !selectedCourse}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#7C4DFF', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: liberando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: liberando ? 0.7 : 1, whiteSpace: 'nowrap' }}
                    >
                      {liberando ? 'Liberando...' : '+ Liberar'}
                    </button>
                  </div>
                  {liberarMsg && (
                    <p style={{ fontSize: '12px', color: liberarMsg.startsWith('Erro') ? '#FF5555' : '#AEEA00', margin: '8px 0 0' }}>
                      {liberarMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Aceites LGPD */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                  Aceites LGPD ({details.acceptances.length})
                </p>
                {details.acceptances.length === 0 ? (
                  <p style={{ color: '#444444', fontSize: '13px', margin: 0 }}>Nenhum aceite registrado.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {details.acceptances.map((acc: any) => {
                      const docInfo = acc.legal_documents as any
                      return (
                        <div key={acc.id} style={{ backgroundColor: '#111111', borderRadius: '8px', padding: '10px 14px' }}>
                          <p style={{ color: '#AEEA00', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>
                            {DOC_TYPE_LABELS[docInfo?.type] ?? docInfo?.title} {docInfo?.version ? `v${docInfo.version}` : ''}
                          </p>
                          <p style={{ color: '#555555', fontSize: '11px', margin: 0 }}>
                            {new Date(acc.accepted_at).toLocaleString('pt-BR')}
                            {acc.ip_address ? ` · IP: ${acc.ip_address}` : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#888888', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Fechar
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf || !details}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#1A2E00', color: '#AEEA00', fontWeight: '700', fontSize: '13px',
              cursor: (generatingPdf || !details) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: (generatingPdf || !details) ? 0.7 : 1,
            }}
          >
            {generatingPdf ? 'Gerando...' : '📥 Baixar Termos Assinados'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')

  async function load() {
    const [s, e, c] = await Promise.all([getSchoolStudents(), getEnrollments(), getMyCourses()])
    setStudents(s as Student[])
    setEnrollments(e)
    setCourses(c)
    setLoading(false)
  }

  useEffect(() => {
    load()
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase.from('schools').select('name').eq('owner_id', user.id).single().then(({ data }) => {
          if (data?.name) setSchoolName(data.name)
        })
      })
    })
  }, [])

  function getEnrollmentsForStudent(studentId: string) {
    return enrollments.filter(e => e.student_id === studentId && e.status === 'active')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando alunos...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {selectedStudentId && (
        <StudentModal
          studentId={selectedStudentId}
          schoolName={schoolName}
          courses={courses}
          onClose={() => setSelectedStudentId(null)}
          onUpdated={load}
        />
      )}

      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Alunos</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''} · Clique para ver detalhes e liberar cursos
        </p>
      </div>

      {students.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#444444', fontSize: '14px', margin: 0 }}>
            Nenhum aluno cadastrado ainda. Compartilhe o link da vitrine para receber alunos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {students.map((student) => {
            const inscricoes = getEnrollmentsForStudent(student.id)
            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '10px',
                  padding: '14px 16px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#444444')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
              >
                <div>
                  <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
                    {student.full_name || 'Sem nome'}
                  </p>
                  <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>
                    Cadastrado em {new Date(student.created_at).toLocaleDateString('pt-BR')}
                    {inscricoes.length > 0 && ` · ${inscricoes.map((e: any) => (e.courses as any)?.title).join(', ')}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '12px', color: '#AEEA00',
                    backgroundColor: 'rgba(174,234,0,0.1)',
                    padding: '4px 10px', borderRadius: '20px', fontWeight: '600',
                  }}>
                    {inscricoes.length} curso{inscricoes.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ color: '#333333', fontSize: '16px' }}>›</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
