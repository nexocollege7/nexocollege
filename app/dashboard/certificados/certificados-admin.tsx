'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getCertificadosGestao } from '@/app/actions/certificate-actions'
import { gerarCertificadoPDF } from '@/lib/certificate-pdf'
import { Download } from 'lucide-react'

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

export function CertificadosAdmin() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof getCertificadosGestao>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [baixandoId, setBaixandoId] = useState<string | null>(null)

  useEffect(() => {
    getCertificadosGestao().then((d) => {
      setDados(d)
      setLoading(false)
    })
  }, [])

  async function handleDownload(linha: NonNullable<typeof dados>['linhas'][number]) {
    setBaixandoId(linha.certificateId)
    await gerarCertificadoPDF({
      studentName: linha.studentName,
      courseTitle: linha.courseTitle,
      schoolName: dados?.schoolName ?? '',
      code: linha.code,
      issuedAt: linha.issuedAt,
    })
    setBaixandoId(null)
  }

  if (loading || !dados) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando certificados...</p>
      </div>
    )
  }

  const linhasFiltradas = dados.linhas.filter((l) => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return l.studentName.toLowerCase().includes(termo) || l.courseTitle.toLowerCase().includes(termo)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Certificados</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {dados.total} certificado{dados.total !== 1 ? 's' : ''} emitido{dados.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Ranking */}
      {dados.ranking.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Cursos com mais certificados emitidos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dados.ranking.map((r, i) => (
              <div key={r.courseId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#CCCCCC', fontSize: '13px' }}>{i + 1}. {r.titulo}</span>
                <span style={{ color: '#AEEA00', fontSize: '13px', fontWeight: '700' }}>{r.qtd}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar por aluno ou curso..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{
          padding: '10px 14px', borderRadius: '8px',
          border: '1px solid #2A2A2A', backgroundColor: '#111111', color: '#F0F0F0',
          fontSize: '13px', fontFamily: 'inherit', outline: 'none', maxWidth: '320px',
        }}
      />

      {/* Tabela */}
      {linhasFiltradas.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#444444', fontSize: '14px', margin: 0 }}>
            {dados.linhas.length === 0 ? 'Nenhum certificado emitido ainda.' : 'Nenhum resultado para a busca.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #2A2A2A', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#111111', borderBottom: '1px solid #2A2A2A' }}>
                {['Aluno', 'Curso', 'Data de emissão', 'Ações'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#555555', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((l) => (
                <tr key={l.certificateId} style={{ borderBottom: '1px solid #1A1A1A' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: '#1A2E00', color: '#AEEA00', fontSize: '12px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      }}>
                        {l.avatarUrl ? (
                          <Image src={l.avatarUrl} alt="" width={32} height={32} style={{ objectFit: 'cover' }} />
                        ) : getInitials(l.studentName)}
                      </div>
                      <span style={{ color: '#F0F0F0', fontWeight: '600', whiteSpace: 'nowrap' }}>{l.studentName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#CCCCCC', whiteSpace: 'nowrap' }}>{l.courseTitle}</td>
                  <td style={{ padding: '12px 16px', color: '#888888', whiteSpace: 'nowrap' }}>
                    {new Date(l.issuedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleDownload(l)}
                      disabled={baixandoId === l.certificateId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(174,234,0,0.4)',
                        backgroundColor: 'rgba(174,234,0,0.08)', color: '#AEEA00', fontSize: '12px', fontWeight: '700',
                        cursor: baixandoId === l.certificateId ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        opacity: baixandoId === l.certificateId ? 0.6 : 1,
                      }}
                    >
                      <Download size={12} />
                      {baixandoId === l.certificateId ? '...' : 'Baixar'}
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
