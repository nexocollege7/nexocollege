'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Plano = {
  id: string
  name: string
  slug: string
  price_yearly: number
  max_courses: number
  max_students: number
  max_storage_gb: number
  max_collaborators: number
  has_certificate: boolean
  has_custom_domain: boolean
  can_use_coupons: boolean
  can_use_reviews: boolean
  can_use_live_events: boolean
  is_active: boolean
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Plano | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('plans')
        .select('*')
        .order('price_yearly', { ascending: true })
      if (data) setPlanos(data)
      setLoading(false)
    }
    load()
  }, [])

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
      setPlanos(prev => prev.map(p => p.id === plano.id ? plano : p))
      setTimeout(() => setSucesso(''), 3000)
    }
    setSalvando(null)
  }

  async function toggleAtivo(plano: Plano) {
    await salvarPlano({ ...plano, is_active: !plano.is_active })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Gestão de Planos
        </h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>
          Edite preços, limites e disponibilidade dos planos da plataforma.
        </p>
      </div>

      {sucesso && (
        <div style={{ background: 'rgba(174,234,0,0.1)', border: '1px solid rgba(174,234,0,0.3)', color: '#AEEA00', borderRadius: '10px', padding: '12px 16px', fontSize: '14px' }}>
          ✅ {sucesso}
        </div>
      )}

      {erro && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '10px', padding: '12px 16px', fontSize: '14px' }}>
          ❌ {erro}
        </div>
      )}

      {planos.map(plano => (
        <div key={plano.id} style={{
          background: '#1A1A1A',
          border: `1px solid ${plano.slug === 'pro' ? '#AEEA00' : plano.slug === 'enterprise' ? '#7C4DFF' : '#2A2A2A'}`,
          borderRadius: '16px', padding: '28px',
          opacity: plano.is_active ? 1 : 0.5,
        }}>
          {editando?.id === plano.id ? (
            // Modo edição
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0', margin: 0 }}>
                  Editando: {plano.name}
                </h2>
                <button onClick={() => setEditando(null)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Nome</label>
                  <input
                    value={editando.name}
                    onChange={e => setEditando({ ...editando, name: e.target.value })}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Preço anual (R$)</label>
                  <input
                    type="number"
                    value={editando.price_yearly}
                    onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ''); setEditando({ ...editando, price_yearly: Number(raw) }) }}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Máx. cursos</label>
                  <input
                    type="number"
                    value={editando.max_courses}
                    onChange={e => setEditando({ ...editando, max_courses: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Máx. alunos</label>
                  <input
                    type="number"
                    value={editando.max_students}
                    onChange={e => setEditando({ ...editando, max_students: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Storage (GB)</label>
                  <input
                    type="number"
                    value={editando.max_storage_gb}
                    onChange={e => setEditando({ ...editando, max_storage_gb: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Máx. colaboradores</label>
                  <input
                    type="number"
                    min={0}
                    value={editando.max_collaborators}
                    onChange={e => setEditando({ ...editando, max_collaborators: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editando.has_certificate} onChange={e => setEditando({ ...editando, has_certificate: e.target.checked })} />
                  Certificados
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editando.has_custom_domain} onChange={e => setEditando({ ...editando, has_custom_domain: e.target.checked })} />
                  Domínio próprio
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editando.can_use_coupons} onChange={e => setEditando({ ...editando, can_use_coupons: e.target.checked })} />
                  Cupons de desconto
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editando.can_use_reviews} onChange={e => setEditando({ ...editando, can_use_reviews: e.target.checked })} />
                  Depoimentos
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editando.can_use_live_events} onChange={e => setEditando({ ...editando, can_use_live_events: e.target.checked })} />
                  Eventos ao vivo
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => salvarPlano(editando)}
                  disabled={salvando === editando.id}
                  style={{ padding: '10px 24px', background: '#AEEA00', color: '#0D0D0D', fontWeight: '800', fontSize: '14px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  {salvando === editando.id ? 'Salvando...' : 'Salvar'}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F0', marginBottom: '2px' }}>{plano.name}</div>
                  <div style={{ fontSize: '11px', color: '#444' }}>slug: {plano.slug}</div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#F0F0F0' }}>
                    {plano.slug === 'enterprise' ? 'Sob consulta' : plano.price_yearly === 0 ? 'Grátis' : `R$ ${Number(plano.price_yearly).toLocaleString('pt-BR')}`}
                  </div>
                  {plano.price_yearly > 0 && plano.slug !== 'enterprise' && <div style={{ fontSize: '11px', color: '#555' }}>= R$ {Math.round(plano.price_yearly / 12)}/mês</div>}
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{plano.max_courses}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>cursos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{Number(plano.max_students).toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>alunos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{plano.max_storage_gb}GB</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>storage</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>{plano.max_collaborators}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>colaboradores</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {plano.has_certificate && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Certificados</span>}
                  {plano.has_custom_domain && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Domínio próprio</span>}
                  {plano.can_use_coupons && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Cupons</span>}
                  {plano.can_use_reviews && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Depoimentos</span>}
                  {plano.can_use_live_events && <span style={{ fontSize: '11px', background: '#1a2200', color: '#AEEA00', padding: '3px 8px', borderRadius: '6px' }}>Ao vivo</span>}
                  {!plano.is_active && <span style={{ fontSize: '11px', background: '#2a0000', color: '#f87171', padding: '3px 8px', borderRadius: '6px' }}>Inativo</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
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
  )
}
