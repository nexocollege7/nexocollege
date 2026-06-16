'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export type LegalDocument = {
  id: string
  type: 'terms_of_use' | 'privacy_policy' | 'cookie_policy'
  version: string
  target_role: 'school' | 'student'
  title: string
  content: string
  is_active: boolean
  created_at: string
}

export async function getActiveDocuments(role: 'school' | 'student'): Promise<LegalDocument[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('is_active', true)
    .eq('target_role', role)
    .order('type')
  return (data ?? []) as LegalDocument[]
}

export async function recordAcceptances(documentIds: string[]): Promise<{ error?: string }> {
  if (!documentIds.length) return {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? null
  const userAgent = headersList.get('user-agent') ?? null

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  // Filtrar os que o usuário já aceitou (evita duplicatas)
  const { data: existing } = await adminClient
    .from('legal_acceptances')
    .select('document_id')
    .eq('user_id', user.id)
    .in('document_id', documentIds)

  const alreadyAccepted = new Set(existing?.map((a: any) => a.document_id) ?? [])
  const newRows = documentIds
    .filter(docId => !alreadyAccepted.has(docId))
    .map(docId => ({
      user_id: user.id,
      document_id: docId,
      ip_address: ipAddress,
      user_agent: userAgent,
      school_id: profile?.school_id ?? null,
    }))

  if (newRows.length === 0) return {}

  const { error } = await adminClient.from('legal_acceptances').insert(newRows)
  if (error) return { error: error.message }
  return {}
}

export async function getPendingDocuments(userId: string, role: 'school' | 'student'): Promise<LegalDocument[]> {
  const adminClient = createAdminClient()

  const [docsResult, acceptedResult] = await Promise.all([
    adminClient
      .from('legal_documents')
      .select('*')
      .eq('is_active', true)
      .eq('target_role', role),
    adminClient
      .from('legal_acceptances')
      .select('document_id')
      .eq('user_id', userId),
  ])

  const activeDocs = (docsResult.data ?? []) as LegalDocument[]
  const acceptedIds = new Set(acceptedResult.data?.map((a: any) => a.document_id) ?? [])

  return activeDocs.filter(doc => !acceptedIds.has(doc.id))
}

// Painel escola: dados LGPD de um aluno específico
export async function getStudentLgpdData(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  // Verificar que o admin pertence à mesma escola que o aluno
  const [adminProfile, studentProfile] = await Promise.all([
    adminClient.from('users').select('school_id, role').eq('id', user.id).single(),
    adminClient.from('users').select('id, full_name, school_id, created_at').eq('id', studentId).single(),
  ])

  if (adminProfile.data?.role !== 'admin') return null
  if (!studentProfile.data) return null
  if (studentProfile.data.school_id !== adminProfile.data.school_id) return null

  const [authUserResult, enrollmentsResult, acceptancesResult] = await Promise.all([
    adminClient.auth.admin.getUserById(studentId),
    adminClient
      .from('enrollments')
      .select('id, status, enrolled_at, payment_status, courses(title)')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false }),
    adminClient
      .from('legal_acceptances')
      .select('id, accepted_at, ip_address, user_agent, legal_documents(type, title, version)')
      .eq('user_id', studentId)
      .order('accepted_at', { ascending: false }),
  ])

  const student = studentProfile.data
  return {
    id: student.id,
    full_name: student.full_name ?? '',
    email: authUserResult.data?.user?.email ?? '',
    created_at: student.created_at,
    enrollments: (enrollmentsResult.data ?? []) as any[],
    acceptances: (acceptancesResult.data ?? []) as any[],
  }
}

// Painel Master: listar todos os documentos
export async function getAllDocumentsForMaster(): Promise<LegalDocument[]> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('legal_documents')
    .select('*')
    .order('target_role')
    .order('type')
    .order('created_at', { ascending: false })
  return (data ?? []) as LegalDocument[]
}

// Painel Master: editar conteúdo do documento ativo (sem criar nova versão)
export async function updateDocumentContent(
  docId: string,
  title: string,
  content: string,
): Promise<{ error?: string }> {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('legal_documents')
    .update({ title, content })
    .eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/master/documentos')
  return {}
}

// Painel Master: publicar nova versão (exige re-aceite de todos os usuários)
export async function publishNewVersion(params: {
  type: 'terms_of_use' | 'privacy_policy' | 'cookie_policy'
  target_role: 'school' | 'student'
  title: string
  content: string
  version: string
}): Promise<{ error?: string }> {
  const adminClient = createAdminClient()

  // Desativar versão anterior
  await adminClient
    .from('legal_documents')
    .update({ is_active: false })
    .eq('type', params.type)
    .eq('target_role', params.target_role)
    .eq('is_active', true)

  // Criar nova versão
  const { error } = await adminClient.from('legal_documents').insert({
    type: params.type,
    version: params.version,
    target_role: params.target_role,
    title: params.title,
    content: params.content,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/master/documentos')
  return {}
}
