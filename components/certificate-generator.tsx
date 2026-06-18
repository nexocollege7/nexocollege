'use client'

import { useState } from 'react'
import { issueCertificate } from '@/app/actions/certificate-actions'
import { gerarCertificadoPDF } from '@/lib/certificate-pdf'
import { Award, Download } from 'lucide-react'

type Props = {
  courseId: string
  courseTitle: string
  studentName: string
  schoolName: string
  existingCode?: string
  issuedAt?: string
}

export function CertificateGenerator({
  courseId,
  courseTitle,
  studentName,
  schoolName,
  existingCode,
  issuedAt,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleClick() {
    setLoading(true)
    setMessage('')

    if (existingCode) {
      await gerarCertificadoPDF({
        studentName, courseTitle, schoolName,
        code: existingCode,
        issuedAt: issuedAt ?? new Date().toISOString(),
      })
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

    await gerarCertificadoPDF({
      studentName, courseTitle, schoolName,
      code: result.code!,
      issuedAt: new Date().toISOString(),
    })
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
