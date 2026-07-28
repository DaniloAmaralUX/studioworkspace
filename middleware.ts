import { next } from '@vercel/functions'
import {
  hasValidStudioSession,
  studioAuthConfigured,
} from './api/_lib/studioAuth.js'

const PUBLIC_PATHS = new Set([
  '/login',
  '/api/health',
  '/api/auth/studio-login',
  '/api/auth/studio-logout',
  '/api/auth/studio-status',
])

function unauthorizedApi(): Response {
  return Response.json(
    {
      error: {
        code: 'studio_auth_required',
        message: 'Entre no Studio para continuar.',
      },
    },
    {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url)
  if (PUBLIC_PATHS.has(url.pathname)) return next()

  if (
    studioAuthConfigured() &&
    hasValidStudioSession(request.headers.get('cookie'))
  ) {
    return next()
  }

  if (url.pathname.startsWith('/api/')) return unauthorizedApi()

  const loginUrl = new URL('/login', url)
  const nextPath = `${url.pathname}${url.search}`
  if (nextPath !== '/') loginUrl.searchParams.set('next', nextPath)
  return Response.redirect(loginUrl, 302)
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!assets/|favicon.ico|robots.txt).*)'],
}
