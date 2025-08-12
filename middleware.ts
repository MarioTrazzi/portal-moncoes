import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar se está tentando acessar rotas protegidas
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Verificar se tem token no localStorage (será verificado no lado cliente)
    // Por enquanto, apenas redirecionar para login se não estiver logado
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Se está tentando acessar a raiz, redirecionar para dashboard ou login
  if (request.nextUrl.pathname === '/') {
    const token = request.cookies.get('auth_token')?.value
    
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
