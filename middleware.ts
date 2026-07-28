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

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

function nextWithApiHeaders(): Response {
  return next({ headers: NO_STORE_HEADERS })
}

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
      headers: NO_STORE_HEADERS,
    },
  )
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url)
  if (PUBLIC_PATHS.has(url.pathname)) {
    return url.pathname.startsWith('/api/') ? nextWithApiHeaders() : next()
  }

  if (
    studioAuthConfigured() &&
    hasValidStudioSession(request.headers.get('cookie'))
  ) {
    return url.pathname.startsWith('/api/') ? nextWithApiHeaders() : next()
  }

  if (url.pathname.startsWith('/api/')) return unauthorizedApi()

  const loginUrl = new URL('/login', url)
  const nextPath = `${url.pathname}${url.search}`
  if (nextPath !== '/') loginUrl.searchParams.set('next', nextPath)
  return new Response(null, {
    status: 302,
    headers: {
      Location: loginUrl.toString(),
      ...NO_STORE_HEADERS,
    },
  })
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!assets/|favicon.ico|robots.txt).*)'],
}
