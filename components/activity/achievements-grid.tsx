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
          Complete workouts and hit goals to unlock achievements.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {achievements.map((achievement) => (
        <Card key={achievement.id} className="group p-4 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-3xl shadow-[0_0_20px_rgba(83,193,255,0.08)] transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_24px_rgba(83,193,255,0.16)]">
              {achievement.achievement?.icon || 'T'}
            </div>
          </div>
          <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
            {achievement.achievement?.name}
          </h4>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {achievement.achievement?.description}
          </p>
          {achievement.achievement?.xp_reward && (
            <Badge variant="outline" className="mt-3 border-primary/15 bg-primary/8 text-primary">
              +{achievement.achievement.xp_reward} XP
            </Badge>
          )}
        </Card>
      ))}
    </div>
  )
}
