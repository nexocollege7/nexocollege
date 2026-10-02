import { createAdminClient } from '@/lib/supabase/admin'

export type SecaoPublica = { id: string; title: string; courseIds: string[] }

// Seções da vitrine de uma escola, na ordem definida no painel.
export async function getSecoesDaVitrine(schoolId: string): Promise<SecaoPublica[]> {
  const admin = createAdminClient()
  const { data: secoes, error } = await admin
    .from('vitrine_sections')
    .select('id, title')
    .eq('school_id', schoolId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !secoes || secoes.length === 0) return []

  const { data: vinculos } = await admin
    .from('vitrine_section_courses')
    .select('section_id, course_id, position')
    .in('section_id', secoes.map((s) => s.id as string))
    .order('position', { ascending: true })

  return secoes.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    courseIds: (vinculos ?? []).filter((v) => v.section_id === s.id).map((v) => v.course_id as string),
  }))
}

// Monta os grupos exibidos na vitrine.
// Sem seções: um único grupo "Todos os cursos" (comportamento original).
// Com seções: uma fileira por seção + "Outros cursos" com os que sobraram.
export function montarGruposVitrine<T extends { id: string }>(cursos: T[], secoes: SecaoPublica[]) {
  const todos = { usarFileiras: false, grupos: [{ id: 'todos', titulo: 'Todos os cursos', cursos }] }
  if (secoes.length === 0) return todos

  const usados = new Set<string>()
  const grupos = secoes
    .map((secao) => {
      const lista = secao.courseIds
        .map((id) => cursos.find((curso) => curso.id === id))
        .filter((curso): curso is T => Boolean(curso))
      lista.forEach((curso) => usados.add(curso.id))
      return { id: secao.id, titulo: secao.title, cursos: lista }
    })
    .filter((grupo) => grupo.cursos.length > 0)

  const outros = cursos.filter((curso) => !usados.has(curso.id))
  if (outros.length > 0) grupos.push({ id: 'outros', titulo: 'Conheça também', cursos: outros })

  if (grupos.length === 0) return todos
  return { usarFileiras: true, grupos }
}
