'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ExerciseLibraryBrowser } from '@/components/workouts/exercise-library-browser'
import { PlanCard } from '@/components/workouts/plan-card'
import { TrainTodayPanel } from '@/components/workouts/train-today-panel'
import { GeneratedWorkoutDisplay } from '@/components/workouts/generated-workout-display'
import { Plus, BookOpen, Dumbbell, Zap } from 'lucide-react'
import Link from 'next/link'
import { generateWorkoutRecommendation, type RecommendationPreferences, type GeneratedWorkout } from '@/lib/workout-recommendation'
import { calculateUserReadiness } from '@/lib/recovery-readiness'
import { analyzeTrainingBalance } from '@/lib/training-balance'
import type { WorkoutPlan, ExerciseLibrary, FitnessProfile, MuscleProgress, CompletedWorkout, Goal } from '@/types/database'

export default function WorkoutsPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<any>(null)
  const [exercises, setExercises] = useState<ExerciseLibrary[]>([])
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [dayCountByPlan, setDayCountByPlan] = useState<Record<string, number>>({})
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(null)
  const [muscleProgress, setMuscleProgress] = useState<MuscleProgress[]>([])
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([])
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [readinessState, setReadinessState] = useState<string | null>(null)
  const [shouldDeload, setShouldDeload] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }
      setUser(authUser)

      // Fetch all data in parallel
      const [exercisesRes, plansRes, fitnessRes, muscleRes, workoutsRes, goalsRes] = await Promise.all([
        supabase.from('exercise_library').select('*').order('name'),
        supabase.from('workout_plans').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
        supabase.from('fitness_profiles').select('*').eq('user_id', authUser.id).single(),
        supabase.from('muscle_progress').select('*, muscle_group:muscle_groups(*)').eq('user_id', authUser.id),
        supabase.from('completed_workouts').select('*').eq('user_id', authUser.id).order('started_at', { ascending: false }).limit(10),
        supabase.from('goals').select('*').eq('user_id', authUser.id),
      ])

      setExercises((exercisesRes.data || []) as ExerciseLibrary[])
      setPlans((plansRes.data || []) as WorkoutPlan[])
      setFitnessProfile((fitnessRes.data || null) as FitnessProfile | null)
      setMuscleProgress((muscleRes.data || []) as MuscleProgress[])
      setWorkouts((workoutsRes.data || []) as CompletedWorkout[])
      setGoals((goalsRes.data || []) as Goal[])

      // Count days per plan
      const planDaysCounts: Record<string, number> = {}
      plansRes.data?.forEach((plan) => {
        planDaysCounts[plan.id] = Math.ceil(plan.days_per_week)
      })
      setDayCountByPlan(planDaysCounts)

      // Calculate readiness
      const readiness = calculateUserReadiness(
        (workoutsRes.data || []) as CompletedWorkout[],
        (muscleRes.data || []) as any[],
        (fitnessRes.data || null) as FitnessProfile | null
      )
      setReadinessState(readiness.state)

      // Calculate training balance to check for deload recommendation
      const balance = analyzeTrainingBalance(
        (muscleRes.data || []) as MuscleProgress[],
        (workoutsRes.data || []) as CompletedWorkout[],
        (goalsRes.data || []) as Goal[],
        (fitnessRes.data || null) as FitnessProfile | null
      )
      setShouldDeload(balance.deloadRecommendation.shouldDeload)
    }

    fetchData()
  }, [router, supabase])

  const handleGenerateWorkout = async (prefs: RecommendationPreferences) => {
    setIsGenerating(true)
    try {
      const workout = generateWorkoutRecommendation(prefs, exercises, fitnessProfile, muscleProgress)
      setGeneratedWorkout(workout)
    } catch (error) {
      console.error('[v0] Error generating workout:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workouts</h1>
          <p className="mt-1 text-muted-foreground">Build plans, get recommendations, and browse exercises</p>
        </div>
        <Button asChild size="lg">
          <Link href="/app/workouts/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="train-today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="train-today" className="gap-2">
            <Zap className="h-4 w-4" />
            Train Today
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="exercises" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Exercise Library
          </TabsTrigger>
        </TabsList>

        {/* Train Today Tab */}
        <TabsContent value="train-today" className="space-y-4">
          {shouldDeload && (
            <Card className="border-orange-500/30 bg-orange-500/5 p-4">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                Deload Week Recommended
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                Consider reducing volume and intensity this week for better recovery.
              </p>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TrainTodayPanel
                defaultEquipment={fitnessProfile?.available_equipment || ['bodyweight']}
                onGenerate={handleGenerateWorkout}
                isLoading={isGenerating}
                readinessState={readinessState || undefined}
              />
            </div>
            <div className="lg:col-span-2">
              <Card className="p-6">
                {generatedWorkout ? (
                  <GeneratedWorkoutDisplay workout={generatedWorkout} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">No workout generated yet</h3>
                    <p className="mt-1 text-muted-foreground">Select your preferences and click Generate to create a personalized workout</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {plans.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} daysCount={dayCountByPlan[plan.id] || 0} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No plans yet</h3>
              <p className="mt-1 text-muted-foreground">Create your first workout plan to get started</p>
              <Button asChild className="mt-4">
                <Link href="/app/workouts/plans/new">Create Plan</Link>
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Exercise Library Tab */}
        <TabsContent value="exercises">
          <Card className="p-6">
            <ExerciseLibraryBrowser exercises={exercises} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
