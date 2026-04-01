'use client'

import { InteractiveBodyMap } from './interactive-body-map'
import type { MuscleTier } from '@/lib/muscle-colors'

interface MuscleProgress {
  id: string
  muscleGroupId: string
  muscleName: string
  displayName: string
  xp: number
  level: number
  tier: MuscleTier | string
  weeklyVolume: number
  strengthScore: number
  consistencyScore: number
  recoveryScore: number
  lastTrainedAt: string | null
  bodySide: 'front' | 'back' | 'both'
}

interface ProfileBodyMapProps {
  muscleProgress: MuscleProgress[]
}

export function ProfileBodyMap({ muscleProgress }: ProfileBodyMapProps) {
  // Ensure tier is properly typed
  const typedProgress = muscleProgress.map(m => ({
    ...m,
    tier: m.tier as MuscleTier,
  }))

  return <InteractiveBodyMap muscleProgress={typedProgress} />
}
