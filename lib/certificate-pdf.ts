export type CertificadoPDFParams = {
  studentName: string
  courseTitle: string
  schoolName: string
  code: string
  issuedAt: string
}

export async function gerarCertificadoPDF({
  studentName,
  courseTitle,
  schoolName,
  code,
  issuedAt,
}: CertificadoPDFParams) {
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

  const date = new Date(issuedAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Emitido em ${date}`, w / 2, 160, { align: 'center' })
  doc.text(`Código de verificação: ${code}`, w / 2, 167, { align: 'center' })

  doc.save(`certificado-${courseTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}
