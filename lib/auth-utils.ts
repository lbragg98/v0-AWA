import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifies user authentication and onboarding status
 * Used in layout components to protect routes
 */
export async function verifyAuth(requireOnboarded: boolean = false) {
  const supabase = await createClient()

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
}

/**
 * Checks if user exists and has completed onboarding
 * Returns null if not authenticated
 */
export async function getAuthStatus() {
  const supabase = await createClient()

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
}
