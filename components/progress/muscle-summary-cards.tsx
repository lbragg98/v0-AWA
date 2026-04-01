import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, Zap } from 'lucide-react'
import type { MuscleProgress } from '@/types/database'

interface MuscleSummaryCardsProps {
  muscleProgress: MuscleProgress[]
}

export function MuscleSummaryCards({ muscleProgress }: MuscleSummaryCardsProps) {
  if (!muscleProgress || muscleProgress.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Complete workouts to see your muscle progression
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by different criteria
  const sortedByLevel = [...muscleProgress].sort((a, b) => b.level - a.level)
  const sortedByTier = [...muscleProgress].sort((a, b) => {
    const tierOrder = { unawakened: 0, weakling: 1, novice: 2, builder: 3, beast: 4, elite: 5, god_tier: 6 }
    return (tierOrder[b.tier as keyof typeof tierOrder] || 0) - (tierOrder[a.tier as keyof typeof tierOrder] || 0)
  })
  const sortedByRecent = [...muscleProgress].sort((a, b) => {
    const dateA = a.last_trained_at ? new Date(a.last_trained_at).getTime() : 0
    const dateB = b.last_trained_at ? new Date(b.last_trained_at).getTime() : 0
    return dateB - dateA
  })

  const strongestMuscle = sortedByLevel[0]
  const highestTierMuscle = sortedByTier[0]
  const recentlyTrainedMuscle = sortedByRecent[0]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Strongest Muscle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Strongest Muscle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold text-foreground">
            {strongestMuscle?.muscle_group?.display_name || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            Level {strongestMuscle?.level || 0}
          </p>
          <Badge variant="secondary" className="capitalize">
            {strongestMuscle?.tier || 'unawakened'}
          </Badge>
        </CardContent>
      </Card>

      {/* Highest Tier Muscle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Peak Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold text-foreground">
            {highestTierMuscle?.muscle_group?.display_name || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            {(highestTierMuscle?.xp || 0).toLocaleString()} XP
          </p>
          <Badge className="capitalize">
            {highestTierMuscle?.tier || 'unawakened'}
          </Badge>
        </CardContent>
      </Card>

      {/* Recently Trained */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4" />
            Recently Trained
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold text-foreground">
            {recentlyTrainedMuscle?.muscle_group?.display_name || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            {recentlyTrainedMuscle?.last_trained_at
              ? new Date(recentlyTrainedMuscle.last_trained_at).toLocaleDateString()
              : 'Not yet trained'}
          </p>
          <Badge variant="outline" className="capitalize">
            {recentlyTrainedMuscle?.tier || 'unawakened'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
