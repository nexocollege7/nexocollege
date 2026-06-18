'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
  getMentorship,
  updateMentorship,
  criarAulaMentoria,
  deletarAulaMentoria,
  getSchoolTeamMembers,
  ensureMentorshipCoversBucket,
} from '@/app/actions/mentor-actions'

export default function EditarMentoriaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mentoria, setMentoria] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState('')
  const [novaAula, setNovaAula] = useState({ title: '', summary: '', scheduledAt: '', materialsUrl: '' })

  useEffect(() => {
    async function load() {
      const [mentoriaData, membros] = await Promise.all([
        getMentorship(id),
        getSchoolTeamMembers(),
        ensureMentorshipCoversBucket(),
      ])
      setMentoria(mentoriaData)
      setTeamMembers(membros)
      setLoading(false)
    }
    load()
  }, [id])

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSalvar() {
    setSalvando(true)
    const result = await updateMentorship(id, {
      title: mentoria.title,
      description: mentoria.description || '',
      price: Number(mentoria.price) || 0,
      status: mentoria.status,
      mentor_id: mentoria.mentor_id || null,
    })
    setSalvando(false)
    if (result?.error) showMsg('Erro: ' + result.error)
    else showMsg('✅ Mentoria salva!')
  }

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadando(true)
    try {
      const formData = new FormData()
      formData.append('cover', file)
      formData.append('mentorshipId', id)
      const res = await fetch('/api/upload-mentorship-cover', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.url) {
        setMentoria({ ...mentoria, cover_url: result.url })
      } else {
        showMsg('Erro no upload: ' + (result.error || 'Tente novamente'))
      }
    } catch {
      showMsg('Erro ao enviar imagem. Tente novamente.')
    }
    setUploadando(false)
  }

  async function handleCriarAula() {
    if (!novaAula.title.trim()) return
    const result = await criarAulaMentoria(id, {
      title: novaAula.title.trim(),
      summary: novaAula.summary.trim(),
      scheduledAt: novaAula.scheduledAt ? new Date(novaAula.scheduledAt).toISOString() : null,
      materialsUrl: novaAula.materialsUrl.trim(),
    })
    if (result.data) {
      setMentoria({ ...mentoria, classes: [...mentoria.classes, result.data] })
      setNovaAula({ title: '', summary: '', scheduledAt: '', materialsUrl: '' })
    } else if (result.error) {
      showMsg('Erro: ' + result.error)
    }
  }

  async function handleDeletarAula(classId: string) {
    if (!confirm('Remover este item do cronograma?')) return
    await deletarAulaMentoria(classId, id)
    setMentoria({ ...mentoria, classes: mentoria.classes.filter((c: any) => c.id !== classId) })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  if (!mentoria) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Mentoria não encontrada.</p>
    </div>
  )

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
    color: '#F0F0F0', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#7C4DFF', color: '#fff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'inherit',
  }

  const btnPerigo: React.CSSProperties = {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid #3A1A1A',
    backgroundColor: 'transparent', color: '#FF5555',
    fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/dashboard/mentorias')}
          style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Editar Mentoria</h1>
          <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Capa, informações e cronograma</p>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(124,77,255,0.1)', border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF'}`, borderRadius: '8px', padding: '12px 16px', color: msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
          Informações da Mentoria
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              Capa
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '160px', height: '100px', borderRadius: '8px',
                  border: `2px dashed ${mentoria.cover_url ? '#7C4DFF' : '#2A2A2A'}`,
                  backgroundColor: '#0D0D0D', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0, position: 'relative',
                }}
              >
                {mentoria.cover_url ? (
                  <Image src={mentoria.cover_url} alt="Capa" fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', margin: 0 }}>🎓</p>
                    <p style={{ color: '#555555', fontSize: '11px', margin: '4px 0 0' }}>Clique para upload</p>
                  </div>
                )}
                {uploadando && (
                  <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <p style={{ color: '#7C4DFF', fontSize: '12px' }}>Enviando...</p>
                  </div>
                )}
              </div>
              <div>
                <button onClick={() => fileInputRef.current?.click()} style={btnPrimary}>
                  {mentoria.cover_url ? 'Trocar imagem' : 'Upload de imagem'}
                </button>
                <p style={{ color: '#555555', fontSize: '12px', margin: '8px 0 0', lineHeight: '1.5' }}>
                  JPG, PNG ou WebP.<br />Recomendado: 1280×720px
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUploadCover}
            />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Título *</label>
            <input style={input} value={mentoria.title}
              onChange={(e) => setMentoria({ ...mentoria, title: e.target.value })} />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Descrição</label>
            <textarea style={{ ...input, minHeight: '100px', resize: 'vertical' }} value={mentoria.description || ''}
              onChange={(e) => setMentoria({ ...mentoria, description: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Preço (R$)</label>
              <input style={input} type="number" min={0} step="0.01" value={mentoria.price}
                onChange={(e) => setMentoria({ ...mentoria, price: e.target.value })} />
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Status</label>
              <select style={input} value={mentoria.status}
                onChange={(e) => setMentoria({ ...mentoria, status: e.target.value })}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicada</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Mentor responsável</label>
              <select style={input} value={mentoria.mentor_id || ''}
                onChange={(e) => setMentoria({ ...mentoria, mentor_id: e.target.value || null })}>
                <option value="">Sem mentor definido</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name || 'Sem nome'} {m.role === 'admin' ? '(dono)' : '(colaborador)'}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button onClick={handleSalvar} disabled={salvando} style={btnPrimary}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
          Cronograma
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {mentoria.classes.length === 0 && (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              Nenhum encontro no cronograma ainda.
            </p>
          )}
          {mentoria.classes.map((c: any, index: number) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '12px 16px', backgroundColor: '#0D0D0D', borderRadius: '8px', border: '1px solid #2A2A2A',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700' }}>{index + 1}.</span>
                  <span style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600' }}>{c.title}</span>
                </div>
                {c.summary && <p style={{ color: '#888888', fontSize: '12px', margin: '4px 0 0' }}>{c.summary}</p>}
                {c.scheduled_at && (
                  <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0' }}>
                    📅 {new Date(c.scheduled_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {c.materials_url && (
                  <a href={c.materials_url} target="_blank" rel="noreferrer" style={{ color: '#7C4DFF', fontSize: '12px' }}>Materiais →</a>
                )}
              </div>
              <button onClick={() => handleDeletarAula(c.id)} style={btnPerigo}>Remover</button>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          padding: '16px', backgroundColor: '#111111',
          borderRadius: '10px', border: '1px dashed #7C4DFF',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input placeholder="Título do encontro"
              style={{ ...input, flex: 2, minWidth: '160px' }}
              value={novaAula.title}
              onChange={(e) => setNovaAula({ ...novaAula, title: e.target.value })}
            />
            <input type="datetime-local"
              style={{ ...input, flex: 1, minWidth: '160px' }}
              value={novaAula.scheduledAt}
              onChange={(e) => setNovaAula({ ...novaAula, scheduledAt: e.target.value })}
            />
          </div>
          <input placeholder="Resumo do encontro"
            style={input}
            value={novaAula.summary}
            onChange={(e) => setNovaAula({ ...novaAula, summary: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="Link de materiais (opcional)"
              style={{ ...input, flex: 1 }}
              value={novaAula.materialsUrl}
              onChange={(e) => setNovaAula({ ...novaAula, materialsUrl: e.target.value })}
            />
            <button onClick={handleCriarAula} style={{ ...btnPrimary, whiteSpace: 'nowrap' }}>
              + Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
