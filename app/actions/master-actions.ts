'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getMasterStats() {
  const adminClient = createAdminClient()

  const [
    { count: totalEscolas },
    { count: totalAlunos },
    { count: totalCursos },
    { data: pagamentos },
  ] = await Promise.all([
    adminClient.from('schools').select('*', { count: 'exact', head: true }),
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    adminClient.from('courses').select('*', { count: 'exact', head: true }),
    adminClient.from('payments').select('amount').eq('status', 'approved'),
  ])

  const receitaTotal = (pagamentos || []).reduce(
    (acc, p) => acc + Number(p.amount), 0
  )

  return {
    totalEscolas: totalEscolas || 0,
    totalAlunos: totalAlunos || 0,
    totalCursos: totalCursos || 0,
    receitaTotal,
  }
}

export async function getEscolas() {
  const adminClient = createAdminClient()

  // Buscar escolas
  const { data: schools, error } = await adminClient
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getEscolas error:', error)
    return []
  }
  if (!schools || schools.length === 0) return []

  // Buscar contagem de cursos e alunos para cada escola
  const result = await Promise.all(
    schools.map(async (school) => {
      const [{ count: cursosCount }, { count: alunosCount }] = await Promise.all([
        adminClient
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id),
        adminClient
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id),
      ])
      return {
        ...school,
        courses: [{ count: cursosCount ?? 0 }],
        enrollments: [{ count: alunosCount ?? 0 }],
      }
    })
  )

  return result
}

export async function criarEscola(formData: {
  nome: string
  email: string
  senha: string
  descricao: string
  plano: string
  cor: string
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.senha,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id

  // 2. Criar perfil do usuário
  await adminClient.from('users').upsert({
    id: userId,
    email: formData.email,
    full_name: formData.nome,
    role: 'admin',
  })

  // 3. Criar a escola
  const slug = formData.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  const supabase = await createClient()
  const { error } = await supabase
    .from('schools')
    .update({ is_active: isActive })
    .eq('id', escolaId)
  if (error) return { error: error.message }
  return { success: true }
}
export async function alterarPlanoEscola(escolaId: string, plano: 'starter' | 'pro' | 'enterprise') {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('schools')
    .update({ plan: plano })
    .eq('id', escolaId)

  if (error) return { error: error.message }

  revalidatePath('/master/escolas')
  return { success: true }
}

export async function getAnaliseComercial() {
  const supabase = await createClient()

  const { data: escolas } = await supabase
    .from('schools')
    .select('id, name, plan, created_at, is_active')
    .order('created_at', { ascending: true })

  if (!escolas) return null

  // Escolas por mes (ultimos 6 meses)
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

  // Distribuicao por plano
  const porPlano = {
    starter: escolas.filter((e) => (e.plan || 'starter') === 'starter').length,
    pro: escolas.filter((e) => e.plan === 'pro').length,
    enterprise: escolas.filter((e) => e.plan === 'enterprise').length,
  }

  // Metricas
  const total = escolas.length
  const pagas = porPlano.pro + porPlano.enterprise
  const taxaConversao = total > 0 ? Math.round((pagas / total) * 100) : 0
  const receitaMensal = porPlano.pro * 197 + porPlano.enterprise * 497
  const ticketMedio = pagas > 0 ? Math.round(receitaMensal / pagas) : 0

  return { meses, porPlano, total, pagas, taxaConversao, receitaMensal, ticketMedio }
}
