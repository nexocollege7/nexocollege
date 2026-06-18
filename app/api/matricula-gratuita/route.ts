import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matriculaValida } from '@/lib/enrollment'

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verifica se o curso é realmente gratuito
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, is_free, school_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    if (!course.is_free) {
      return NextResponse.json({ error: 'Este curso não é gratuito' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString()

    // Verifica se já está matriculado
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, status, expires_at')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      if (matriculaValida(existing)) {
        return NextResponse.json({ success: true, already: true })
      }
      const { error: renewError } = await supabase
        .from('enrollments')
        .update({ status: 'active', expires_at: expiresAt })
        .eq('id', existing.id)
      if (renewError) {
        return NextResponse.json({ error: renewError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, renewed: true })
    }

    // Cria a matrícula
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
        school_id: course.school_id,
        status: 'active',
        expires_at: expiresAt,
      })

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
