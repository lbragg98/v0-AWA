import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const isAuthRoute = pathname.startsWith('/auth')
  const isPublicRoute = pathname === '/' || isAuthRoute

  // Protected app routes
  const isAppRoute = pathname.startsWith('/app')
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  // If user is not logged in and trying to access protected routes
  if (!user && (isAppRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in
  if (user) {
    // Check if user needs onboarding by looking at fitness_profiles
    // We'll check onboarding_completed field
    const { data: fitnessProfile } = await supabase
      .from('fitness_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    const hasCompletedOnboarding = fitnessProfile?.onboarding_completed === true

    // Redirect authenticated users away from auth pages
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = hasCompletedOnboarding ? '/app/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }

    // If user hasn't completed onboarding and is trying to access app routes
    if (!hasCompletedOnboarding && isAppRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // If user has completed onboarding and is on onboarding page, redirect to dashboard
    if (hasCompletedOnboarding && isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/app/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
