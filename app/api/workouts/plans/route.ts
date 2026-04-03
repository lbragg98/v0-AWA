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

    console.log('[v0] Creating workout plan:', { planName: plan.name, goal: plan.goal })

    const trainingDays = Array.isArray(plan.trainingDays)
      ? plan.trainingDays
          .map((day: number | string) => Number(day))
          .filter((day: number) => Number.isInteger(day) && day >= 0 && day <= 6)
          .sort((a: number, b: number) => a - b)
      : []

    // Create workout plan
    const { data: createdPlan, error: planError } = await supabase
      .from('workout_plans')
      .insert([
        {
          user_id: user.id,
          name: plan.name,
          goal: plan.goal || 'general_fitness',
          split_type: plan.splitType || 'custom',
          days_per_week: workoutDays.length,
          experience_level: plan.experienceLevel || 'beginner',
          is_active: true,
        },
      ])
      .select()
      .single()

    if (planError) {
      console.error('[v0] Error creating plan:', planError)
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
    }

    console.log('[v0] Created plan:', createdPlan.id)

    if (trainingDays.length > 0) {
      const { error: profileUpdateError } = await supabase
        .from('fitness_profiles')
        .update({
          workout_frequency: trainingDays.length,
          preferred_training_days: trainingDays.map(String),
        })
        .eq('user_id', user.id)

      if (profileUpdateError) {
        console.error('[v0] Error updating preferred training days:', profileUpdateError)
      }
    }

    // Create workout days
    for (const day of workoutDays) {
      console.log('[v0] Creating workout day:', { name: day.name, exercises: day.exercises?.length || 0 })
      
      const { data: createdDay, error: dayError } = await supabase
        .from('workout_days')
        .insert([
          {
            workout_plan_id: createdPlan.id,
            day_number: day.dayNumber || 1,
            name: day.name,
            target_muscles: day.targetMuscles || [],
            estimated_duration: day.estimated_minutes || 60,
          },
        ])
        .select()
        .single()

      if (dayError) {
        console.error('[v0] Error creating workout day:', dayError)
        continue
      }

      console.log('[v0] Created workout day:', createdDay.id)

      // Create exercises for this day if provided
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
          console.error('[v0] Error creating workout exercises:', exerciseError)
        } else {
          console.log('[v0] Created', exercisesToInsert.length, 'exercises for day', createdDay.id)
        }
      }
    }

    console.log('[v0] Plan creation complete:', createdPlan.id)
    return NextResponse.json({ id: createdPlan.id })
  } catch (error) {
    console.error('[v0] Error in POST /api/workouts/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
