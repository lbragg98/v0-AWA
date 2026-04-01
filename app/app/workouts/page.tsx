import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ExerciseLibraryBrowser } from '@/components/workouts/exercise-library-browser'
import { PlanCard } from '@/components/workouts/plan-card'
import { Plus, BookOpen, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutPlan, ExerciseLibrary } from '@/types/database'

export default async function WorkoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch exercise library and workout plans in parallel
  const [exercisesResult, plansResult, planDaysResult] = await Promise.all([
    supabase
      .from('exercise_library')
      .select('*')
      .order('name'),
    supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('workout_days')
      .select('workout_plan_id, count'),
  ])

  const exercises = (exercisesResult.data || []) as ExerciseLibrary[]
  const plans = (plansResult.data || []) as WorkoutPlan[]

  // Count workout days per plan
  const dayCountByPlan: Record<string, number> = {}
  if (planDaysResult.data) {
    planDaysResult.data.forEach((row: any) => {
      dayCountByPlan[row.workout_plan_id] = row.count || 0
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workouts</h1>
          <p className="mt-1 text-muted-foreground">
            Build plans and browse exercises
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/app/workouts/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="exercises" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Exercise Library
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {plans.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  daysCount={dayCountByPlan[plan.id] || 0}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No plans yet</h3>
              <p className="mt-1 text-muted-foreground">
                Create your first workout plan to get started
              </p>
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
