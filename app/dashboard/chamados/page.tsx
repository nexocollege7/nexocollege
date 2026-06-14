'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, X, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const CATEGORIES = {
  duvida_conteudo: { label: 'Dúvida sobre Conteúdo', icon: '📚' },
  problema_acesso: { label: 'Problema de Acesso', icon: '🔧' },
  certificado: { label: 'Certificado', icon: '🎓' },
  sugestao: { label: 'Sugestão', icon: '💡' },
  outro: { label: 'Outro', icon: '💬' },
}

const COLUMNS = [
  { key: 'aberto', label: 'Aberto', color: '#AEEA00', icon: AlertCircle },
  { key: 'em_andamento', label: 'Em Andamento', color: '#7C4DFF', icon: Clock },
  { key: 'resolvido', label: 'Resolvido', color: '#4CAF50', icon: CheckCircle },
]

export default function ChamadosPage() {
  const supabase = createClient()
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const [schoolId, setSchoolId] = useState(null)
  const [studentNames, setStudentNames] = useState({})
  const messagesEndRef = useRef(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id)
      const interval = setInterval(() => loadMessages(selectedTicket.id), 30000)
      return () => clearInterval(interval)
    }
  }, [selectedTicket])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single()
    if (!userData?.school_id) return
    setSchoolId(userData.school_id)

    const { data: students } = await supabase
      .from('users')
      .select('id, name')
      .eq('school_id', userData.school_id)
      .eq('role', 'student')
    const nameMap = {}
    students?.forEach(s => { nameMap[s.id] = s.name })
    setStudentNames(nameMap)

    await loadTickets(userData.school_id)
    setLoading(false)
  }

  async function loadTickets(sid) {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, sender_id:support_messages(sender_id)')
      .eq('school_id', sid || schoolId)
      .eq('ticket_type', 'aluno_escola')
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

  async function updateStatus(ticketId, newStatus) {
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId)
    setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null)
    await loadTickets(schoolId)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: userId,
      sender_role: 'admin',
      content: newMessage,
    })
    if (selectedTicket.status === 'aberto') {
      await updateStatus(selectedTicket.id, 'em_andamento')
    }
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

  function getStudentName(ticketId) {
    const msg = messages.find(m => m.sender_role === 'student')
    if (msg) return studentNames[msg.sender_id] || 'Aluno'
    return 'Aluno'
  }

  const ticketsByStatus = (status) => tickets.filter(t => t.status === status)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' }}>Carregando...</div>

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>Chamados dos Alunos</h1>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>
          {tickets.length} chamado{tickets.length !== 1 ? 's' : ''} no total
          {ticketsByStatus('aberto').length > 0 && <span style={{ color: '#AEEA00', marginLeft: '12px' }}>● {ticketsByStatus('aberto').length} aguardando resposta</span>}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 380px' : '1fr', gap: '24px', alignItems: 'start' }}>

        {/* Kanban */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const colTickets = ticketsByStatus(col.key)
            const Icon = col.icon
            return (
              <div key={col.key} style={{ background: '#0f0f0f', borderRadius: '12px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={14} color={col.color} />
                  <span style={{ color: col.color, fontWeight: '700', fontSize: '13px' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', background: '#1a1a1a', color: '#888', fontSize: '12px', padding: '2px 8px', borderRadius: '20px' }}>{colTickets.length}</span>
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                  {colTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#333', fontSize: '13px' }}>Nenhum chamado</div>
                  ) : colTickets.map(ticket => {
                    const cat = CATEGORIES[ticket.category]
                    const isSelected = selectedTicket?.id === ticket.id
                    return (
                      <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                        style={{ background: isSelected ? '#1a1a2e' : '#161616', border: isSelected ? '1px solid #7C4DFF' : '1px solid #222', borderRadius: '10px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{cat?.icon}</span>
                          <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#555' }}>{cat?.label}</span>
                          <span style={{ fontSize: '11px', color: '#444' }}>{timeAgo(ticket.updated_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Painel de conversa */}
        {selectedTicket && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '600px', position: 'sticky', top: '24px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', color: '#fff', fontWeight: '600', fontSize: '14px' }}>{selectedTicket.title}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#AEEA00' }}>{CATEGORIES[selectedTicket.category]?.label}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', marginLeft: '8px' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {COLUMNS.map(col => (
                  <button key={col.key} onClick={() => updateStatus(selectedTicket.id, col.key)}
                    style={{ flex: 1, padding: '5px', fontSize: '11px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', background: selectedTicket.status === col.key ? col.color : '#1a1a1a', color: selectedTicket.status === col.key ? '#000' : '#555', transition: 'all 0.2s' }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && <div style={{ textAlign: 'center', color: '#444', fontSize: '13px', marginTop: '20px' }}>Nenhuma mensagem ainda</div>}
              {messages.map(msg => {
                const isAdmin = msg.sender_role === 'admin'
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', background: isAdmin ? '#7C4DFF' : '#1e1e1e', color: '#fff', borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '10px 14px', fontSize: '14px' }}>
                      {!isAdmin && <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#AEEA00', fontWeight: '600' }}>{studentNames[msg.sender_id] || 'Aluno'}</p>}
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
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Responder aluno..." style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{ background: '#AEEA00', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
                  <Send size={16} color="#000" />
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px', borderTop: '1px solid #222', textAlign: 'center', color: '#4CAF50', fontSize: '13px' }}>✅ Chamado resolvido</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
