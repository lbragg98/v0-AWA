import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileBodyMap } from '@/components/profile/profile-body-map'

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

  // Fetch muscle groups and progress
  const { data: muscleGroups } = await supabase
    .from('muscle_groups')
    .select('*')
    .order('name')

  const { data: muscleProgress } = await supabase
    .from('muscle_progress')
    .select('*')
    .eq('user_id', user?.id)

  // Create progress map
  const progressMap = new Map(
    muscleProgress?.map(p => [p.muscle_group_id, p]) || []
  )

  // Combine for display
  const muscleData = muscleGroups?.map(group => {
    const userProgress = progressMap.get(group.id)
    return {
      id: userProgress?.id || '',
      muscleGroupId: group.id,
      muscleName: group.slug,
      displayName: group.display_name,
      xp: userProgress?.xp || 0,
      level: userProgress?.level || 0,
      tier: userProgress?.tier || 'unawakened',
      weeklyVolume: userProgress?.weekly_volume || 0,
      strengthScore: Number(userProgress?.strength_score) || 0,
      consistencyScore: Number(userProgress?.consistency_score) || 0,
      recoveryScore: Number(userProgress?.recovery_score) || 0,
      lastTrainedAt: userProgress?.last_trained_at || null,
      bodySide: group.body_side as 'front' | 'back' | 'both',
    }
  }) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Track your muscle development and manage your account
        </p>
      </div>

      {/* Body Map - Featured Section */}
      <ProfileBodyMap muscleProgress={muscleData} />

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
              <p className="text-sm font-medium text-muted-foreground">Height</p>
              <p className="text-foreground">{fitnessProfile?.height ? `${fitnessProfile.height} ${fitnessProfile.height_unit}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weight</p>
              <p className="text-foreground">{fitnessProfile?.weight ? `${fitnessProfile.weight} ${fitnessProfile.weight_unit}` : '-'}</p>
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
