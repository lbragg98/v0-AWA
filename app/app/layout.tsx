import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app/app-header'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Block access to the app if onboarding is not completed
  const { data: fitnessProfile } = await supabase
    .from('fitness_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (!fitnessProfile?.onboarding_completed) {
    redirect('/onboarding')
  }

  // Fetch user profile for the header
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-svh bg-background">
      <AppHeader 
        user={{
          email: user.email || '',
          fullName: profile?.full_name || null,
          avatarUrl: profile?.avatar_url || null,
        }}
      />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
