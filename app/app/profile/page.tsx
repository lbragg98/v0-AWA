import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user?.id)
    .single()

  const { data: fitnessProfile } = await supabase
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-foreground">{profile?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-foreground">{user?.email || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fitness Profile</CardTitle>
            <CardDescription>Your fitness settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
              <p className="capitalize text-foreground">{fitnessProfile?.experience_level || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Primary Goal</p>
              <p className="capitalize text-foreground">{fitnessProfile?.primary_goal?.replace('_', ' ') || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Workout Frequency</p>
              <p className="text-foreground">{fitnessProfile?.workout_frequency || 0} days/week</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Session Duration</p>
              <p className="text-foreground">{fitnessProfile?.preferred_workout_duration || 60} minutes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
