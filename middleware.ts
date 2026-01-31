import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-key-change-in-production'
)

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value

  // Proteger rutas del dashboard y settings
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/settings') ||
      request.nextUrl.pathname.startsWith('/dishes')) {
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Validar que el token no haya expirado
    try {
      await jwtVerify(sessionCookie, secret, { algorithms: ['HS256'] })
    } catch (error) {
      // Token inválido o expirado - limpiar cookie y redirigir a login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('session')
      return response
    }
  }

  // Redirigir a dashboard si ya está autenticado y va a login
  if (request.nextUrl.pathname === '/login' && sessionCookie) {
    try {
      await jwtVerify(sessionCookie, secret, { algorithms: ['HS256'] })
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      // Token expirado, permitir acceso a login
      const response = NextResponse.next()
      response.cookies.delete('session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/dishes/:path*', '/login'],
}
