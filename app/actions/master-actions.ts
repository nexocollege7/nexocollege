'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyMaster(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  const masterEmail = process.env.MASTER_EMAIL
  if (user.email !== masterEmail) return { error: 'Acesso negado' }
  return null
}

export async function getMasterStats() {
  const authError = await verifyMaster()
  if (authError) return null

  const adminClient = createAdminClient()

  const [
    { count: totalEscolas },
    { count: totalAlunos },
    { count: totalCursos },
    { data: pagamentos },
    { count: totalEscolasMentor },
  ] = await Promise.all([
    adminClient.from('schools').select('*', { count: 'exact', head: true }),
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    adminClient.from('courses').select('*', { count: 'exact', head: true }),
    adminClient.from('payments').select('amount').eq('status', 'approved'),
    adminClient.from('schools').select('*', { count: 'exact', head: true }).eq('mentor_module', true),
  ])

  const receitaTotal = (pagamentos || []).reduce(
    (acc, p) => acc + Number(p.amount), 0
  )

  return {
    totalEscolas: totalEscolas || 0,
    totalAlunos: totalAlunos || 0,
    totalCursos: totalCursos || 0,
    receitaTotal,
    totalEscolasMentor: totalEscolasMentor || 0,
  }
}

export async function getEscolas() {
  const authError = await verifyMaster()
  if (authError) return []

  const adminClient = createAdminClient()

  const [{ data: schools, error }, { data: enrollmentRows }, { data: schoolsComToken }] = await Promise.all([
    adminClient
      .from('schools')
      .select(`
        id, name, slug, plan, is_active, created_at, owner_name, owner_phone,
        description, primary_color, custom_domain,
        courses!school_id(count)
      `)
      .order('created_at', { ascending: false })
      .limit(200),
    adminClient.from('enrollments').select('school_id'),
    adminClient.from('schools').select('id').not('mp_access_token', 'is', null),
  ])

  if (error) {
    console.error('getEscolas error:', error)
    return []
  }

  const tokenSet = new Set((schoolsComToken || []).map((s) => s.id))

  const enrollmentCountBySchool: Record<string, number> = {}
  for (const row of enrollmentRows || []) {
    if (row.school_id) {
      enrollmentCountBySchool[row.school_id] = (enrollmentCountBySchool[row.school_id] || 0) + 1
    }
  }

  return (schools || []).map((school) => ({
    ...school,
    has_mp_token: tokenSet.has(school.id),
    enrollments: [{ count: enrollmentCountBySchool[school.id] || 0 }],
  }))
}

export async function criarEscola(formData: {
  nome: string
  email: string
  senha: string
  descricao: string
  plano: string
  cor: string
}) {
  const authError = await verifyMaster()
  if (authError) return authError

  const adminClient = createAdminClient()

  const { data: authData, error: authError2 } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.senha,
    email_confirm: true,
  })

  if (authError2) return { error: authError2.message }

  const userId = authData.user.id

  await adminClient.from('users').upsert({
    id: userId,
    email: formData.email,
    full_name: formData.nome,
    role: 'admin',
  })

  const slug = formData.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data: escola, error: escolaError } = await adminClient
    .from('schools')
    .insert({
      owner_id: userId,
      name: formData.nome,
      description: formData.descricao,
      slug: `${slug}-${Date.now()}`,
      plan: formData.plano,
      primary_color: formData.cor || '#AEEA00',
      is_active: true,
    })
    .select()
    .single()

  if (escolaError) return { error: escolaError.message }

  return { success: true, escola }
}

export async function toggleEscolaStatus(escolaId: string, isActive: boolean) {
  const authError = await verifyMaster()
  if (authError) return authError

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('schools')
    .update({
      is_active: isActive,
      suspended_at: isActive ? null : new Date().toISOString(),
    })
    .eq('id', escolaId)
  if (error) return { error: error.message }
  revalidatePath('/master/escolas')
  return { success: true }
}

export async function alterarPlanoEscola(escolaId: string, plano: 'starter' | 'creator' | 'pro' | 'scale' | 'enterprise') {
  const authError = await verifyMaster()
  if (authError) return authError

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('schools')
    .update({ plan: plano })
    .eq('id', escolaId)

  if (error) return { error: error.message }

  revalidatePath('/master/escolas')
  return { success: true }
}

