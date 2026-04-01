import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanBuilder } from '@/components/workouts/plan-builder'
import type { ExerciseLibrary } from '@/types/database'

export default async function NewPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch exercise library
  const { data: exercises, error } = await supabase
    .from('exercise_library')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching exercises:', error)
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load exercises</p>
      </div>
    )
  }

  return (
    <PlanBuilder
      exercises={(exercises || []) as ExerciseLibrary[]}
      isEditing={false}
    />
  )
}
