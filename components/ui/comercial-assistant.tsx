'use client'

import { useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const GREETING = 'Olá! Eu sou o Nexo 👋 Antes de tudo, como posso te chamar?'

export function ComercialAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  function toggle() {
    setOpen((v) => {
      if (!v) setHasOpened(true)
      return !v
    })
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const history = [...messages]
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const res = await fetch('/api/comercial-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage: text }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply ?? data.error ?? 'Erro ao obter resposta.' },
      ])
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

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={toggle}
        aria-label={open ? 'Fechar assistente' : 'Abrir Nexo Assistente'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(22,163,74,0.45)',
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
        {!open && !hasOpened && (
          <span style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '14px',
            height: '14px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '2px solid #0D0D0D',
            display: 'block',
          }} />
        )}
      </button>

      {/* Janela de chat */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            zIndex: 999,
            width: 'min(380px, calc(100vw - 32px))',
            maxHeight: '500px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MessageCircle size={18} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Nexo — Assistente NexoCollege
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  display: 'inline-block',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
                Online agora
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
            background: '#fff',
          }}>
            {messages.map((msg, i) => (
              <Bubble key={i} role={msg.role} content={msg.content} />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Loader2 size={13} color="#16a34a" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>Digitando...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
            background: '#fff',
            flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              maxLength={1000}
              style={{
                flex: 1,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#111827',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: input.trim() && !loading ? '#16a34a' : '#e5e7eb',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s ease',
              }}
              aria-label="Enviar mensagem"
            >
              <Send size={16} color={input.trim() && !loading ? '#fff' : '#9ca3af'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  )
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? '#16a34a' : '#f3f4f6',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: '10px 14px',
        color: isUser ? '#fff' : '#111827',
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
