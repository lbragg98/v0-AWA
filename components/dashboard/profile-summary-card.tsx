'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Scale, Ruler, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Profile, FitnessProfile } from '@/types/database'
import { DAYS_OF_WEEK } from '@/types/onboarding'

interface ProfileSummaryCardProps {
  profile: Profile | null
  fitnessProfile: FitnessProfile | null
}

export function ProfileSummaryCard({ profile, fitnessProfile }: ProfileSummaryCardProps) {
  const formatGoal = (goal: string | undefined) => {
    if (!goal) return 'Not set'
    return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const formatExperience = (level: string | undefined) => {
    if (!level) return 'Not set'
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  const getTrainingDays = (days: number[] | undefined) => {
    if (!days || days.length === 0) return 'Not set'
    return days
      .sort((a, b) => a - b)
      .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label || '')
      .join(', ')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Profile
        </CardTitle>
        <CardDescription>Your fitness settings and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="capitalize">
            {formatExperience(fitnessProfile?.experience_level)}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {formatGoal(fitnessProfile?.primary_goal)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {fitnessProfile?.weight && (
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span>{fitnessProfile.weight} lb</span>
            </div>
          )}
          {fitnessProfile?.height && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span>{fitnessProfile.height} in</span>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Training Days</span>
            <span>{getTrainingDays(fitnessProfile?.preferred_training_days)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Session Length</span>
            <span>{fitnessProfile?.preferred_workout_duration || 60} min</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Equipment</span>
            <span className="text-right max-w-[150px] truncate">
              {fitnessProfile?.available_equipment?.length
                ? fitnessProfile.available_equipment.slice(0, 3).join(', ')
                : 'Not set'}
              {(fitnessProfile?.available_equipment?.length || 0) > 3 && '...'}
            </span>
          </div>
        </div>

        {profile?.created_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
            <Calendar className="h-3 w-3" />
            <span>
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
