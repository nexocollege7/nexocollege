'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  getAlunosGestao,
  liberarCurso,
  deletarMatriculaManual,
  getCursosEscola,
  estenderAcesso,
} from '@/app/actions/matricula-actions'
import { getStudentLgpdData } from '@/app/actions/legal-actions'
import { corDiasRestantes } from '@/lib/enrollment'

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
  onClose,
  onUpdated,
}: {
  studentId: string
  schoolName: string
  onClose: () => void
  onUpdated: () => void
}) {
  const [details, setDetails] = useState<StudentDetails | null>(null)
  const [modalCourses, setModalCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [actioningCourseId, setActioningCourseId] = useState<string | null>(null)
  const [courseMsg, setCourseMsg] = useState('')

  async function reload() {
    const [d, c] = await Promise.all([
      getStudentLgpdData(studentId),
      getCursosEscola(),
    ])
    setDetails(d as StudentDetails)
    setModalCourses(c as any[])
    setLoading(false)
  }

  useEffect(() => { reload() }, [studentId])

  async function handleDownloadPdf() {
    if (!details) return
    setGeneratingPdf(true)
    await generateLgpdPdf(details, schoolName)
    setGeneratingPdf(false)
  }

  async function handleLiberarCurso(courseId: string) {
    setActioningCourseId(courseId)
    setCourseMsg('')
    const result = await liberarCurso(studentId, courseId)
    if (result?.error) {
      setCourseMsg('Erro: ' + result.error)
    } else {
      await reload()
      onUpdated()
    }
    setActioningCourseId(null)
  }

  async function handleRevogar(enrollmentId: string) {
    if (!confirm('Revogar acesso manual deste aluno neste curso?')) return
    setActioningCourseId(enrollmentId)
    setCourseMsg('')
    const result = await deletarMatriculaManual(enrollmentId)
    if (result?.error) {
      setCourseMsg('Erro: ' + result.error)
    } else {
      await reload()
      onUpdated()
    }
    setActioningCourseId(null)
  }

  const activeEnrollmentMap = new Map<string, any>(
    (details?.enrollments.filter(e => e.status === 'active') ?? []).map((e: any) => [e.course_id, e])
  )

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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Dados pessoais */}
              {details && (
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
              )}

              {/* Cursos da escola — liberar / revogar / pago */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                  Cursos ({modalCourses.length})
                </p>
                {modalCourses.length === 0 ? (
                  <p style={{ color: '#444444', fontSize: '13px', margin: 0 }}>Nenhum curso criado ainda.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {modalCourses.map((course: any) => {
                      const enr = activeEnrollmentMap.get(course.id)
                      // 'paid' = pago via MP; 'manual' ou null = liberado pelo admin (revogável)
                      const isPaid = enr?.payment_status === 'paid'
                      const isActioning = actioningCourseId === course.id || actioningCourseId === enr?.id
                      return (
                        <div key={course.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111111', borderRadius: '8px', padding: '10px 14px', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ color: '#CCCCCC', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {course.title}
                            </span>
                            {enr && !isPaid && (
                              <span style={{ flexShrink: 0, fontSize: '10px', color: '#7C4DFF', backgroundColor: 'rgba(124,77,255,0.1)', padding: '1px 6px', borderRadius: '10px' }}>Manual</span>
                            )}
                            {enr && isPaid && (
                              <span style={{ flexShrink: 0, fontSize: '10px', color: '#00B8D4', backgroundColor: 'rgba(0,184,212,0.1)', padding: '1px 6px', borderRadius: '10px' }}>Pago</span>
                            )}
                          </div>
                          {!enr ? (
                            <button
                              onClick={() => handleLiberarCurso(course.id)}
                              disabled={isActioning}
                              style={{ flexShrink: 0, padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(0,200,83,0.4)', backgroundColor: 'rgba(0,200,83,0.08)', color: '#00C853', fontSize: '11px', fontWeight: '700', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isActioning ? 0.6 : 1, whiteSpace: 'nowrap' }}
                            >
                              {isActioning ? '...' : '+ Liberar'}
                            </button>
                          ) : !isPaid ? (
                            <button
                              onClick={() => handleRevogar(enr.id)}
                              disabled={isActioning}
                              style={{ flexShrink: 0, padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(255,85,85,0.3)', backgroundColor: 'transparent', color: '#FF5555', fontSize: '11px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isActioning ? 0.6 : 1, whiteSpace: 'nowrap' }}
                            >
                              {isActioning ? '...' : 'Revogar acesso'}
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
                {courseMsg && (
                  <p style={{ fontSize: '12px', color: courseMsg.startsWith('Erro') ? '#FF5555' : '#AEEA00', margin: '8px 0 0' }}>
                    {courseMsg}
                  </p>
                )}
              </div>

              {/* Aceites LGPD */}
              {details && (
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
              )}

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

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return email ? email[0].toUpperCase() : '?'
}

export default function AlunosPage() {
  const [dados, setDados] = useState<{ totalAlunos: number; totalAtivos: number; cursos: any[]; linhas: any[] }>({
    totalAlunos: 0, totalAtivos: 0, cursos: [], linhas: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroCurso, setFiltroCurso] = useState('')
  const [estendendoId, setEstendendoId] = useState<string | null>(null)

  async function load() {
    const d = await getAlunosGestao()
    setDados(d)
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

  async function handleEstender(enrollmentId: string) {
    const input = prompt('Estender o acesso em quantos dias?', '30')
    if (!input) return
    const dias = parseInt(input, 10)
    if (!dias || dias <= 0) return
    setEstendendoId(enrollmentId)
    await estenderAcesso(enrollmentId, dias)
    await load()
    setEstendendoId(null)
  }

  const linhasFiltradas = dados.linhas.filter((l) => {
    if (filtroCurso && l.courseId !== filtroCurso) return false
    if (busca) {
      const termo = busca.toLowerCase()
      const nome = (l.fullName || '').toLowerCase()
      const email = (l.email || '').toLowerCase()
      if (!nome.includes(termo) && !email.includes(termo)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando alunos...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {selectedStudentId && (
        <StudentModal
          studentId={selectedStudentId}
          schoolName={schoolName}
          onClose={() => setSelectedStudentId(null)}
          onUpdated={load}
        />
      )}

      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Alunos</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          Gerencie matrículas, acesso e progresso dos alunos da sua escola
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '16px 20px' }}>
          <p style={{ color: '#555555', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total de alunos</p>
          <p style={{ color: '#F0F0F0', fontSize: '28px', fontWeight: '700', margin: 0 }}>{dados.totalAlunos}</p>
        </div>
        <div style={{ flex: '1 1 200px', backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '16px 20px' }}>
          <p style={{ color: '#555555', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alunos ativos</p>
          <p style={{ color: '#AEEA00', fontSize: '28px', fontWeight: '700', margin: 0 }}>{dados.totalAtivos}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            flex: '1 1 240px', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #2A2A2A', backgroundColor: '#111111', color: '#F0F0F0',
            fontSize: '13px', fontFamily: 'inherit', outline: 'none',
          }}
        />
        <select
          value={filtroCurso}
          onChange={(e) => setFiltroCurso(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #2A2A2A', backgroundColor: '#111111', color: '#F0F0F0',
            fontSize: '13px', fontFamily: 'inherit', outline: 'none', minWidth: '200px',
          }}
        >
          <option value="">Todos os cursos</option>
          {dados.cursos.map((c: any) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {linhasFiltradas.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#444444', fontSize: '14px', margin: 0 }}>
            {dados.linhas.length === 0 ? 'Nenhum aluno matriculado ainda.' : 'Nenhum resultado para o filtro/busca aplicado.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #2A2A2A', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#111111', borderBottom: '1px solid #2A2A2A' }}>
                {['Aluno', 'Email', 'Curso', 'Matrícula', 'Progresso', 'Dias restantes', 'Status', 'Ações'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#555555', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((l: any) => (
                <tr key={l.enrollmentId} style={{ borderBottom: '1px solid #1A1A1A' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => setSelectedStudentId(l.studentId)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: '#1A2E00', color: '#AEEA00', fontSize: '12px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      }}>
                        {l.avatarUrl ? (
                          <Image src={l.avatarUrl} alt="" width={32} height={32} style={{ objectFit: 'cover' }} />
                        ) : getInitials(l.fullName, l.email)}
                      </div>
                      <span style={{ color: '#F0F0F0', fontWeight: '600', whiteSpace: 'nowrap' }}>{l.fullName || 'Sem nome'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#888888', whiteSpace: 'nowrap' }}>{l.email}</td>
                  <td style={{ padding: '12px 16px', color: '#CCCCCC', whiteSpace: 'nowrap' }}>{l.courseTitle}</td>
                  <td style={{ padding: '12px 16px', color: '#888888', whiteSpace: 'nowrap' }}>
                    {new Date(l.enrolledAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', backgroundColor: '#2A2A2A', borderRadius: '2px' }}>
                        <div style={{ height: '4px', backgroundColor: '#AEEA00', borderRadius: '2px', width: `${l.progresso}%` }} />
                      </div>
                      <span style={{ color: '#888888', fontSize: '11px', whiteSpace: 'nowrap' }}>{l.progresso}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: corDiasRestantes(l.dias), fontWeight: '600' }}>
                      {l.dias === null ? 'Vitalício' : l.expirado ? 'Expirado' : `${l.dias} dia${l.dias !== 1 ? 's' : ''}`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                      color: l.expirado ? '#FF4444' : '#AEEA00',
                      backgroundColor: l.expirado ? 'rgba(255,68,68,0.1)' : 'rgba(174,234,0,0.1)',
                    }}>
                      {l.expirado ? 'Expirado' : 'Ativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleEstender(l.enrollmentId)}
                      disabled={estendendoId === l.enrollmentId}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(124,77,255,0.4)',
                        backgroundColor: 'rgba(124,77,255,0.08)', color: '#7C4DFF', fontSize: '11px', fontWeight: '700',
                        cursor: estendendoId === l.enrollmentId ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        opacity: estendendoId === l.enrollmentId ? 0.6 : 1,
                      }}
                    >
                      {estendendoId === l.enrollmentId ? '...' : 'Estender'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
