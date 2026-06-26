import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas permitidas para alunos
const ROTAS_ALUNO = [
  '/dashboard/meus-cursos',
  '/dashboard/aprender',
  '/dashboard/favoritos',
  '/dashboard/certificados',
  '/dashboard/mensagens',
  '/dashboard/ajuda',
  '/dashboard/perfil',
  '/dashboard/minhas-mentorias',
  '/dashboard/comunicados',
]

function alunoTemAcesso(pathname: string): boolean {
  return ROTAS_ALUNO.some(rota => pathname === rota || pathname.startsWith(rota + '/'))
}

// Professor convidado só acessa a própria mentoria — nada do painel da escola
const ROTAS_MENTOR_GUEST = ['/dashboard/minha-mentoria']

function mentorGuestTemAcesso(pathname: string): boolean {
  return ROTAS_MENTOR_GUEST.some(rota => pathname === rota || pathname.startsWith(rota + '/'))
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl

  const isNexoCollegeDomain = host.endsWith('.nexocollege.com.br')
  const isWww = host.startsWith('www.')

  if (isNexoCollegeDomain && !isWww) {
    if (url.pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    const subdomain = host.replace('.nexocollege.com.br', '')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexocollege.com.br'
    // Login no subdomínio → vitrine login no domínio principal (evita problema de cookie cross-domain)
    if (url.pathname === '/login' || url.pathname.startsWith('/login/')) {
      return NextResponse.redirect(new URL(`/vitrine/${subdomain}/login`, appUrl))
    }
    const rewriteUrl = url.clone()
    // Evitar double-rewrite: se o path já começa com /vitrine/${subdomain}, servir direto
    if (!url.pathname.startsWith('/vitrine/' + subdomain)) {
      rewriteUrl.pathname = '/vitrine/' + subdomain + (url.pathname === '/' ? '' : url.pathname)
    }
    return NextResponse.rewrite(rewriteUrl)
  }

  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            supabaseResponse.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute =
    url.pathname === '/' ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/cadastro') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/vitrine/') ||
    url.pathname.startsWith('/api/register-school') ||
    url.pathname.startsWith('/api/webhook') ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname.startsWith('/esqueci-senha') ||
    url.pathname.startsWith('/redefinir-senha') ||
    url.pathname === '/suspensa'

  const isMasterRoute = url.pathname.startsWith('/master')
  const isDashboardRoute = url.pathname.startsWith('/dashboard')

  // Rota master: só o master email
  if (isMasterRoute) {
    if (!user) {
      const redirect = url.clone()
      redirect.pathname = '/login'
      return NextResponse.redirect(redirect)
    }
    const masterEmail = process.env.MASTER_EMAIL
    if (user.email !== masterEmail) {
      const redirect = url.clone()
      redirect.pathname = '/dashboard'
      return NextResponse.redirect(redirect)
    }
    return supabaseResponse
  }

  // Usuário não logado tentando acessar rota protegida
  if (!user && !isPublicRoute) {
    const redirect = url.clone()
    redirect.pathname = '/login'
    return NextResponse.redirect(redirect)
  }

  // Verificar role para rotas do dashboard
  if (user && isDashboardRoute) {
    // Master não deve acessar dashboard
    const masterEmailCheck = process.env.MASTER_EMAIL
    if (user.email === masterEmailCheck) {
      const redirect = url.clone()
      redirect.pathname = '/master'
      return NextResponse.redirect(redirect)
    }

    // Buscar role do usuário
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'student'

    // Owner com escola suspensa → redirecionar para /suspensa
    if (role === 'owner' || role === 'admin') {
      const { data: school } = await supabase
        .from('schools')
        .select('suspended_at')
        .eq('owner_id', user.id)
        .single()
      if (school?.suspended_at) {
        const redirect = url.clone()
        redirect.pathname = '/suspensa'
        return NextResponse.redirect(redirect)
      }
    }

    // Aluno tentando acessar rota de admin
    if (role === 'student' && !alunoTemAcesso(url.pathname)) {
      const redirect = url.clone()
      redirect.pathname = '/dashboard/meus-cursos'
      return NextResponse.redirect(redirect)
    }

    // Professor convidado só acessa o ambiente restrito da própria mentoria
    if (role === 'mentor_guest' && !mentorGuestTemAcesso(url.pathname)) {
      const redirect = url.clone()
      redirect.pathname = '/dashboard/minha-mentoria'
      return NextResponse.redirect(redirect)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
