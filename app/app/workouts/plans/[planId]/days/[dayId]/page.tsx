import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutDay, WorkoutExercise, ExerciseLibrary } from '@/types/database'

export default function WorkoutDayDetailPage({ params }: { params: { planId: string; dayId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [day, setDay] = useState<WorkoutDay | null>(null)
  const [exercises, setExercises] = useState<(WorkoutExercise & { exercise?: ExerciseLibrary })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDayDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Verify plan ownership
        const { data: plan } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('id', params.planId)
          .eq('user_id', user.id)
          .single()

        if (!plan) {
          router.push('/app/workouts')
          return
        }

        // Fetch workout day
        const { data: dayData, error: dayError } = await supabase
          .from('workout_days')
          .select('*')
          .eq('id', params.dayId)
          .eq('workout_plan_id', params.planId)
          .single()

        if (dayError || !dayData) {
          setError('Workout day not found')
          return
        }

        setDay(dayData as WorkoutDay)

        // Fetch exercises for this day
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_day_id', params.dayId)
          .order('order_index')

        if (exercisesError) {
          console.error('[v0] Error fetching exercises:', exercisesError)
          setError('Failed to load exercises')
          return
        }

        // Fetch exercise library data for each exercise
        if (exercisesData && exercisesData.length > 0) {
          const exerciseIds = (exercisesData as WorkoutExercise[]).map((e) => e.exercise_id)
          const { data: libraryData } = await supabase
            .from('exercise_library')
            .select('*')
            .in('id', exerciseIds)

          const libraryMap = new Map((libraryData || []).map((e) => [e.id, e]))

          const enrichedExercises = (exercisesData as WorkoutExercise[]).map((ex) => ({
            ...ex,
            exercise: libraryMap.get(ex.exercise_id),
          }))

          setExercises(enrichedExercises)
        } else {
          setExercises([])
        }
      } catch (err) {
        console.error('[v0] Error loading day details:', err)
        setError('An error occurred while loading the workout day')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDayDetails()
  }, [params.planId, params.dayId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild size="sm">
          <Link href={`/app/workouts/plans/${params.planId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plan
          </Link>
        </Button>
        <Card className="p-8 flex items-center justify-center">
          <Spinner />
        </Card>
      </div>
    )
  }

  if (error || !day) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild size="sm">
          <Link href={`/app/workouts/plans/${params.planId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plan
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{error || 'Workout day not found'}</p>
        </Card>
      </div>
    )
  }

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const totalEstimatedDuration = day.estimated_duration || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" asChild size="sm">
            <Link href={`/app/workouts/plans/${params.planId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{day.name}</h1>
            {day.target_muscles && day.target_muscles.length > 0 && (
              <p className="text-muted-foreground mt-2">Focus: {(day.target_muscles as string[]).join(', ')}</p>
            )}
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={`/app/workouts/plans/${params.planId}/start?dayId=${params.dayId}`}>
            <Zap className="mr-2 h-4 w-4" />
            Start Workout
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Estimated Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalEstimatedDuration}</span>
              <span className="text-muted-foreground">min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Sets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{totalSets}</span>
              <span className="text-muted-foreground">sets</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{exercises.length}</span>
              <span className="text-muted-foreground">exercises</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Exercises</h2>
          <p className="text-muted-foreground text-sm mt-1">All exercises for this workout day</p>
        </div>

        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No exercises added to this workout day yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, idx) => (
              <Card key={exercise.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-medium">
                          {idx + 1}.
                        </span>
                        <h3 className="text-lg font-semibold">{exercise.exercise?.name || 'Unknown Exercise'}</h3>
                        {exercise.exercise_type && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.exercise_type}
                          </Badge>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Exercise Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Sets</p>
                      <p className="text-lg font-bold">{exercise.sets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reps</p>
                      <p className="text-lg font-bold">
                        {exercise.reps_min === exercise.reps_max
                          ? exercise.reps_min
                          : `${exercise.reps_min}-${exercise.reps_max}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rest</p>
                      <p className="text-lg font-bold">{exercise.rest_seconds}s</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Difficulty</p>
                      <p className="text-lg font-bold capitalize">{exercise.exercise?.difficulty || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t">
        <Button asChild size="lg" className="w-full">
          <Link href={`/app/workouts/plans/${params.planId}/start?dayId=${params.dayId}`}>
            <Zap className="mr-2 h-4 w-4" />
            Start Workout
          </Link>
        </Button>
      </div>
    </div>
  )
}
