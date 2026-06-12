'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCourse, updateCourse } from '@/app/actions/course-actions'
import { getModulos, criarModulo, deletarModulo } from '@/app/actions/modulo-actions'
import { criarAula, deletarAula } from '@/app/actions/aula-actions'

export default function EditarCursoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [curso, setCurso] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [novoModulo, setNovoModulo] = useState('')
  const [novaAula, setNovaAula] = useState<{ [key: string]: { titulo: string; url: string } }>({})

  useEffect(() => {
    async function load() {
      const [cursoData, modulosData] = await Promise.all([
        getCourse(id),
        getModulos(id),
      ])
      setCurso(cursoData)
      setModulos(modulosData)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSalvarCurso() {
    setSalvando(true)
    await updateCourse(id, {
      title: curso.title,
      description: curso.description,
      price: curso.is_free ? 0 : curso.price,
      is_free: curso.is_free,
      status: curso.status,
    })
    setSalvando(false)
    router.push('/dashboard/cursos')
  }

  async function handleUploadThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadando(true)
    try {
      const formData = new FormData()
      formData.append('thumbnail', file)
      formData.append('courseId', id)
      const res = await fetch('/api/upload-thumbnail', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()
      if (result.url) {
        setCurso({ ...curso, thumbnail_url: result.url })
      } else {
        alert('Erro no upload: ' + (result.error || 'Tente novamente'))
      }
    } catch {
      alert('Erro ao enviar imagem. Tente novamente.')
    }
    setUploadando(false)
  }

  async function handleCriarModulo() {
    if (!novoModulo.trim()) return
    const result = await criarModulo(id, novoModulo.trim())
    if (result.data) {
      setModulos([...modulos, { ...result.data, lessons: [] }])
      setNovoModulo('')
    }
  }

  async function handleDeletarModulo(moduloId: string) {
    if (!confirm('Deletar este módulo e todas as suas aulas?')) return
    await deletarModulo(moduloId)
    setModulos(modulos.filter((m) => m.id !== moduloId))
  }

  async function handleCriarAula(moduloId: string) {
    const aula = novaAula[moduloId]
    if (!aula?.titulo?.trim() || !aula?.url?.trim()) return
    const result = await criarAula(moduloId, id, aula.titulo.trim(), aula.url.trim())
    if (result.data) {
      setModulos(modulos.map((m) =>
        m.id === moduloId
          ? { ...m, lessons: [...(m.lessons || []), result.data] }
          : m
      ))
      setNovaAula({ ...novaAula, [moduloId]: { titulo: '', url: '' } })
    }
  }

  async function handleDeletarAula(moduloId: string, aulaId: string) {
    if (!confirm('Deletar esta aula?')) return
    await deletarAula(aulaId)
    setModulos(modulos.map((m) =>
      m.id === moduloId
        ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== aulaId) }
        : m
    ))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
    color: '#F0F0F0', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const btnNeon: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#AEEA00', color: '#0D0D0D',
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
        <button onClick={() => router.push('/dashboard/cursos')}
          style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Editar Curso</h1>
          <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Atualize as informações e gerencie as aulas</p>
        </div>
      </div>

      {curso && (
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
            Informações do Curso
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Imagem de Capa
              </label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '160px', height: '100px', borderRadius: '8px',
                    border: `2px dashed ${curso.thumbnail_url ? '#AEEA00' : '#2A2A2A'}`,
                    backgroundColor: '#0D0D0D', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0, position: 'relative',
                  }}
                >
                  {curso.thumbnail_url ? (
                    <img src={curso.thumbnail_url} alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '24px', margin: 0 }}>🖼️</p>
                      <p style={{ color: '#555555', fontSize: '11px', margin: '4px 0 0' }}>Clique para upload</p>
                    </div>
                  )}
                  {uploadando && (
                    <div style={{
                      position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <p style={{ color: '#AEEA00', fontSize: '12px' }}>Enviando...</p>
                    </div>
                  )}
                </div>
                <div>
                  <button onClick={() => fileInputRef.current?.click()} style={btnNeon}>
                    {curso.thumbnail_url ? 'Trocar imagem' : 'Upload de imagem'}
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
                onChange={handleUploadThumbnail}
              />
            </div>

            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Título *</label>
              <input style={input} value={curso.title}
                onChange={(e) => setCurso({ ...curso, title: e.target.value })} />
            </div>

            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Descrição</label>
              <textarea style={{ ...input, minHeight: '100px', resize: 'vertical' }} value={curso.description || ''}
                onChange={(e) => setCurso({ ...curso, description: e.target.value })} />
            </div>

            {/* Toggle Gratuito / Pago */}
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '10px' }}>
                Tipo de acesso
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setCurso({ ...curso, is_free: true, price: 0 })}
                  style={{
                    padding: '10px 20px', borderRadius: '8px',
                    backgroundColor: curso.is_free ? '#1A2E00' : '#1A1A1A',
                    color: curso.is_free ? '#AEEA00' : '#888888',
                    fontWeight: curso.is_free ? '700' : '400',
                    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${curso.is_free ? '#AEEA00' : '#2A2A2A'}`,
                  }}
                >
                  🎁 Gratuito
                </button>
                <button
                  onClick={() => setCurso({ ...curso, is_free: false })}
                  style={{
                    padding: '10px 20px', borderRadius: '8px',
                    backgroundColor: !curso.is_free ? '#1E0E3F' : '#1A1A1A',
                    color: !curso.is_free ? '#7C4DFF' : '#888888',
                    fontWeight: !curso.is_free ? '700' : '400',
                    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${!curso.is_free ? '#7C4DFF' : '#2A2A2A'}`,
                  }}
                >
                  💳 Pago
                </button>
              </div>
            </div>

            {/* Preço — só aparece se for pago */}
            {!curso.is_free && (
              <div>
                <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Preço (R$)
                </label>
                <input style={{ ...input, maxWidth: '200px' }} type="number" value={curso.price || 0}
                  onChange={(e) => setCurso({ ...curso, price: parseFloat(e.target.value) })} />
              </div>
            )}

            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Status</label>
              <select style={{ ...input, maxWidth: '200px' }} value={curso.status}
                onChange={(e) => setCurso({ ...curso, status: e.target.value })}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button onClick={() => router.push('/dashboard/cursos')}
                style={{ ...btnPerigo, padding: '10px 20px' }}>Voltar</button>
              <button onClick={handleSalvarCurso} disabled={salvando} style={btnNeon}>
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
          Módulos e Aulas
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {modulos.length === 0 && (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              Nenhum módulo ainda. Crie o primeiro abaixo.
            </p>
          )}
          {modulos.map((modulo, index) => (
            <div key={modulo.id} style={{ border: '1px solid #2A2A2A', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', backgroundColor: '#222222',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#AEEA00', fontSize: '12px', fontWeight: '700' }}>M{index + 1}</span>
                  <span style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600' }}>{modulo.title}</span>
                  <span style={{ color: '#555555', fontSize: '12px' }}>
                    {(modulo.lessons || []).length} aula{(modulo.lessons || []).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={() => handleDeletarModulo(modulo.id)} style={btnPerigo}>Deletar módulo</button>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(modulo.lessons || [])
                  .sort((a: any, b: any) => a.position - b.position)
                  .map((aula: any, aulaIndex: number) => (
                    <div key={aula.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', backgroundColor: '#1A1A1A',
                      borderRadius: '6px', border: '1px solid #2A2A2A',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#555555', fontSize: '12px' }}>▶</span>
                        <span style={{ color: '#F0F0F0', fontSize: '13px' }}>{aulaIndex + 1}. {aula.title}</span>
                      </div>
                      <button onClick={() => handleDeletarAula(modulo.id, aula.id)} style={btnPerigo}>✕</button>
                    </div>
                  ))}
                <div style={{
                  display: 'flex', gap: '8px', alignItems: 'center',
                  padding: '8px', backgroundColor: '#111111',
                  borderRadius: '8px', border: '1px dashed #2A2A2A', marginTop: '4px',
                }}>
                  <input placeholder="Título da aula"
                    style={{ ...input, flex: 2, padding: '8px 12px' }}
                    value={novaAula[modulo.id]?.titulo || ''}
                    onChange={(e) => setNovaAula({ ...novaAula, [modulo.id]: { ...novaAula[modulo.id], titulo: e.target.value } })}
                  />
                  <input placeholder="URL do vídeo (YouTube ou Vimeo)"
                    style={{ ...input, flex: 3, padding: '8px 12px' }}
                    value={novaAula[modulo.id]?.url || ''}
                    onChange={(e) => setNovaAula({ ...novaAula, [modulo.id]: { ...novaAula[modulo.id], url: e.target.value } })}
                  />
                  <button onClick={() => handleCriarAula(modulo.id)} style={{ ...btnNeon, whiteSpace: 'nowrap' }}>
                    + Aula
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          padding: '16px', backgroundColor: '#111111',
          borderRadius: '10px', border: '1px dashed #AEEA00',
        }}>
          <input placeholder="Nome do novo módulo (ex: Módulo 1 — Introdução)"
            style={{ ...input, flex: 1 }}
            value={novoModulo}
            onChange={(e) => setNovoModulo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCriarModulo()}
          />
          <button onClick={handleCriarModulo} style={btnNeon}>+ Módulo</button>
        </div>
      </div>
    </div>
  )
}
