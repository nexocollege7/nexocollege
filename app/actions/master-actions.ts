'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getMasterStats() {
  const supabase = await createClient()

  const [
    { count: totalEscolas },
    { count: totalAlunos },
    { count: totalCursos },
    { data: pagamentos },
  ] = await Promise.all([
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'approved'),
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schools')
    .select(`
      *,
      courses(count),
      enrollments(count)
    `)
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function criarEscola(formData: {
  nome: string
  email: string
  senha: string
  descricao: string
  plano: string
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
