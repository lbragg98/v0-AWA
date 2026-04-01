'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dumbbell, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  OnboardingData,
  EXPERIENCE_LEVELS,
  PRIMARY_GOALS,
  EQUIPMENT_OPTIONS,
  DAYS_OF_WEEK,
  SESSION_DURATIONS,
} from '@/types/onboarding'

const TOTAL_STEPS = 5

export function OnboardingForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    age: null,
    height_in: null,
    weight_lbs: null,
    experience_level: 'beginner',
    primary_goal: 'general_fitness',
    available_equipment: ['bodyweight'],
    preferred_training_days: [1, 3, 5],
    preferred_session_minutes: 60,
  })

  const updateField = <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleEquipment = (equipment: string) => {
    setFormData((prev) => ({
      ...prev,
      available_equipment: prev.available_equipment.includes(equipment)
        ? prev.available_equipment.filter((e) => e !== equipment)
        : [...prev.available_equipment, equipment],
    }))
  }

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      preferred_training_days: prev.preferred_training_days.includes(day)
        ? prev.preferred_training_days.filter((d) => d !== day)
        : [...prev.preferred_training_days, day].sort((a, b) => a - b),
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.full_name.trim().length >= 2
      case 2:
        return formData.age && formData.age > 0 && formData.age < 120
      case 3:
        return true
      case 4:
        return formData.available_equipment.length > 0
      case 5:
        return formData.preferred_training_days.length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      const today = new Date()
      const birthYear = today.getFullYear() - (formData.age || 25)
      const dateOfBirth = `${birthYear}-01-01`

      const { error: fitnessError } = await supabase
        .from('fitness_profiles')
        .update({
          experience_level: formData.experience_level,
          primary_goal: formData.primary_goal,
          workout_frequency: formData.preferred_training_days.length,
          preferred_workout_duration: formData.preferred_session_minutes,
          available_equipment: formData.available_equipment,
          weight: formData.weight_lbs,
          weight_unit: 'lbs',
          height: formData.height_in,
          height_unit: 'in',
          date_of_birth: dateOfBirth,
          preferred_training_days: formData.preferred_training_days,
          onboarding_completed: true,
        })
        .eq('user_id', user.id)

      if (fitnessError) throw fitnessError

      router.push('/app/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-foreground" />
          <span className="text-xl font-bold text-foreground">Forge</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
      </header>

      <div className="px-6 py-2">
        <Progress value={progress} className="h-2" />
      </div>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Let&apos;s get to know you</CardTitle>
                <CardDescription>What should we call you?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="Enter your name"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Your stats</CardTitle>
                <CardDescription>
                  This helps us personalize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min={13}
                    max={100}
                    value={formData.age || ''}
                    onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (inches)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="70"
                      min={48}
                      max={96}
                      value={formData.height_in || ''}
                      onChange={(e) => updateField('height_in', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="185"
                      min={75}
                      max={700}
                      value={formData.weight_lbs || ''}
                      onChange={(e) => updateField('weight_lbs', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Experience & Goals</CardTitle>
                <CardDescription>
                  Tell us about your fitness background and what you want to achieve
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Experience Level</Label>
                  <div className="grid gap-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => updateField('experience_level', level.value)}
                        className={cn(
                          'flex flex-col items-start rounded-lg border border-border p-4 text-left transition-colors',
                          formData.experience_level === level.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <span className="font-medium text-foreground">{level.label}</span>
                        <span className="text-sm text-muted-foreground">{level.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Primary Goal</Label>
                  <div className="grid gap-2">
                    {PRIMARY_GOALS.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => updateField('primary_goal', goal.value)}
                        className={cn(
                          'flex flex-col items-start rounded-lg border border-border p-4 text-left transition-colors',
                          formData.primary_goal === goal.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <span className="font-medium text-foreground">{goal.label}</span>
                        <span className="text-sm text-muted-foreground">{goal.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Equipment</CardTitle>
                <CardDescription>
                  Select all the equipment you have access to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT_OPTIONS.map((equipment) => (
                    <button
                      key={equipment.value}
                      type="button"
                      onClick={() => toggleEquipment(equipment.value)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors',
                        formData.available_equipment.includes(equipment.value)
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {formData.available_equipment.includes(equipment.value) && (
                        <Check className="h-4 w-4" />
                      )}
                      {equipment.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Schedule</CardTitle>
                <CardDescription>
                  When do you prefer to train?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Training Days</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors',
                          formData.preferred_training_days.includes(day.value)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Session Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {SESSION_DURATIONS.map((duration) => (
                      <button
                        key={duration.value}
                        type="button"
                        onClick={() => updateField('preferred_session_minutes', duration.value)}
                        className={cn(
                          'rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors',
                          formData.preferred_session_minutes === duration.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-destructive">{error}</p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(currentStep === 1 && 'invisible')}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
