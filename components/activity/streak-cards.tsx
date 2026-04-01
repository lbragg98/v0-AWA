import { Card } from '@/components/ui/card'
import { Flame } from 'lucide-react'
import type { UserStreak } from '@/types/database'

interface StreakCardsProps {
  streak: UserStreak | null
}

export function StreakCards({ streak }: StreakCardsProps) {
  const current = streak?.current_streak || 0
  const longest = streak?.longest_streak || 0

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Current Streak */}
      <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-foreground">{current} days</p>
          </div>
        </div>
      </Card>

      {/* Longest Streak */}
      <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-2xl font-bold text-foreground">{longest} days</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
