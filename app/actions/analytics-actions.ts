'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { diasRestantes } from '@/lib/enrollment'

export type Pagamento = {
  amount: number
  paid_at: string | null
  status: string
}

export type MatriculaRecente = {
  enrolled_at: string
  users: { full_name: string | null; role: string } | null
  courses: { title: string } | null
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let schoolId: string | null = null

  // Buscar perfil para verificar role
  const { data: profile } = await supabase
    .from('users')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'collaborator') {
    // Colaborador usa o school_id do perfil
    schoolId = profile.school_id
  } else {
    // Dono da escola busca pelo owner_id
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    schoolId = school?.id || null
  }

  if (!schoolId) return null

  const [
    { data: alunosAtivosRows },
    { count: totalCursos },
    { count: totalCertificados },
    { data: pagamentos },
    { data: matriculasRecentes },
  ] = await Promise.all([
    supabase
      .from('enrollments')
      .select('student_id, users!enrollments_student_id_fkey!inner(role)')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .eq('users.role', 'student')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('payments').select('amount, paid_at, status').eq('school_id', schoolId).eq('status', 'approved').order('paid_at', { ascending: false }).limit(5),
    supabase.from('enrollments').select(`
      enrolled_at,
      users!enrollments_student_id_fkey ( full_name, role ),
      courses ( title )
    `).eq('school_id', schoolId).order('enrolled_at', { ascending: false }).limit(20),
  ])

  const totalAlunos = new Set((alunosAtivosRows ?? []).map((e) => e.student_id)).size

  const pagamentosTipados = (pagamentos ?? []) as Pagamento[]
  const matriculasTipadas = (matriculasRecentes ?? []) as unknown as MatriculaRecente[]

  const receita = pagamentosTipados.reduce((acc, p) => acc + Number(p.amount), 0)

  const matriculasFiltradas = matriculasTipadas
    .filter((e) => e.users !== null && e.users?.role === 'student')
    .slice(0, 5)

  return {
    totalAlunos: totalAlunos || 0,
    totalCursos: totalCursos || 0,
    totalCertificados: totalCertificados || 0,
    receita,
    pagamentos: pagamentosTipados,
    matriculasRecentes: matriculasFiltradas,
  }
}

export async function getAnalyticsCompleto(periodoDias: 30 | 60 | 90 = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let schoolId: string | null = null
  const { data: ownedSchool } = await supabase.from('schools').select('id').eq('owner_id', user.id).single()
  if (ownedSchool) {
    schoolId = ownedSchool.id
  } else {
    const { data: profile } = await supabase.from('users').select('school_id').eq('id', user.id).single()
    schoolId = profile?.school_id ?? null
  }
  if (!schoolId) return null

  const adminClient = createAdminClient()

  const [{ data: cursos }, { data: enrollments }, { data: payments }] = await Promise.all([
    adminClient.from('courses').select('id, title, status, total_lessons').eq('school_id', schoolId),
    adminClient.from('enrollments').select('id, student_id, course_id, expires_at, users!enrollments_student_id_fkey!inner(role)').eq('school_id', schoolId).eq('status', 'active').eq('users.role', 'student').limit(2000),
    adminClient.from('payments').select('amount, course_id, paid_at').eq('school_id', schoolId).eq('status', 'approved'),
  ])

  const cursosMap = new Map((cursos || []).map((c) => [c.id, c]))
  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))]

  const { data: progresso } = studentIds.length
    ? await adminClient.from('lesson_progress').select('student_id, course_id').in('student_id', studentIds).eq('is_completed', true).limit(10000)
    : { data: [] as any[] }

  const progressoCount = new Map<string, number>()
  for (const p of progresso || []) {
    const key = `${p.student_id}_${p.course_id}`
    progressoCount.set(key, (progressoCount.get(key) || 0) + 1)
  }

  const matriculas = (enrollments || []).map((e) => {
    const curso = cursosMap.get(e.course_id)
    const total = curso?.total_lessons ?? 0
    const completas = progressoCount.get(`${e.student_id}_${e.course_id}`) ?? 0
    const progressoPercent = total > 0 ? Math.round((completas / total) * 100) : 0
    const dias = diasRestantes(e.expires_at)
    const expirado = dias !== null && dias <= 0
    return { ...e, progressoPercent, expirado }
  })

  const alunosAtivosSet = new Set(matriculas.filter((m) => !m.expirado).map((m) => m.student_id))
  const receitaTotal = (payments || []).reduce((acc, p) => acc + Number(p.amount), 0)
  const totalCursosPublicados = (cursos || []).filter((c) => c.status === 'published').length
  const taxaMediaConclusao = matriculas.length
    ? Math.round(matriculas.reduce((acc, m) => acc + m.progressoPercent, 0) / matriculas.length)
    : 0

  const receitaPorCursoMap = new Map<string, { total: number; qtd: number }>()
  for (const p of payments || []) {
    if (!p.course_id) continue
    const entry = receitaPorCursoMap.get(p.course_id) || { total: 0, qtd: 0 }
    entry.total += Number(p.amount)
    entry.qtd += 1
    receitaPorCursoMap.set(p.course_id, entry)
  }
  const receitaPorCurso = [...receitaPorCursoMap.entries()]
    .map(([courseId, { total, qtd }]) => ({
      courseId,
      titulo: cursosMap.get(courseId)?.title ?? '—',
      receita: total,
      ticketMedio: qtd > 0 ? total / qtd : 0,
    }))
    .sort((a, b) => b.receita - a.receita)

  const inscritosPorCurso = new Map<string, number>()
  for (const m of matriculas) {
    inscritosPorCurso.set(m.course_id, (inscritosPorCurso.get(m.course_id) || 0) + 1)
  }
  const maisInscritos = [...inscritosPorCurso.entries()]
    .map(([courseId, qtd]) => ({ courseId, titulo: cursosMap.get(courseId)?.title ?? '—', qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 5)

  const progressoPorCurso = new Map<string, number[]>()
  for (const m of matriculas) {
    const arr = progressoPorCurso.get(m.course_id) || []
    arr.push(m.progressoPercent)
    progressoPorCurso.set(m.course_id, arr)
  }
  const maiorConclusao = [...progressoPorCurso.entries()]
    .map(([courseId, arr]) => ({
      courseId,
      titulo: cursosMap.get(courseId)?.title ?? '—',
      taxa: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    }))
    .sort((a, b) => b.taxa - a.taxa)
    .slice(0, 5)

  const totalMatriculasAtivas = matriculas.filter((m) => !m.expirado).length
  const totalMatriculasExpiradas = matriculas.filter((m) => m.expirado).length

  const hoje = new Date()
  const vendasPorDia = new Map<string, number>()
  for (let i = periodoDias - 1; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i)
    vendasPorDia.set(d.toISOString().slice(0, 10), 0)
  }
  for (const p of payments || []) {
    if (!p.paid_at) continue
    const dia = String(p.paid_at).slice(0, 10)
    if (vendasPorDia.has(dia)) {
      vendasPorDia.set(dia, (vendasPorDia.get(dia) || 0) + Number(p.amount))
    }
  }
  const grafico = [...vendasPorDia.entries()].map(([data, valor]) => ({
    data: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    valor,
  }))

  return {
    totalAlunosAtivos: alunosAtivosSet.size,
    receitaTotal,
    totalCursosPublicados,
    taxaMediaConclusao,
    receitaPorCurso,
    maisInscritos,
    maiorConclusao,
    totalMatriculasAtivas,
    totalMatriculasExpiradas,
    grafico,
  }
}
