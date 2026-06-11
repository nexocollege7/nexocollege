'use client'

import { useState } from 'react'
import { issueCertificate } from '@/app/actions/certificate-actions'
import { Award, Download } from 'lucide-react'

type Props = {
  courseId: string
  courseTitle: string
  studentName: string
  schoolName: string
}

export function CertificateGenerator({ courseId, courseTitle, studentName, schoolName }: Props) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setMessage('')

    const result = await issueCertificate(courseId)

    if (result?.error) {
      setMessage(`Erro: ${result.error}`)
      setLoading(false)
      return
    }

    setCode(result.code)

    // Gerar PDF com jsPDF
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()

    // Fundo
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, w, h, 'F')

    // Borda decorativa
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(2)
    doc.rect(10, 10, w - 20, h - 20, 'S')
    doc.setLineWidth(0.5)
    doc.rect(13, 13, w - 26, h - 26, 'S')

    // Título
    doc.setTextColor(34, 197, 94)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), w / 2, 35, { align: 'center' })

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.text('CERTIFICADO DE CONCLUSÃO', w / 2, 55, { align: 'center' })

    // Linha divisória
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(0.5)
    doc.line(40, 62, w - 40, 62)

    // Texto principal
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.text('Certificamos que', w / 2, 80, { align: 'center' })

    // Nome do aluno
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(studentName || 'Aluno', w / 2, 100, { align: 'center' })

    // Linha sob o nome
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.line(60, 105, w - 60, 105)

    // Texto do curso
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.text('concluiu com êxito o curso', w / 2, 118, { align: 'center' })

    doc.setTextColor(34, 197, 94)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(courseTitle, w / 2, 133, { align: 'center' })

    // Data e código
    const date = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric'
    })

    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Emitido em ${date}`, w / 2, 160, { align: 'center' })
    doc.text(`Código de verificação: ${result.code}`, w / 2, 167, { align: 'center' })

    doc.save(`certificado-${courseTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`)

    setMessage(result.already ? '✅ Certificado já emitido — baixando novamente!' : '✅ Certificado gerado e baixado!')
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors text-sm"
      >
        {loading ? (
          <>Gerando...</>
        ) : (
          <>
            <Award className="w-4 h-4" />
            Gerar Certificado
          </>
        )}
      </button>

      {message && (
        <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}

      {code && (
        <p className="text-xs text-gray-500 font-mono">
          Código: {code}
        </p>
      )}
    </div>
  )
}
