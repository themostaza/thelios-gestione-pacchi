import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set() {},
      remove() {},
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  let isAdmin = false
  if (isAuthenticated && user) {
    const { data: profile } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).single()

    isAdmin = !!profile?.is_admin
  }

  const matchesPath = (patterns: string[], currentPath: string) => {
    return patterns.some((pattern) => {
      if (pattern.endsWith('/**')) {
        const basePath = pattern.replace('/**', '')
        return currentPath === basePath || currentPath.startsWith(`${basePath}/`)
      }
      return currentPath.startsWith(pattern)
    })
  }

  const adminRequiredPaths = ['/accounts']

  if (isAuthenticated && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/deliveries', request.url))
  }

  if (!isAuthenticated && !matchesPath(['/auth'], path)) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (isAuthenticated && !isAdmin && matchesPath(adminRequiredPaths, path)) {
    return NextResponse.redirect(new URL('/deliveries', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/deliveries/:path*', '/dashboard/:path*', '/accounts/:path*', '/profile/:path*', '/delivery/:path*'],
}
