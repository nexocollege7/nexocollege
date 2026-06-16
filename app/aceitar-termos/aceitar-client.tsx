'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordAcceptances } from '@/app/actions/legal-actions'
import type { LegalDocument } from '@/app/actions/legal-actions'

const DOC_ICONS: Record<string, string> = {
  terms_of_use: '📄',
  privacy_policy: '🔒',
  cookie_policy: '🍪',
}

function Modal({ titulo, conteudo, onFechar }: { titulo: string; conteudo: string; onFechar: () => void }) {
  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2A2A2A', width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2A2A2A' }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>{titulo}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          <pre style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            {conteudo}
          </pre>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', textAlign: 'right' }}>
          <button onClick={onFechar} style={{ backgroundColor: '#AEEA00', color: '#0D0D0D', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            Entendi e fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export function AceitarTermosClient({ docs }: { docs: LegalDocument[] }) {
  const router = useRouter()
  const [accepted, setAccepted] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    docs.forEach(d => { init[d.id] = false })
    return init
  })
  const [modalDoc, setModalDoc] = useState<LegalDocument | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const todosAceitos = docs.every(d => accepted[d.id])

  async function handleAceitar() {
    setLoading(true)
    setError('')
    const result = await recordAcceptances(docs.map(d => d.id))
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <>
      {modalDoc && (
        <Modal titulo={modalDoc.title} conteudo={modalDoc.content} onFechar={() => setModalDoc(null)} />
      )}

      <div style={{
        minHeight: '100vh', backgroundColor: '#0D0D0D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="NexoCollege" style={{ height: '40px', mixBlendMode: 'lighten', display: 'inline-block', marginBottom: '16px' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 8px' }}>
              Documentos atualizados
            </h1>
            <p style={{ color: '#888888', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Atualizamos nossos documentos legais. Leia e aceite para continuar acessando a plataforma.
            </p>
          </div>

          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '32px', border: '1px solid #2A2A2A' }}>

            {error && (
              <div style={{ backgroundColor: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#FF5555', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <p style={{ color: '#666666', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.6' }}>
              Seus dados são protegidos conforme a LGPD (Lei nº 13.709/2018). Clique no nome de cada documento para ler o conteúdo completo antes de aceitar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {docs.map((doc) => (
                <label key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={accepted[doc.id] ?? false}
                    onChange={(e) => setAccepted(prev => ({ ...prev, [doc.id]: e.target.checked }))}
                    style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#AEEA00', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.5' }}>
                    {DOC_ICONS[doc.type] ?? '📄'}{' '}
                    Li e aceito:{' '}
                    <span
                      onClick={(e) => { e.preventDefault(); setModalDoc(doc) }}
                      style={{ color: '#AEEA00', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {doc.title}
                    </span>
                    <span style={{ color: '#555555', fontSize: '11px', marginLeft: '8px' }}>
                      v{doc.version}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleAceitar}
              disabled={loading || !todosAceitos}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
                backgroundColor: todosAceitos ? '#AEEA00' : '#333333',
                color: todosAceitos ? '#0D0D0D' : '#666666',
                fontWeight: '700', fontSize: '15px',
                cursor: loading || !todosAceitos ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Registrando...' : 'Aceitar e continuar'}
            </button>

          </div>
        </div>
      </div>
    </>
  )
}
