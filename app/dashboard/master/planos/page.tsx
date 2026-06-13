'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_EMAIL || 'fe.jose7@gmail.com'

type Plano = {
  id: string
  name: string
  slug: string
  price_yearly: number
  max_courses: number
  max_students: number
  max_storage_gb: number
  has_certificate: boolean
  has_custom_domain: boolean
  is_active: boolean
}

export default function MasterPlanosPage() {
  const router = useRouter()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [editando, setEditando] = useState<Plano | null>(null)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function verificarAcesso() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || user.email !== MASTER_EMAIL) {
        router.push('/dashboard')
        return
      }

      const { data } = await supabase
        .from('plans')
        .select('*')
        .order('price_yearly', { ascending: true })

      if (data) setPlanos(data)
      setLoading(false)
    }
    verificarAcesso()
  }, [router])

  async function salvarPlano(plano: Plano) {
    setSalvando(plano.id)
    setErro('')
    setSucesso('')

    const res = await fetch('/api/master/planos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plano),
    })

    const data = await res.json()

    if (!res.ok) {
      setErro(data.error || 'Erro ao salvar.')
    } else {
      setSucesso(`Plano "${plano.name}" salvo com sucesso!`)
      setEditando(null)
      // Atualizar lista local
      setPlanos(prev => prev.map(p => p.id === plano.id ? plano : p))
      setTimeout(() => setSucesso(''), 3000)
    }
    setSalvando(null)
  }

  async function toggleAtivo(plano: Plano) {
    const atualizado = { ...plano, is_active: !plano.is_active }
    await salvarPlano(atualizado)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: '#888' }}>Carregando planos...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#AEEA00', marginBottom: '8px' }}>
          Painel Master
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#F0F0F0', marginBottom: '8px' }}>
          Gestão de Planos
        </h1>
        <p style={{ color: '#666', fontSize: '15px' }}>
          Edite preços, limites e disponibilidade dos planos da plataforma.
        </p>
      </div>

      {sucesso && (
        <div style={{ background: 'rgba(174,234,0,0.1)', border: '1px solid rgba(174,234,0,0.3)', color: '#AEEA00', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
          ✅ {sucesso}
        </div>
      )}

      {erro && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
          ❌ {erro}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {planos.map(plano => (
          <div key={plano.id} style={{
            background: '#141414', border: `1px solid ${plano.is_active ? '#222' : '#1a1a1a'}`,
            borderRadius: '16px', padding: '24px',
            opacity: plano.is_active ? 1 : 0.5,
          }}>
            {editando?.id === plano.id ? (
              // Modo edição
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#AEEA00' }}>
                    Editando: {plano.name}
                  </div>
                  <button onClick={() => setEditando(null)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Nome do plano</label>
                    <input
                      value={editando.name}
                      onChange={e => setEditando({ ...editando, name: e.target.value })}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Preço anual (R$)</label>
                    <input
                      type="number"
                      value={editando.price_yearly}
                      onChange={e => setEditando({ ...editando, price_yearly: Number(e.target.value) })}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Máx. cursos</label>
                    <input
                      type="number"
                      value={editando.max_courses}
                      onChange={e => setEditando({ ...editando, max_courses: Number(e.target.value) })}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Máx. alunos</label>
                    <input
                      type="number"
                      value={editando.max_students}
                      onChange={e => setEditando({ ...editando, max_students: Number(e.target.value) })}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Armazenamento (GB)</label>
                    <input
                      type="number"
                      value={editando.max_storage_gb}
                      onChange={e => setEditando({ ...editando, max_storage_gb: Number(e.target.value) })}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editando.has_certificate} onChange={e => setEditando({ ...editando, has_certificate: e.target.checked })} />
                    Certificados
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editando.has_custom_domain} onChange={e => setEditando({ ...editando, has_custom_domain: e.target.checked })} />
                    Domínio próprio
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => salvarPlano(editando)}
                    disabled={salvando === editando.id}
                    style={{ padding: '10px 24px', background: '#AEEA00', color: '#0D0D0D', fontWeight: '800', fontSize: '14px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    {salvando === editando.id ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    style={{ padding: '10px 24px', background: 'transparent', color: '#666', fontWeight: '600', fontSize: '14px', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualização
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: plano.is_active ? '#AEEA00' : '#444', marginBottom: '4px' }}>{plano.name}</div>
                    <div style={{ fontSize: '11px', color: '#444' }}>slug: {plano.slug}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#F0F0F0' }}>R$ {Number(plano.price_yearly).toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>/ano</div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{plano.max_courses}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>cursos</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{plano.max_students.toLocaleString('pt-BR')}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>alunos</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{plano.max_storage_gb}GB</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>storage</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {plano.has_certificate && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Certificados</span>}
                    {plano.has_custom_domain && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Domínio próprio</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => toggleAtivo(plano)}
                    style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${plano.is_active ? '#333' : '#AEEA00'}`, color: plano.is_active ? '#555' : '#AEEA00', fontSize: '12px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
                  >
                    {plano.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => setEditando(plano)}
                    style={{ padding: '8px 16px', background: '#AEEA00', color: '#0D0D0D', fontSize: '12px', fontWeight: 800, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
