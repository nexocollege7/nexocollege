'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMentorship } from '@/app/actions/mentor-actions'

export default function NovaMentoriaPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
    color: '#F0F0F0', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  async function handleSave() {
    if (!title.trim()) { setErro('O título é obrigatório.'); return }
    setSaving(true)
    setErro('')

    const result = await createMentorship({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
    })

    if (result?.error) {
      setErro(result.error)
      setSaving(false)
    } else {
      router.push(`/dashboard/mentorias/${result.id}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Nova Mentoria</h1>
        <p style={{ color: '#888888', fontSize: '13px', margin: '4px 0 0' }}>
          Você poderá adicionar capa, cronograma e turmas depois de criar
        </p>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Título *</label>
            <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mentoria de Liderança" />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Descrição</label>
            <textarea style={{ ...input, minHeight: '100px', resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que o aluno vai vivenciar nesta mentoria?" />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Preço (R$)</label>
            <input style={{ ...input, maxWidth: '200px' }} type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            <p style={{ color: '#555555', fontSize: '12px', margin: '6px 0 0' }}>Deixe 0 para uma mentoria gratuita.</p>
          </div>

          {erro && <p style={{ color: '#FF5555', fontSize: '13px', margin: 0 }}>{erro}</p>}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button onClick={() => router.push('/dashboard/mentorias')} style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid #2A2A2A',
              backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()} style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#7C4DFF', color: '#fff', fontWeight: '700', fontSize: '13px',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: saving || !title.trim() ? 0.6 : 1,
            }}>
              {saving ? 'Criando...' : 'Criar Mentoria'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