export async function deleteEscola(id: string): Promise<{ success: true } | { error: string }> {
  const authError = await verifyMaster()
  if (authError) return { error: 'Não autorizado' }

  const adminClient = createAdminClient()

  // 1. Buscar owner_id e courses da escola
  const { data: escolaData } = await adminClient
    .from('schools')
    .select('owner_id')
    .eq('id', id)
    .single()

  const { data: courses } = await adminClient
    .from('courses')
    .select('id')
    .eq('school_id', id)
  const courseIds = (courses ?? []).map((c) => c.id)

  // 2. lesson_progress via enrollments da escola + coletar student_ids antes de deletar
  let studentIds: string[] = []
  if (courseIds.length > 0) {
    const { data: enrollments } = await adminClient
      .from('enrollments')
      .select('id, student_id')
      .in('course_id', courseIds)
    const enrollmentIds = (enrollments ?? []).map((e) => e.id)
    studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))]
    if (enrollmentIds.length > 0) {
      await adminClient.from('lesson_progress').delete().in('enrollment_id', enrollmentIds)
    }
  }
  // 3. enrollments via courses da escola
  if (courseIds.length > 0) {
    await adminClient.from('enrollments').delete().in('course_id', courseIds)
  }
  // Deletar alunos do auth.users (têm school_id NULL, vinculados apenas via enrollments)
  for (const studentId of studentIds) {
    await adminClient.auth.admin.deleteUser(studentId)
  }

  // 4. payments
  await adminClient.from('payments').delete().eq('school_id', id)

  // 5. lesson_comments, lessons, modules via courses
  if (courseIds.length > 0) {
    const { data: modules } = await adminClient
      .from('modules')
      .select('id')
      .in('course_id', courseIds)
    const moduleIds = (modules ?? []).map((m) => m.id)
    if (moduleIds.length > 0) {
      const { data: lessons } = await adminClient
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)
      const lessonIds = (lessons ?? []).map((l) => l.id)
      if (lessonIds.length > 0) {
        await adminClient.from('lesson_comments').delete().in('lesson_id', lessonIds)
        await adminClient.from('lesson_progress').delete().in('lesson_id', lessonIds)
      }
      // 5–6. lessons e modules
      await adminClient.from('lessons').delete().in('module_id', moduleIds)
    }
    await adminClient.from('modules').delete().in('course_id', courseIds)
  }

  // 7. courses
  await adminClient.from('courses').delete().eq('school_id', id)

  // 8. certificates
  await adminClient.from('certificates').delete().eq('school_id', id)

  // 9–10. support_messages via support_tickets
  const { data: tickets } = await adminClient
    .from('support_tickets')
    .select('id')
    .eq('school_id', id)
  const ticketIds = (tickets ?? []).map((t) => t.id)
  if (ticketIds.length > 0) {
    await adminClient.from('support_messages').delete().in('ticket_id', ticketIds)
  }
  await adminClient.from('support_tickets').delete().eq('school_id', id)

  // 11–14. mensagens, anúncios, colaboradores, aceites legais
  await adminClient.from('messages').delete().eq('school_id', id)
  await adminClient.from('school_announcements').delete().eq('school_id', id)
  await adminClient.from('school_collaborators').delete().eq('school_id', id)
  await adminClient.from('legal_acceptances').delete().eq('school_id', id)

  // 15. users da escola (alunos e professores)
  await adminClient.from('users').delete().eq('school_id', id)

  // 16. escola
  const { error } = await adminClient.from('schools').delete().eq('id', id)
  if (error) return { error: error.message }

  // 17. owner da escola (não tem school_id em users)
  const { error: ownerError } = await adminClient
    .from('users')
    .delete()
    .eq('id', escolaData?.owner_id)

  if (ownerError) {
    console.error('Erro ao deletar owner:', ownerError)
    return { error: ownerError.message }
  }

  // Deletar owner do auth.users
  if (escolaData?.owner_id) {
    await adminClient.auth.admin.deleteUser(escolaData.owner_id)
  }

  revalidatePath('/master/escolas')
  return { success: true }
}

export async function suspenderEscola(id: string): Promise<{ success: true } | { error: string }> {
  const authError = await verifyMaster()
  if (authError) return { error: 'Não autorizado' }
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('schools')
    .update({ suspended_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/master/escolas/${id}`)
  return { success: true }
}

export async function reativarEscola(id: string): Promise<{ success: true } | { error: string }> {
  const authError = await verifyMaster()
  if (authError) return { error: 'Não autorizado' }
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('schools')
    .update({ suspended_at: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/master/escolas/${id}`)
  return { success: true }
}

export async function deleteEscolaComSenha(
  id: string,
  senha: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const masterEmail = process.env.MASTER_EMAIL
  if (!masterEmail || user.email !== masterEmail) return { error: 'Acesso negado' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: masterEmail,
    password: senha,
  })
  if (signInError) return { error: 'Senha incorreta. A escola não foi excluída.' }

  return deleteEscola(id)
}

