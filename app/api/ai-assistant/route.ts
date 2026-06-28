import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verificarPermissao } from '@/lib/plan-permissions'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import Groq from 'groq-sdk'

type Profile = 'school' | 'student'

function buildSystemPrompt(profile: Profile, schoolName: string, plan: string): string {
  if (profile === 'school') {
    return `Você é um assistente especializado em educação online para a escola "${schoolName}" (plano ${plan}).
Seu papel é ajudar o administrador da escola a:
- Criar e estruturar cursos e módulos
- Escrever descrições e títulos atrativos para aulas
- Sugerir sequências pedagógicas e organização de conteúdo
- Dar dicas de engajamento e retenção de alunos
Seja objetivo, prático e use exemplos concretos. Responda sempre em português.`
  }

  return `Você é um assistente de estudos da escola "${schoolName}".
Seu papel é ajudar os alunos a:
- Tirar dúvidas sobre conteúdos das aulas
- Fixar conceitos e revisar matéria
- Encontrar formas de estudar melhor
- Manter o foco e a motivação
Seja encorajador, claro e use linguagem acessível. Responda sempre em português.`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const ip = getClientIp(request.headers)
    const rateLimitKey = `ai-assistant:${user.id}:${ip}`
    if (!checkRateLimit(rateLimitKey, 20, 60_000)) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    const body = await request.json() as { message?: unknown; profile?: unknown; schoolName?: unknown }
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const profile = body.profile === 'student' ? 'student' : ('school' as Profile)
    const schoolName = typeof body.schoolName === 'string' ? body.schoolName : 'sua escola'

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: userProfile } = await adminClient
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    const schoolId = userProfile?.school_id
    if (!schoolId) return NextResponse.json({ error: 'Escola não encontrada.' }, { status: 403 })

    const { data: school } = await adminClient
      .from('schools')
      .select('plan')
      .eq('id', schoolId)
      .single()

    const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'ai_assistant')
    if (!permissao.allowed) {
      return NextResponse.json(
        { error: 'Assistente IA disponível nos planos Pro, Scale e Enterprise.' },
        { status: 403 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Configuração inválida.' }, { status: 500 })

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt(profile, schoolName, school?.plan ?? 'pro') },
        { role: 'user', content: message },
      ],
    })
    const reply = completion.choices[0]?.message?.content ?? ''

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
