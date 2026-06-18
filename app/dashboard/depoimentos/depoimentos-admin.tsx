'use client'

import { useEffect, useState } from 'react'
import { getReviewsGestao, toggleReviewActive } from '@/app/actions/review-actions'

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

export function DepoimentosAdmin() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof getReviewsGestao>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null)

  useEffect(() => {
    getReviewsGestao().then((d) => {
      setDados(d)
      setLoading(false)
    })
  }, [])

  async function handleToggle(id: string, isActive: boolean) {
    setAtualizandoId(id)
    const result = await toggleReviewActive(id, !isActive)
    if (!result?.error) {
      setDados((prev) => prev && {
        ...prev,
        linhas: prev.linhas.map((l) => l.id === id ? { ...l, isActive: !isActive } : l),
      })
    }
    setAtualizandoId(null)
  }

  if (loading || !dados) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando depoimentos...</p>
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
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Depoimentos</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {dados.total} depoimento{dados.total !== 1 ? 's' : ''} recebido{dados.total !== 1 ? 's' : ''} · ative ou desative o que aparece na vitrine
        </p>
      </div>

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

      {linhasFiltradas.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#444444', fontSize: '14px', margin: 0 }}>
            {dados.linhas.length === 0 ? 'Nenhum depoimento recebido ainda.' : 'Nenhum resultado para a busca.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #2A2A2A', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#111111', borderBottom: '1px solid #2A2A2A' }}>
                {['Aluno', 'Curso', 'Depoimento', 'Data', 'Status', 'Ações'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#555555', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: '#1A2E00', color: '#AEEA00', fontSize: '12px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      }}>
                        {l.studentAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.studentAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : getInitials(l.studentName)}
                      </div>
                      <span style={{ color: '#F0F0F0', fontWeight: '600', whiteSpace: 'nowrap' }}>{l.studentName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#CCCCCC', whiteSpace: 'nowrap' }}>{l.courseTitle}</td>
                  <td style={{ padding: '12px 16px', color: '#888888', maxWidth: '320px' }}>{l.content}</td>
                  <td style={{ padding: '12px 16px', color: '#888888', whiteSpace: 'nowrap' }}>
                    {new Date(l.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      backgroundColor: l.isActive ? 'rgba(174,234,0,0.1)' : 'rgba(255,68,68,0.1)',
                      color: l.isActive ? '#AEEA00' : '#FF4444',
                    }}>
                      {l.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleToggle(l.id, l.isActive)}
                      disabled={atualizandoId === l.id}
                      style={{
                        padding: '6px 14px', borderRadius: '6px',
                        border: `1px solid ${l.isActive ? 'rgba(255,68,68,0.4)' : 'rgba(174,234,0,0.4)'}`,
                        backgroundColor: l.isActive ? 'rgba(255,68,68,0.08)' : 'rgba(174,234,0,0.08)',
                        color: l.isActive ? '#FF4444' : '#AEEA00',
                        fontSize: '12px', fontWeight: '700',
                        cursor: atualizandoId === l.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        opacity: atualizandoId === l.id ? 0.6 : 1,
                      }}
                    >
                      {atualizandoId === l.id ? '...' : l.isActive ? 'Desativar' : 'Ativar'}
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