export async function getEscolaDetalhe(id: string): Promise<{
  id: string
  name: string
  slug: string | null
  plan: string | null
  is_active: boolean
  phone: string | null
  created_at: string
  owner_id: string | null
  ownerEmail: string | null
  totalAlunos: number
  totalCursos: number
  mentor_module: boolean
  mentor_module_activated_at: string | null
  suspended_at: string | null
} | null> {
  const authError = await verifyMaster()
  if (authError) return null

  const adminClient = createAdminClient()

  const { data: school, error } = await adminClient
    .from('schools')
    .select('id, name, slug, plan, is_active, phone, created_at, owner_id, mentor_module, mentor_module_activated_at, suspended_at')
    .eq('id', id)
    .single()

  if (error || !school) return null

  const [
    { count: totalAlunos },
    { count: totalCursos },
    ownerResult,
  ] = await Promise.all([
    adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id)
      .eq('role', 'student'),
    adminClient
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id),
    school.owner_id
      ? adminClient.auth.admin.getUserById(school.owner_id)
      : Promise.resolve({ data: { user: null }, error: null }),
  ])

  const ownerEmail = ownerResult.data?.user?.email ?? null

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    plan: school.plan,
    is_active: school.is_active,
    phone: school.phone,
    created_at: school.created_at,
    owner_id: school.owner_id,
    ownerEmail,
    totalAlunos: totalAlunos ?? 0,
    totalCursos: totalCursos ?? 0,
    mentor_module: school.mentor_module,
    mentor_module_activated_at: school.mentor_module_activated_at,
    suspended_at: school.suspended_at,
  }
}

export async function toggleMentorModule(escolaId: string, ativar: boolean) {
  const authError = await verifyMaster()
  if (authError) return authError

  const adminClient = createAdminClient()

  const update: { mentor_module: boolean; mentor_module_activated_at?: string } = {
    mentor_module: ativar,
  }
  if (ativar) {
    update.mentor_module_activated_at = new Date().toISOString()
  }

  const { error } = await adminClient
    .from('schools')
    .update(update)
    .eq('id', escolaId)

  if (error) return { error: error.message }

  revalidatePath(`/master/escolas/${escolaId}`)
  return { success: true }
}

export async function getAnaliseComercial() {
  const authError = await verifyMaster()
  if (authError) return null

  const supabase = await createClient()

  const { data: escolas } = await supabase
    .from('schools')
    .select('id, name, plan, created_at, is_active')
    .order('created_at', { ascending: true })
    .limit(500)

  if (!escolas) return null

  const agora = new Date()
  const meses = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const count = escolas.filter((e) => {
      const criada = new Date(e.created_at)
      return criada.getMonth() === d.getMonth() && criada.getFullYear() === d.getFullYear()
    }).length
    meses.push({ label, count })
  }

  const porPlano = {
    starter: escolas.filter((e) => (e.plan || 'starter') === 'starter').length,
    creator: escolas.filter((e) => e.plan === 'creator').length,
    pro: escolas.filter((e) => e.plan === 'pro').length,
    scale: escolas.filter((e) => e.plan === 'scale').length,
    enterprise: escolas.filter((e) => e.plan === 'enterprise').length,
  }

  const { data: plansData } = await supabase
    .from('plans')
    .select('slug, price_yearly')
    .in('slug', ['creator', 'pro', 'scale', 'enterprise'])

  const precoMensal: Record<string, number> = {}
  plansData?.forEach((p) => {
    precoMensal[p.slug] = p.price_yearly > 0 ? Math.round(p.price_yearly / 12) : 0
  })

  const total = escolas.length
  const pagas = porPlano.creator + porPlano.pro + porPlano.scale + porPlano.enterprise
  const taxaConversao = total > 0 ? Math.round((pagas / total) * 100) : 0
  const receitaMensal =
    porPlano.creator * (precoMensal['creator'] ?? 0) +
    porPlano.pro * (precoMensal['pro'] ?? 197) +
    porPlano.scale * (precoMensal['scale'] ?? 0) +
    porPlano.enterprise * (precoMensal['enterprise'] ?? 497)
  const ticketMedio = pagas > 0 ? Math.round(receitaMensal / pagas) : 0

  return { meses, porPlano, total, pagas, taxaConversao, receitaMensal, ticketMedio }
}
