'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { countActivePendingBySchool } from '@/lib/pending-enrollments'

type ActionResult = { success: boolean; error?: string }

const MAX_RECEIPT_BYTES = 2 * 1024 * 1024
const ALLOWED_RECEIPT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

async function isSchoolOwner(
  adminClient: ReturnType<typeof createAdminClient>,
  schoolId: string,
  userId: string
): Promise<boolean> {
  const { data: school } = await adminClient
    .from('schools')
    .select('owner_id')
    .eq('id', schoolId)
    .single()
    .returns<{ owner_id: string }>()

  return school?.owner_id === userId
}

export async function createPendingEnrollment(
  courseId: string,
  schoolId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: school } = await supabase
    .from('schools')
    .select('pending_expiration_days')
    .eq('id', schoolId)
    .single()
    .returns<{ pending_expiration_days: number }>()

  if (!school) return { success: false, error: 'Escola não encontrada' }

  const expiresAt = new Date(
    Date.now() + school.pending_expiration_days * 86_400_000
  ).toISOString()

  const { data, error } = await supabase
    .from('pending_enrollments')
    .insert({
      school_id: schoolId,
      student_id: user.id,
      course_id: courseId,
      expires_at: expiresAt,
    })
    .select('id')
    .single()
    .returns<{ id: string }>()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Você já tem uma pendência para este curso' }
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}

export async function uploadReceipt(
  pendingId: string,
  file: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const receipt = file.get('receipt')
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { success: false, error: 'Nenhum arquivo selecionado' }
  }

  const ext = ALLOWED_RECEIPT_TYPES[receipt.type]
  if (!ext) {
    return { success: false, error: 'Formato inválido. Envie uma imagem JPEG, PNG ou WEBP' }
  }

  if (receipt.size > MAX_RECEIPT_BYTES) {
    return { success: false, error: 'Arquivo muito grande. Máximo de 2MB' }
  }

  const { data: pending } = await supabase
    .from('pending_enrollments')
    .select('id, school_id, student_id')
    .eq('id', pendingId)
    .single()
    .returns<{ id: string; school_id: string; student_id: string }>()

  if (!pending) return { success: false, error: 'Pendência não encontrada' }

  const path = `${pending.student_id}/${pending.school_id}/${pendingId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('payment-receipts')
    .upload(path, receipt, { upsert: true, contentType: receipt.type })

  if (uploadError) return { success: false, error: uploadError.message }

  const { error: updateError } = await supabase
    .from('pending_enrollments')
    .update({ receipt_url: path, status: 'awaiting_release' })
    .eq('id', pendingId)

  if (updateError) return { success: false, error: updateError.message }

  return { success: true }
}

export async function releasePendingEnrollment(
  pendingId: string,
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: pending } = await adminClient
    .from('pending_enrollments')
    .select('id, school_id, student_id, course_id')
    .eq('id', pendingId)
    .single()
    .returns<{ id: string; school_id: string; student_id: string; course_id: string }>()

  if (!pending) return { success: false, error: 'Pendência não encontrada' }

  if (!(await isSchoolOwner(adminClient, pending.school_id, user.id))) {
    return { success: false, error: 'Acesso negado' }
  }

  const { error: enrollError } = await adminClient
    .from('enrollments')
    .insert({
      school_id: pending.school_id,
      course_id: pending.course_id,
      student_id: pending.student_id,
      status: 'active',
      payment_status: 'manual',
      expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    })

  if (enrollError && enrollError.code !== '23505') {
    return { success: false, error: enrollError.message }
  }

  const { error: updateError } = await adminClient
    .from('pending_enrollments')
    .update({ status: 'released', admin_note: note ?? null })
    .eq('id', pendingId)

  if (updateError) return { success: false, error: updateError.message }

  revalidatePath('/dashboard/pendencias')
  return { success: true }
}

export async function refusePendingEnrollment(
  pendingId: string,
  note: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: pending } = await adminClient
    .from('pending_enrollments')
    .select('id, school_id')
    .eq('id', pendingId)
    .single()
    .returns<{ id: string; school_id: string }>()

  if (!pending) return { success: false, error: 'Pendência não encontrada' }

  if (!(await isSchoolOwner(adminClient, pending.school_id, user.id))) {
    return { success: false, error: 'Acesso negado' }
  }

  const { error } = await adminClient
    .from('pending_enrollments')
    .update({ status: 'refused', admin_note: note })
    .eq('id', pendingId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/pendencias')
  return { success: true }
}

export async function getActivePendingCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
    .returns<{ id: string }>()

  if (!school) return 0

  return countActivePendingBySchool(school.id)
}
