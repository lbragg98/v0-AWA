import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dumbbell, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, check onboarding status and redirect
  if (user) {
    const { data: fitnessProfile } = await supabase
      .from('fitness_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (fitnessProfile?.onboarding_completed) {
      redirect('/app/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-foreground" />
          <span className="text-xl font-bold text-foreground">Forge</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Forge Your
            <span className="block">Strongest Self</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Track your workouts, visualize muscle progress, and level up your fitness journey with an interactive body map and gamified progression system.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">
                I have an account
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        Built for those who forge their own path.
      </footer>
    </div>
  )
}
