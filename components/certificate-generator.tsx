'use client'

import { useState } from 'react'
import { issueCertificate } from '@/app/actions/certificate-actions'
import { Award, Download } from 'lucide-react'

type Props = {
  courseId: string
  courseTitle: string
  studentName: string
  schoolName: string
  existingCode?: string
}

async function generatePDF(
  courseTitle: string,
  studentName: string,
  schoolName: string,
  code: string
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, h, 'F')

  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(2)
  doc.rect(10, 10, w - 20, h - 20, 'S')
  doc.setLineWidth(0.5)
  doc.rect(13, 13, w - 26, h - 26, 'S')

  doc.setTextColor(34, 197, 94)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(schoolName.toUpperCase(), w / 2, 35, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.text('CERTIFICADO DE CONCLUSÃO', w / 2, 55, { align: 'center' })

  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(0.5)
  doc.line(40, 62, w - 40, 62)

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text('Certificamos que', w / 2, 80, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text(studentName || 'Aluno', w / 2, 100, { align: 'center' })

  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.3)
  doc.line(60, 105, w - 60, 105)

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text('concluiu com êxito o curso', w / 2, 118, { align: 'center' })

  doc.setTextColor(34, 197, 94)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(courseTitle, w / 2, 133, { align: 'center' })

  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Emitido em ${date}`, w / 2, 160, { align: 'center' })
  doc.text(`Código de verificação: ${code}`, w / 2, 167, { align: 'center' })

  doc.save(`certificado-${courseTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

export function CertificateGenerator({
  courseId,
  courseTitle,
  studentName,
  schoolName,
  existingCode,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleClick() {
    setLoading(true)
    setMessage('')

    if (existingCode) {
      await generatePDF(courseTitle, studentName, schoolName, existingCode)
      setMessage('✅ Certificado baixado!')
      setLoading(false)
      return
    }

    const result = await issueCertificate(courseId)

    if (result?.error) {
      setMessage(`Erro: ${result.error}`)
      setLoading(false)
      return
    }

    await generatePDF(courseTitle, studentName, schoolName, result.code!)
    setMessage(result.already ? '✅ Certificado baixado!' : '✅ Certificado gerado!')
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '10px', border: 'none',
          backgroundColor: existingCode ? '#1A2E00' : '#AEEA00',
          color: existingCode ? '#AEEA00' : '#0D0D0D',
          fontWeight: '700', fontSize: '13px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontFamily: 'inherit',
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? (
          'Aguarde...'
        ) : existingCode ? (
          <><Download size={14} /> Baixar Certificado</>
        ) : (
          <><Award size={14} /> Gerar Certificado</>
        )}
      </button>
      {message && (
        <p style={{
          fontSize: '12px',
          color: message.startsWith('Erro') ? '#FF5555' : '#AEEA00',
          margin: 0,
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
