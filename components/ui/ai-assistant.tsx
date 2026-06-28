'use client'

import { useRef, useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'

type Profile = 'school' | 'student'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiAssistantProps {
  profile: Profile
  schoolName: string
}

export function AiAssistant({ profile, schoolName }: AiAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, profile, schoolName }),
      })
      const data = await res.json() as { reply?: string; error?: string }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply ?? data.error ?? 'Erro ao obter resposta.',
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão. Tente novamente.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const placeholder = profile === 'school'
    ? 'Pergunte sobre estrutura de cursos, aulas...'
    : 'Tire suas dúvidas de estudo...'

  const greeting = profile === 'school'
    ? `Olá! Sou seu assistente de criação de conteúdo. Como posso ajudar a estruturar ${schoolName}?`
    : `Olá! Sou seu assistente de estudos em ${schoolName}. O que você quer aprender hoje?`

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar assistente' : 'Abrir Nexo Assistente'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#AEEA00',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(174,234,0,0.35)',
          transition: 'transform 0.15s ease',
          overflow: 'hidden',
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open
          ? <X size={22} color="#0D0D0D" />
          : <img src="/images/joao.png" alt="João" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '50%' }} />
        }
      </button>

      {/* Janela de chat */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            zIndex: 999,
            width: 'min(360px, calc(100vw - 32px))',
            height: '480px',
            background: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <img src="/images/joao.png" alt="João" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#F0F0F0' }}>
                João · Nexo Assistente
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                {profile === 'school' ? 'Criação de conteúdo' : 'Assistente de estudos'}
              </p>
            </div>
          </div>

          {/* Mensagens */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {/* Saudação inicial */}
            <Bubble role="assistant" content={greeting} />

            {messages.map((msg, i) => (
              <Bubble key={i} role={msg.role} content={msg.content} />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  background: '#1A1A1A', border: '1px solid #2A2A2A',
                  borderRadius: '12px', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Loader2 size={14} color="#AEEA00" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#888', fontSize: '13px' }}>Pensando...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #2A2A2A',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              maxLength={2000}
              style={{
                flex: 1,
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#F0F0F0',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#AEEA00')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: input.trim() && !loading ? '#AEEA00' : '#1A1A1A',
                border: '1px solid #2A2A2A',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s ease',
              }}
              aria-label="Enviar mensagem"
            >
              <Send size={16} color={input.trim() && !loading ? '#0D0D0D' : '#444'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? '#AEEA00' : '#1A1A1A',
        border: isUser ? 'none' : '1px solid #2A2A2A',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: '10px 14px',
        color: isUser ? '#0D0D0D' : '#E0E0E0',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  )
}
