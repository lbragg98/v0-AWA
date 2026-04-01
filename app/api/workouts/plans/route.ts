import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, workoutDays } = await request.json()

    // Validate input
    if (!plan.name) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    // Create workout plan
    const { data: createdPlan, error: planError } = await supabase
      .from('workout_plans')
      .insert([
        {
          user_id: user.id,
          name: plan.name,
          goal: plan.goal,
          split_type: 'custom',
          days_per_week: plan.trainingFrequency,
          experience_level: plan.experienceLevel,
          is_active: false,
        },
      ])
      .select()
      .single()

    if (planError) {
      console.error('Error creating plan:', planError)
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
    }

    // Create workout days and exercises
    for (const day of workoutDays) {
      // Create workout day
      const { data: createdDay, error: dayError } = await supabase
        .from('workout_days')
        .insert([
          {
            workout_plan_id: createdPlan.id,
            day_number: day.dayNumber,
            name: day.name,
            target_muscles: day.targetMuscles,
            estimated_duration: 60,
          },
        ])
        .select()
        .single()

      if (dayError) {
        console.error('Error creating workout day:', dayError)
        continue
      }

      // Create exercises for this day
      if (day.exercises && day.exercises.length > 0) {
        const exercisesToInsert = day.exercises.map((ex: any, idx: number) => ({
          workout_day_id: createdDay.id,
          exercise_id: ex.exerciseId,
          order_index: idx,
          sets: ex.sets,
          reps_min: ex.repsMin,
          reps_max: ex.repsMax,
          rest_seconds: ex.restSeconds,
          exercise_type: ex.exerciseType || 'main',
          notes: ex.notes || null,
        }))

        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert)

        if (exerciseError) {
          console.error('Error creating workout exercises:', exerciseError)
        }
      }
    }

    return NextResponse.json({ id: createdPlan.id })
  } catch (error) {
    console.error('Error in POST /api/workouts/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
