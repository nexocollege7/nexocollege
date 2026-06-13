import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl

  // Detecta subdominio em nexocollege.com.br
  // Ex: academiabiblia.nexocollege.com.br -> subdominio = 'academiabiblia'
  const isNexoCollegeDomain = host.endsWith('.nexocollege.com.br')
  const isWww = host.startsWith('www.')
  const isApex = host === 'nexocollege.com.br'

  if (isNexoCollegeDomain && !isWww) {
    // Rotas de API nunca devem ser reescritas para vitrine
    if (url.pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    const subdomain = host.replace('.nexocollege.com.br', '')
    // Reescreve internamente para /vitrine/[slug] sem redirecionar
    const rewriteUrl = url.clone()
    rewriteUrl.pathname = '/vitrine/' + subdomain + (url.pathname === '/' ? '' : url.pathname)
    return NextResponse.rewrite(rewriteUrl)
  }

  // Rotas de API nunca devem ser interceptadas pelo middleware
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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
    url.pathname.startsWith('/api/webhook-upgrade') ||
    url.pathname.startsWith('/api/webhook')

  const isMasterRoute = url.pathname.startsWith('/master')

  if (isMasterRoute) {
    if (!user) {
      const redirect = url.clone()
      redirect.pathname = '/login'
      return NextResponse.redirect(redirect)
    }
    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL
    if (user.email !== masterEmail) {
      const redirect = url.clone()
      redirect.pathname = '/dashboard'
      return NextResponse.redirect(redirect)
    }
  }

  if (!user && !isPublicRoute) {
    const redirect = url.clone()
    redirect.pathname = '/login'
    return NextResponse.redirect(redirect)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
