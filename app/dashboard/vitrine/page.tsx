'use client'

import { useEffect, useState } from 'react'
import { getMySchool } from '@/app/actions/school-actions'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function VitrinePage() {
  const [school, setSchool] = useState<any>(null)
  const [cursos, setCursos] = useState<any[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const schoolData = await getMySchool()
      if (!schoolData) return
      setSchool(schoolData)
      setFeaturedIds(schoolData.featured_course_ids ? schoolData.featured_course_ids.split(',') : [])

      const { data: cursosData } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, status, is_free, price')
        .eq('school_id', schoolData.id)
        .order('created_at', { ascending: false })

      setCursos(cursosData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('schools')
      .update({ featured_course_ids: featuredIds.length > 0 ? featuredIds.join(',') : null })
      .eq('id', school.id)

    if (error) {
      setMessage('Erro ao salvar: ' + error.message)
    } else {
      setMessage('Vitrine atualizada com sucesso!')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  const linkVitrine = school ? 'https://' + school.slug + '.nexocollege.com.br' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Minha Vitrine</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>Configure como sua vitrine aparece para os alunos</p>
      </div>

      {/* Link da vitrine */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px' }}>
        <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Link da sua vitrine</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <p style={{ color: '#AEEA00', fontSize: '15px', fontWeight: '600', margin: 0 }}>{linkVitrine}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={linkVitrine} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #2A2A2A', color: '#888888', fontSize: '13px', textDecoration: 'none' }}>
              Ver vitrine
            </a>
          </div>
        </div>
      </div>

      {/* Curso em destaque no banner */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Curso em destaque no banner</h2>
        <p style={{ color: '#666666', fontSize: '13px', margin: '0 0 20px' }}>
          O curso selecionado aparece primeiro no banner rotativo da vitrine.
        </p>

        {cursos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#111111', borderRadius: '10px' }}>
            <p style={{ color: '#555555', fontSize: '14px', margin: '0 0 12px' }}>Voce ainda nao tem cursos cadastrados.</p>
            <Link href="/dashboard/cursos/novo" style={{ color: '#AEEA00', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              Criar primeiro curso
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Opcao: sem destaque */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: '1px solid ' + (featuredIds.length === 0 ? '#AEEA00' : '#2A2A2A'), backgroundColor: featuredIds.length === 0 ? '#1A2E00' : '#111111', cursor: 'pointer' }}>
              <input type="checkbox" checked={featuredIds.length === 0} onChange={() => setFeaturedIds([])} style={{ accentColor: '#AEEA00' }} />
              <div>
                <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>Ordem automatica</p>
                <p style={{ color: '#666666', fontSize: '12px', margin: 0 }}>Cursos aparecem do mais recente para o mais antigo</p>
              </div>
            </label>

            {cursos.map((curso) => (
              <label key={curso.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: '1px solid ' + (featuredIds.includes(curso.id) ? '#AEEA00' : '#2A2A2A'), backgroundColor: featuredIds.includes(curso.id) ? '#1A2E00' : '#111111', cursor: 'pointer' }}>
                <input type="checkbox" checked={featuredIds.includes(curso.id)} onChange={(e) => { if (e.target.checked) { setFeaturedIds([...featuredIds, curso.id]) } else { setFeaturedIds(featuredIds.filter(id => id !== curso.id)) } }} style={{ accentColor: '#AEEA00' }} />
                <div style={{ width: '48px', height: '36px', borderRadius: '6px', backgroundColor: '#2A2A2A', overflow: 'hidden', flexShrink: 0 }}>
                  {curso.thumbnail_url && <img src={curso.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>{curso.title}</p>
                  <p style={{ color: '#666666', fontSize: '12px', margin: 0 }}>
                    {curso.status === 'published' ? 'Publicado' : 'Rascunho'} &bull; {curso.is_free ? 'Gratis' : 'R$ ' + curso.price}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {message && (
          <p style={{ color: message.startsWith('Erro') ? '#f87171' : '#AEEA00', fontSize: '13px', margin: '16px 0 0' }}>{message}</p>
        )}

        <button onClick={handleSave} disabled={saving} style={{ marginTop: '20px', width: '100%', backgroundColor: saving ? '#333333' : '#AEEA00', color: '#0D0D0D', fontWeight: '700', fontSize: '14px', border: 'none', borderRadius: '8px', padding: '12px', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Salvando...' : 'Salvar configuracoes da vitrine'}
        </button>
      </div>

    </div>
  )
}
