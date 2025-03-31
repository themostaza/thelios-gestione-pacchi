import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Ottenere il percorso richiesto
  const path = request.nextUrl.pathname

  // Creazione del client Supabase per il middleware
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set() {
        // Non possiamo impostare i cookie nel middleware
      },
      remove() {
        // Non possiamo rimuovere i cookie nel middleware
      },
    },
  })

  // Verifica autenticazione utilizzando getUser() invece di getSession() per maggiore sicurezza
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  // Se l'utente è autenticato, verifica se è admin direttamente da Supabase
  let isAdmin = false
  if (isAuthenticated && user) {
    const { data: profile } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).single()

    isAdmin = !!profile?.is_admin
  }

  // Funzione helper per verificare se un percorso corrisponde a un pattern
  const matchesPath = (patterns: string[], currentPath: string) => {
    return patterns.some((pattern) => {
      if (pattern.endsWith('/**')) {
        // Gestione speciale per pattern con wildcard **
        const basePath = pattern.replace('/**', '')
        return currentPath === basePath || currentPath.startsWith(`${basePath}/`)
      }
      return currentPath.startsWith(pattern)
    })
  }

  // Percorsi che richiedono ruolo admin
  const adminRequiredPaths = ['/dashboard', '/accounts']

  // Regola 1: Se l'utente è autenticato e cerca di accedere a /auth, reindirizzare a /deliveries
  if (isAuthenticated && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/deliveries', request.url))
  }

  // Regola 2: Se l'utente non è autenticato, può accedere solo a /auth
  if (!isAuthenticated && !matchesPath(['/auth'], path)) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Regola 3: Se l'utente non è admin, non può accedere a /dashboard né a /accounts
  if (isAuthenticated && !isAdmin && matchesPath(adminRequiredPaths, path)) {
    return NextResponse.redirect(new URL('/deliveries', request.url))
  }

  // Se tutto è a posto, continuare con la richiesta
  return NextResponse.next()
}

// Specificare i percorsi su cui il middleware deve essere eseguito
export const config = {
  matcher: [
    '/auth/:path*',
    '/deliveries/:path*',
    '/dashboard/:path*',
    '/accounts/:path*',
    '/profile/:path*',
    '/delivery/:path*', // Aggiunto per supportare il pattern /delivery/**
    // Aggiungere altri percorsi se necessario
  ],
}
