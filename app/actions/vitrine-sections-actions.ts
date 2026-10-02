'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

type Resultado = { error?: string; success?: boolean }

export type SecaoVitrine = { id: string; title: string; position: number; courseIds: string[] }
export type CursoParaSecao = { id: string; title: string; status: string; thumbnail_url: string | null }

// Confere o usuário logado e devolve a escola da qual ele é dono.
async function escolaDoDono(): Promise<{ schoolId: string; slug: string | null } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola não encontrada' }
  if (profile.role !== 'admin' && profile.role !== 'owner') {
    return { error: 'Apenas o dono da escola pode organizar a vitrine' }
  }

  const { data: school } = await admin.from('schools').select('slug').eq('id', profile.school_id).single()
  return { schoolId: profile.school_id as string, slug: (school?.slug as string) ?? null }
}

function atualizarVitrine(slug: string | null) {
  revalidatePath('/dashboard/vitrine')
  if (slug) revalidatePath(`/vitrine/${slug}`, 'layout')
}

function limparTitulo(titulo: string) {
  return (titulo ?? '').replace(/\s+/g, ' ').trim()
}

export async function listarSecoesVitrine(): Promise<{ error?: string; secoes: SecaoVitrine[]; cursos: CursoParaSecao[] }> {
  const dono = await escolaDoDono()
  if ('error' in dono) return { error: dono.error, secoes: [], cursos: [] }

  const admin = createAdminClient()
  const [{ data: secoes }, { data: cursos }] = await Promise.all([
    admin
      .from('vitrine_sections')
      .select('id, title, position')
      .eq('school_id', dono.schoolId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('courses')
      .select('id, title, status, thumbnail_url')
      .eq('school_id', dono.schoolId)
      .order('created_at', { ascending: false }),
  ])

  const ids = (secoes ?? []).map((s) => s.id as string)
  let vinculos: { section_id: string; course_id: string; position: number }[] = []
  if (ids.length > 0) {
    const { data } = await admin
      .from('vitrine_section_courses')
      .select('section_id, course_id, position')
      .in('section_id', ids)
      .order('position', { ascending: true })
    vinculos = (data ?? []) as typeof vinculos
  }

  return {
    secoes: (secoes ?? []).map((s) => ({
      id: s.id as string,
      title: s.title as string,
      position: s.position as number,
      courseIds: vinculos.filter((v) => v.section_id === s.id).map((v) => v.course_id),
    })),
    cursos: (cursos ?? []) as CursoParaSecao[],
  }
}

export async function criarSecaoVitrine(titulo: string): Promise<Resultado> {
  const dono = await escolaDoDono()
  if ('error' in dono) return { error: dono.error }

  const nome = limparTitulo(titulo)
  if (nome.length < 1) return { error: 'Digite o nome da seção' }
  if (nome.length > 60) return { error: 'Nome muito longo (máximo de 60 caracteres)' }

  const admin = createAdminClient()
  const { data: ultima } = await admin
    .from('vitrine_sections')
    .select('position')
    .eq('school_id', dono.schoolId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await admin
    .from('vitrine_sections')
    .insert({ school_id: dono.schoolId, title: nome, position: ((ultima?.position as number | undefined) ?? -1) + 1 })

  if (error) return { error: 'Erro ao criar seção: ' + error.message }
  atualizarVitrine(dono.slug)
  return { success: true }
}

export async function renomearSecaoVitrine(sectionId: string, titulo: string): Promise<Resultado> {
  const dono = await escolaDoDono()
  if ('error' in dono) return { error: dono.error }

  const nome = limparTitulo(titulo)
  if (nome.length < 1) return { error: 'Digite o nome da seção' }
  if (nome.length > 60) return { error: 'Nome muito longo (máximo de 60 caracteres)' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('vitrine_sections')
    .update({ title: nome })
    .eq('id', sectionId)
    .eq('school_id', dono.schoolId)
    .select('id')

  if (error) return { error: 'Erro ao renomear: ' + error.message }
  if (!data || data.length === 0) return { error: 'Seção não encontrada' }
  atualizarVitrine(dono.slug)
  return { success: true }
}

export async function excluirSecaoVitrine(sectionId: string): Promise<Resultado> {
  const dono = await escolaDoDono()
  if ('error' in dono) return { error: dono.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('vitrine_sections')
    .delete()
    .eq('id', sectionId)
    .eq('school_id', dono.schoolId)
    .select('id')

  if (error) return { error: 'Erro ao excluir: ' + error.message }
  if (!data || data.length === 0) return { error: 'Seção não encontrada' }
  atualizarVitrine(dono.slug)
  return { success: true }
}

export async function moverSecaoVitrine(sectionId: string, direcao: 'cima' | 'baixo'): Promise<Resultado> {
  const dono = await escolaDoDono()
  if ('error' in dono) return { error: dono.error }

  const admin = createAdminClient()
  const { data: secoes } = await admin
    .from('vitrine_sections')
    .select('id')
    .eq('school_id', dono.schoolId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  const lista = (secoes ?? []).map((s) => s.id as string)
  const i = lista.indexOf(sectionId)
  if (i === -1) return { error: 'Seção não encontrada' }
  const j = direcao === 'cima' ? i - 1 : i + 1
  if (j < 0 || j >= lista.length) return { success: true }

  ;[lista[i], lista[j]] = [lista[j], lista[i]]
  for (let pos = 0; pos < lista.length; pos++) {
    await admin.from('vitrine_sections').update({ position: pos }).eq('id', lista[pos]).eq('school_id', dono.schoolId)
  }

  atualizarVitrine(dono.slug)
  return { success: true }
}

export async function salvarCursosDaSecao(sectionId: string, courseIds: string[]): Promise<Resultado> {
  const dono = await escolaDoDono()
  if ('error' in dono) return { error: dono.error }

  const admin = createAdminClient()
  const { data: secao } = await admin
    .from('vitrine_sections')
    .select('id')
    .eq('id', sectionId)
    .eq('school_id', dono.schoolId)
    .maybeSingle()
  if (!secao) return { error: 'Seção não encontrada' }

  const unicos = Array.from(new Set((courseIds ?? []).filter(Boolean))).slice(0, 100)

  let validos: string[] = []
  if (unicos.length > 0) {
    const { data: cursos } = await admin
      .from('courses')
      .select('id')
      .eq('school_id', dono.schoolId)
      .in('id', unicos)
    const daEscola = new Set((cursos ?? []).map((c) => c.id as string))
    validos = unicos.filter((id) => daEscola.has(id))
  }

  const { error: delError } = await admin.from('vitrine_section_courses').delete().eq('section_id', sectionId)
  if (delError) return { error: 'Erro ao salvar: ' + delError.message }

  if (validos.length > 0) {
    const { error: insError } = await admin
      .from('vitrine_section_courses')
      .insert(validos.map((courseId, pos) => ({ section_id: sectionId, course_id: courseId, position: pos })))
    if (insError) return { error: 'Erro ao salvar: ' + insError.message }
  }

  atualizarVitrine(dono.slug)
  return { success: true }
}
