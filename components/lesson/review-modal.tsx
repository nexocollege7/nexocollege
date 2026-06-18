'use client'

import { useState } from 'react'
import { submitCourseReview } from '@/app/actions/review-actions'

type Props = {
  courseId: string
  onClose: () => void
}

export function ReviewModal({ courseId, onClose }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handlePublish() {
    if (!text.trim()) return
    setSending(true)
    setError('')
    const result = await submitCourseReview(courseId, text)
    if (result?.error) {
      setError(result.error)
      setSending(false)
      return
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px',
        padding: '28px', maxWidth: '440px', width: '100%',
      }}>
        <p style={{ fontSize: '24px', margin: '0 0 8px' }}>🎉</p>
        <h2 style={{ color: '#F0F0F0', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>
          Parabéns por concluir o curso!
        </h2>
        <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 16px' }}>
          Conta pra gente como foi sua experiência? Seu depoimento pode aparecer na vitrine da escola.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 300))}
          rows={4}
          placeholder="Escreva seu depoimento sobre o curso..."
          style={{
            width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: '8px', padding: '10px 14px', color: '#F0F0F0',
            fontSize: '14px', outline: 'none', resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        <p style={{ color: '#444444', fontSize: '11px', margin: '4px 0 0', textAlign: 'right' }}>
          {text.length}/300
        </p>

        {error && <p style={{ color: '#FF5555', fontSize: '12px', margin: '8px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            disabled={sending}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: '1px solid #2A2A2A',
              backgroundColor: 'transparent', color: '#888888', fontWeight: '600', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Agora não
          </button>
          <button
            onClick={handlePublish}
            disabled={sending || !text.trim()}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: sending || !text.trim() ? '#1A2E00' : '#AEEA00',
              color: sending || !text.trim() ? '#AEEA00' : '#0D0D0D',
              fontWeight: '700', fontSize: '13px',
              cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {sending ? 'Enviando...' : 'Publicar depoimento'}
          </button>
        </div>
      </div>
    </div>
  )
}
