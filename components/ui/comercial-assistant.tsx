'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const GREETING = 'Oi! 👋 Sou a Mariana, consultora do NexoCollege. Como posso te chamar?'

export function ComercialAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const timeoutFired = useRef(false)
  const exitFired = useRef(false)
  const hasOpenedRef = useRef(false)

  // Mantém hasOpenedRef sincronizado com o estado para uso seguro em callbacks assíncronos
  useEffect(() => {
    hasOpenedRef.current = hasOpened
  }, [hasOpened])

  // Gatilho 1 — tempo: abre após 15s se o visitante ainda não interagiu
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!timeoutFired.current && !exitFired.current && !hasOpenedRef.current) {
        timeoutFired.current = true
        exitFired.current = true
        setOpen(true)
        setHasOpened(true)
      }
    }, 15000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gatilho 2 — exit intent: abre quando o mouse sai pelo topo da janela
  useEffect(() => {
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY < 20 && !timeoutFired.current && !exitFired.current && !hasOpenedRef.current) {
        exitFired.current = true
        timeoutFired.current = true
        setOpen(true)
        setHasOpened(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    setMessages((prev) => [...prev, { role: 'user', content: text }])
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
      const reply = data.reply ?? data.error ?? 'Erro ao obter resposta.'

      const delay = Math.min(600 + reply.length * 18, 3200)
      await new Promise<void>((resolve) => setTimeout(resolve, delay))

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      await new Promise<void>((resolve) => setTimeout(resolve, 800))
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
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <button
          onClick={toggle}
          aria-label={open ? 'Fechar chat' : 'Falar com Mariana'}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            padding: 0,
            border: 'none',
            cursor: 'pointer',
            overflow: 'hidden',
            background: '#0f172a',
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            transition: 'transform 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {open ? (
            <X size={22} color="#fff" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/mariana.png"
              alt="Mariana"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </button>

        {!open && !hasOpened && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '14px',
            height: '14px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '2px solid #0D0D0D',
            display: 'block',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Janela de chat */}
      {open && (
        <div style={{
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
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mariana.png"
              alt="Mariana"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                Mariana
              </p>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  display: 'inline-block',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
                Consultora NexoCollege · Online agora
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
                  gap: '4px',
                }}>
                  <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '2px' }}>
                    Mariana está digitando
                  </span>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#9ca3af', display: 'inline-block',
                    animation: 'dot-blink 1.4s ease 0s infinite',
                  }} />
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#9ca3af', display: 'inline-block',
                    animation: 'dot-blink 1.4s ease 0.2s infinite',
                  }} />
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#9ca3af', display: 'inline-block',
                    animation: 'dot-blink 1.4s ease 0.4s infinite',
                  }} />
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
              onFocus={(e) => (e.target.style.borderColor = '#a3e635')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Enviar mensagem"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: input.trim() && !loading ? '#a3e635' : '#e5e7eb',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s ease',
              }}
            >
              <Send size={16} color={input.trim() && !loading ? '#0f172a' : '#9ca3af'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes dot-blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
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
        background: isUser ? '#a3e635' : '#f3f4f6',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: '10px 14px',
        color: isUser ? '#0f172a' : '#111827',
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
