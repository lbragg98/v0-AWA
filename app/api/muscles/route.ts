import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all muscle groups
    const { data: muscleGroups, error: groupsError } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('name')

    if (groupsError) {
      console.error('Error fetching muscle groups:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch muscle groups' }, { status: 500 })
    }

    // Fetch user's muscle progress
    const { data: progress, error: progressError } = await supabase
      .from('muscle_progress')
      .select('*')
      .eq('user_id', user.id)

    if (progressError) {
      console.error('Error fetching muscle progress:', progressError)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Create a map of existing progress
    const progressMap = new Map(
      progress?.map(p => [p.muscle_group_id, p]) || []
    )

    // Combine muscle groups with progress (use defaults for missing)
    const muscleProgress = muscleGroups?.map(group => {
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
        strengthScore: userProgress?.strength_score || 0,
        consistencyScore: userProgress?.consistency_score || 0,
        recoveryScore: userProgress?.recovery_score || 0,
        lastTrainedAt: userProgress?.last_trained_at || null,
        bodySide: group.body_side,
      }
    }) || []

    return NextResponse.json({ muscleProgress })
  } catch (error) {
    console.error('Error in GET /api/muscles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
