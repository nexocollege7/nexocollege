'use client'

import { useEffect, useState } from 'react'
import { createAnnouncement, getSchoolAnnouncements } from '@/app/actions/announcement-actions'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  author: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ComunicadosPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getSchoolAnnouncements().then(setAnnouncements)
  }, [])

  async function handleSend() {
    if (!title.trim() || !content.trim()) return
    setSending(true)
    setMsg('')
    const result = await createAnnouncement(title, content)
    if (result?.error) {
      setMsg('Erro: ' + result.error)
    } else {
      setTitle('')
      setContent('')
      const updated = await getSchoolAnnouncements()
      setAnnouncements(updated)
      setMsg('✅ Comunicado enviado para todos os alunos!')
      setTimeout(() => setMsg(''), 4000)
    }
    setSending(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: '8px', padding: '10px 14px', color: '#F0F0F0',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Comunicados
        </h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          Envie mensagens para todos os alunos da sua escola
        </p>
      </div>

      {/* Formulário */}
      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#F0F0F0', margin: '0 0 20px' }}>
          Novo comunicado
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#888888', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Título
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
              placeholder="Ex: Atualização dos horários de aula"
            />
          </div>
          <div>
            <label style={{ color: '#888888', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Mensagem
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Escreva o comunicado aqui..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {msg ? (
              <p style={{ fontSize: '13px', color: msg.startsWith('Erro') ? '#FF5555' : '#AEEA00', margin: 0 }}>
                {msg}
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !content.trim()}
              style={{
                padding: '10px 28px', borderRadius: '8px', border: 'none',
                backgroundColor: sending || !title.trim() || !content.trim() ? '#1A2E00' : '#AEEA00',
                color: sending || !title.trim() || !content.trim() ? '#AEEA00' : '#0D0D0D',
                fontWeight: '700', fontSize: '14px',
                cursor: sending || !title.trim() || !content.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {sending ? 'Enviando...' : 'Enviar para todos os alunos'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de comunicados */}
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#888888', margin: '0 0 16px' }}>
        Comunicados enviados ({announcements.length})
      </h2>

      {announcements.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 8px' }}>📣</p>
          <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Nenhum comunicado enviado ainda</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map(a => (
            <div key={a.id} style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
                  {a.title}
                </h3>
                <span style={{ fontSize: '11px', color: '#444444', flexShrink: 0 }}>
                  {formatDate(a.created_at)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 8px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {a.content}
              </p>
              <p style={{ fontSize: '11px', color: '#444444', margin: 0 }}>
                por {a.author}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
