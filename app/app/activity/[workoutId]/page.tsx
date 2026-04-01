'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, Clock, Zap, Flame } from 'lucide-react'
import Link from 'next/link'
import type { CompletedWorkout, CompletedSet } from '@/types/database'

export default function WorkoutDetailPage({ params }: { params: Promise<{ workoutId: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [workout, setWorkout] = useState<CompletedWorkout | null>(null)
  const [sets, setSets] = useState<CompletedSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workoutId, setWorkoutId] = useState<string | null>(null)

  // Unwrap params in useEffect since they're now async in Next.js 16
  useEffect(() => {
    params.then((p) => setWorkoutId(p.workoutId))
  }, [params])

  useEffect(() => {
    if (!workoutId) return

    const fetchWorkoutDetail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Fetch workout
        const { data: workoutData, error: workoutError } = await supabase
          .from('completed_workouts')
          .select('*')
          .eq('id', workoutId)
          .eq('user_id', user.id)
          .single()

        if (workoutError || !workoutData) {
          setError('Workout not found')
          return
        }

        setWorkout(workoutData as CompletedWorkout)

        // Fetch all sets for this workout
        const { data: setsData, error: setsError } = await supabase
          .from('completed_sets')
          .select('*')
          .eq('completed_workout_id', workoutId)
          .order('exercise_index, set_number')

        if (setsError) {
          console.error('[v0] Error fetching sets:', setsError)
          setSets([])
        } else {
          setSets((setsData || []) as CompletedSet[])
        }
      } catch (err) {
        console.error('[v0] Error loading workout detail:', err)
        setError('An error occurred while loading the workout')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkoutDetail()
  }, [workoutId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild size="sm">
          <Link href="/app/activity">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activity
          </Link>
        </Button>
        <Card className="p-8 flex items-center justify-center">
          <Spinner />
        </Card>
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild size="sm">
          <Link href="/app/activity">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activity
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{error || 'Workout not found'}</p>
        </Card>
      </div>
    )
  }

  // Group sets by exercise
  const setsByExercise: { [key: number]: CompletedSet[] } = {}
  sets.forEach((set) => {
    const exerciseIdx = set.exercise_index || 0
    if (!setsByExercise[exerciseIdx]) {
      setsByExercise[exerciseIdx] = []
    }
    setsByExercise[exerciseIdx].push(set)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" asChild size="sm">
            <Link href="/app/activity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{workout.name}</h1>
            <p className="text-muted-foreground mt-2">
              {new Date(workout.completed_at || workout.started_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{workout.duration_minutes || '—'}</span>
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
              <span className="text-2xl font-bold">{workout.total_sets}</span>
              <span className="text-muted-foreground">sets</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Reps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{workout.total_reps}</span>
              <span className="text-muted-foreground">reps</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{(workout.total_volume / 1000).toFixed(1)}</span>
              <span className="text-muted-foreground">k lbs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ratings */}
      <div className="grid gap-4 md:grid-cols-3">
        {workout.effort_level && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Effort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{workout.effort_level}/10</p>
            </CardContent>
          </Card>
        )}

        {workout.energy_level && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Energy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{workout.energy_level}/5</p>
            </CardContent>
          </Card>
        )}

        {/* Note: soreness_rating would go here if it's in the CompletedWorkout schema */}
      </div>

      {/* Notes */}
      {workout.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Sets */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Completed Sets</h2>

        {sets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No sets recorded for this workout</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(setsByExercise).map(([exerciseIdx, exerciseSets]) => (
              <Card key={exerciseIdx} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">
                    Exercise {parseInt(exerciseIdx) + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exerciseSets.map((set, idx) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            Set {set.set_number}
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Reps</p>
                            <p className="font-semibold">{set.reps}</p>
                          </div>
                          {set.weight && (
                            <div>
                              <p className="text-muted-foreground text-xs">Weight</p>
                              <p className="font-semibold">
                                {set.weight} {set.weight_unit}
                              </p>
                            </div>
                          )}
                          {set.rpe && (
                            <div>
                              <p className="text-muted-foreground text-xs">RPE</p>
                              <p className="font-semibold">{set.rpe}</p>
                            </div>
                          )}
                          {set.rest_seconds && (
                            <div>
                              <p className="text-muted-foreground text-xs">Rest</p>
                              <p className="font-semibold">{set.rest_seconds}s</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
