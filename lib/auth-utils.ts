import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifies user authentication and onboarding status
 * Used in layout components to protect routes
 */
export async function verifyAuth(requireOnboarded: boolean = false) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error('[v0] Supabase client is undefined')
      redirect('/auth/login')
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/login')
    }

    if (requireOnboarded) {
      const { data: fitnessProfile, error } = await supabase
        .from('fitness_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (error || !fitnessProfile?.onboarding_completed) {
        redirect('/onboarding')
      }
    }

    return user
  } catch (error) {
    console.error('[v0] Error in verifyAuth:', error)
    redirect('/auth/login')
  }
}

/**
 * Checks if user exists and has completed onboarding
 * Returns null if not authenticated or if there's an error
 */
export async function getAuthStatus() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error('[v0] Supabase client is undefined')
      return null
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: fitnessProfile } = await supabase
      .from('fitness_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    return {
      user,
      hasCompletedOnboarding: fitnessProfile?.onboarding_completed === true,
    }
  } catch (error) {
    console.error('[v0] Error in getAuthStatus:', error)
    return null
  }
}
