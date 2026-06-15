'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyMaster(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  const masterEmail = process.env.MASTER_EMAIL || process.env.NEXT_PUBLIC_MASTER_EMAIL
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
  const authError = await verifyMaster()
  if (authError) return []

  const adminClient = createAdminClient()

  const [{ data: schools, error }, { data: enrollmentRows }] = await Promise.all([
    adminClient
      .from('schools')
      .select(`
        id, name, slug, plan, is_active, created_at, owner_name, owner_phone,
        description, primary_color, custom_domain, mp_access_token,
        courses!school_id(count)
      `)
      .order('created_at', { ascending: false })
      .limit(200),
    adminClient.from('enrollments').select('school_id'),
  ])

  if (error) {
    console.error('getEscolas error:', error)
    return []
  }

  const enrollmentCountBySchool: Record<string, number> = {}
  for (const row of enrollmentRows || []) {
    if (row.school_id) {
      enrollmentCountBySchool[row.school_id] = (enrollmentCountBySchool[row.school_id] || 0) + 1
    }
  }

  return (schools || []).map((school: any) => {
    const { mp_access_token, ...rest } = school
    return {
      ...rest,
      has_mp_token: !!mp_access_token,
      enrollments: [{ count: enrollmentCountBySchool[school.id] || 0 }],
    }
  })
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
    .update({ is_active: isActive })
    .eq('id', escolaId)
  if (error) return { error: error.message }
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
