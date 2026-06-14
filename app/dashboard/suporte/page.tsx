'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MessageCircle, ChevronRight, Send, X } from 'lucide-react'

const CATEGORIES = {
  problema_tecnico: { label: 'Problema Técnico', icon: '🔧' },
  sugestao: { label: 'Sugestão de Melhoria', icon: '💡' },
  duvida_plano: { label: 'Dúvida sobre Plano', icon: '💳' },
  duvida_funcionalidade: { label: 'Dúvida sobre Funcionalidade', icon: '📚' },
  urgente: { label: 'Urgente', icon: '🔴' },
}

const STATUS = {
  aberto: { label: 'Aberto', color: '#AEEA00', bg: 'rgba(174,234,0,0.1)' },
  em_andamento: { label: 'Em Andamento', color: '#7C4DFF', bg: 'rgba(124,77,255,0.1)' },
  resolvido: { label: 'Resolvido', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)' },
}

export default function SuportePage() {
  const supabase = createClient()
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'problema_tecnico', firstMessage: '' })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const [schoolId, setSchoolId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => { loadUser() }, [])
  useEffect(() => { if (schoolId) loadTickets() }, [schoolId])
  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id)
      const interval = setInterval(() => loadMessages(selectedTicket.id), 30000)
      return () => clearInterval(interval)
    }
  }, [selectedTicket])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('users').select('school_id').eq('id', user.id).single()
    if (data?.school_id) setSchoolId(data.school_id)
    setLoading(false)
  }

  async function loadTickets() {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('school_id', schoolId)
      .eq('ticket_type', 'escola_master')
      .order('updated_at', { ascending: false })
    setTickets(data || [])
  }

  async function loadMessages(ticketId) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function createTicket() {
    if (!form.title.trim() || !form.firstMessage.trim()) return
    setSending(true)
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({ school_id: schoolId, title: form.title, category: form.category, ticket_type: 'escola_master' })
      .select()
      .single()
    if (error || !ticket) { setSending(false); return }
    await supabase.from('support_messages').insert({
      ticket_id: ticket.id, sender_id: userId, sender_role: 'admin', content: form.firstMessage,
    })
    setForm({ title: '', category: 'problema_tecnico', firstMessage: '' })
    setShowNewTicket(false)
    await loadTickets()
    setSelectedTicket(ticket)
    setSending(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id, sender_id: userId, sender_role: 'admin', content: newMessage,
    })
    setNewMessage('')
    await loadMessages(selectedTicket.id)
    setSending(false)
  }

  function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000)
    if (diff < 1) return 'agora'
    if (diff < 60) return diff + 'min atrás'
    if (diff < 1440) return Math.floor(diff/60) + 'h atrás'
    return Math.floor(diff/1440) + 'd atrás'
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' }}>Carregando...</div>

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>Suporte</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>Fale diretamente com a equipe NexoCollege</p>
        </div>
        <button onClick={() => setShowNewTicket(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#AEEA00', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
          <Plus size={16} /> Novo Chamado
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: '24px' }}>
        <div>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555', background: '#111', borderRadius: '12px', border: '1px dashed #333' }}>
              <MessageCircle size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Nenhum chamado ainda.</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Clique em "Novo Chamado" para começar.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tickets.map(ticket => {
                const cat = CATEGORIES[ticket.category]
                const st = STATUS[ticket.status]
                const isSelected = selectedTicket?.id === ticket.id
                return (
                  <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    style={{ background: isSelected ? '#1a1a2e' : '#111', border: isSelected ? '1px solid #7C4DFF' : '1px solid #222', borderRadius: '12px', padding: '16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px' }}>{cat?.icon}</span>
                          <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{ticket.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', background: st?.bg, color: st?.color, padding: '2px 10px', borderRadius: '20px', fontWeight: '600' }}>{st?.label}</span>
                          <span style={{ fontSize: '12px', color: '#555' }}>{cat?.label}</span>
                          <span style={{ fontSize: '12px', color: '#444' }}>{timeAgo(ticket.updated_at)}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#555" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedTicket && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '500px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: '600', fontSize: '14px' }}>{selectedTicket.title}</p>
                <span style={{ fontSize: '12px', color: STATUS[selectedTicket.status]?.color }}>{STATUS[selectedTicket.status]?.label}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(msg => {
                const isAdmin = msg.sender_role === 'admin'
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', background: isAdmin ? '#7C4DFF' : '#1e1e1e', color: '#fff', borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '10px 14px', fontSize: '14px' }}>
                      {!isAdmin && <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#AEEA00', fontWeight: '600' }}>Suporte NexoCollege</p>}
                      <p style={{ margin: 0 }}>{msg.content}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.6, textAlign: 'right' }}>{timeAgo(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            {selectedTicket.status !== 'resolvido' ? (
              <div style={{ padding: '12px', borderTop: '1px solid #222', display: 'flex', gap: '8px' }}>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Digite sua mensagem..." style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{ background: '#AEEA00', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
                  <Send size={16} color="#000" />
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px', borderTop: '1px solid #222', textAlign: 'center', color: '#4CAF50', fontSize: '13px' }}>✅ Este chamado foi resolvido</div>
            )}
          </div>
        )}
      </div>

      {showNewTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', margin: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Novo Chamado</h2>
              <button onClick={() => setShowNewTicket(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Título do chamado</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Não consigo adicionar alunos" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Categoria</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}>
                  {Object.entries(CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Descreva o problema ou sugestão</label>
                <textarea value={form.firstMessage} onChange={e => setForm({...form, firstMessage: e.target.value})} placeholder="Explique com detalhes..." rows={4} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button onClick={createTicket} disabled={sending || !form.title.trim() || !form.firstMessage.trim()} style={{ background: '#AEEA00', color: '#000', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Enviando...' : 'Abrir Chamado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
