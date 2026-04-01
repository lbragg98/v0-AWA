import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkoutLogger } from '@/components/workouts/workout-logger'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutDay, WorkoutExercise, ExerciseLibrary } from '@/types/database'

interface StartWorkoutPageProps {
  params: {
    planId: string
  }
}

export default async function StartWorkoutPage({ params }: StartWorkoutPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch workout days for the plan
  const { data: workoutDays, error: daysError } = await supabase
    .from('workout_days')
    .select('*')
    .eq('workout_plan_id', params.planId)
    .order('day_number')

  if (daysError || !workoutDays || workoutDays.length === 0) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workouts
          </Link>
        </Button>

        <Card className="p-8 border-amber-500/50 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">No workouts found</h3>
              <p className="mt-1 text-sm text-amber-800">
                This workout plan doesn&apos;t have any workout days yet.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // For now, start with the first day
  // In the future, could show day selection UI
  const selectedDay = workoutDays[0] as WorkoutDay

  // Fetch workout exercises for the selected day
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercise_library(*)
    `)
    .eq('workout_day_id', selectedDay.id)
    .order('order_index')

  if (exercisesError) {
    console.error('Error fetching exercises:', exercisesError)
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workouts
          </Link>
        </Button>

        <Card className="p-8 border-red-500/50 bg-red-500/5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading workout</h3>
              <p className="mt-1 text-sm text-red-800">
                Failed to load the workout exercises. Please try again.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!workoutExercises || workoutExercises.length === 0) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workouts
          </Link>
        </Button>

        <Card className="p-8 border-amber-500/50 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">No exercises</h3>
              <p className="mt-1 text-sm text-amber-800">
                No exercises have been added to this workout day yet.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Map exercises with their library data
  const exercisesWithData = workoutExercises.map((we: any) => ({
    ...we,
    exercise: we.exercise?.[0] || null,
  })) as (WorkoutExercise & { exercise?: ExerciseLibrary })[]

  const workoutDayWithExercises: WorkoutDay & {
    workout_exercises?: (WorkoutExercise & { exercise?: ExerciseLibrary })[]
  } = {
    ...selectedDay,
    workout_exercises: exercisesWithData,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{selectedDay.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {exercisesWithData.length} exercises
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Link>
        </Button>
      </div>

      <WorkoutLogger workoutDay={workoutDayWithExercises} planId={params.planId} />
    </div>
  )
}
