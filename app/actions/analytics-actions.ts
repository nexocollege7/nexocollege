'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return null

  const schoolId = school.id

  const [
    { count: totalAlunos },
    { count: totalCursos },
    { count: totalCertificados },
    { data: pagamentos },
    { data: matriculasRecentes },
  ] = await Promise.all([
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('payments').select('amount, paid_at, status').eq('school_id', schoolId).eq('status', 'approved').order('paid_at', { ascending: false }).limit(5),
    supabase.from('enrollments').select(`
      enrolled_at,
      users ( full_name ),
      courses ( title )
    `).eq('school_id', schoolId).order('enrolled_at', { ascending: false }).limit(5),
  ])

  const receita = (pagamentos || []).reduce((acc: number, p: any) => acc + Number(p.amount), 0)

  return {
    totalAlunos: totalAlunos || 0,
    totalCursos: totalCursos || 0,
    totalCertificados: totalCertificados || 0,
    receita,
    pagamentos: pagamentos || [],
    matriculasRecentes: matriculasRecentes || [],
  }
}
