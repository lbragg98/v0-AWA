import { getAuthStatus } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authStatus = await getAuthStatus()

  // If user is already logged in, redirect them appropriately
  if (authStatus) {
    if (authStatus.hasCompletedOnboarding) {
      redirect('/app/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  return children
}
