import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award } from 'lucide-react'
import type { UserAchievement } from '@/types/database'

interface AchievementsGridProps {
  achievements: UserAchievement[]
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  if (achievements.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 font-semibold text-foreground">No achievements yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete workouts and hit goals to unlock achievements
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {achievements.map((achievement) => (
        <Card
          key={achievement.id}
          className="p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">
            {achievement.achievement?.icon || '🏆'}
          </div>
          <h4 className="font-semibold text-sm text-foreground line-clamp-2">
            {achievement.achievement?.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {achievement.achievement?.description}
          </p>
          {achievement.achievement?.xp_reward && (
            <Badge variant="outline" className="mt-2 text-xs">
              +{achievement.achievement.xp_reward} XP
            </Badge>
          )}
        </Card>
      ))}
    </div>
  )
}
