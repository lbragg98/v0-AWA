import { getAuthStatus } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authStatus = await getAuthStatus()

  // If not logged in, redirect to login
  if (!authStatus) {
    redirect('/auth/login')
  }

  // If already onboarded, redirect to dashboard
  if (authStatus.hasCompletedOnboarding) {
    redirect('/app/dashboard')
  }

  return children
}
