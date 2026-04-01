import type { CompletedWorkout, MuscleProgress, Goal, FitnessProfile } from '@/types/database'

/**
 * Training balance analysis identifies:
 * - Least/most trained muscle groups
 * - Imbalances between related regions
 * - Undertrained muscles relative to goals
 * - Recent overfocus patterns
 */

export interface TrainingBalanceInsight {
  muscleId: string
  muscleName: string
  volumeLastWeek: number
  daysAgo: number
  trainingFrequency: number // times trained in last 30 days
  status: 'undertrained' | 'well_balanced' | 'overtrained'
  recommendation: string
}

export interface DeloadRecommendation {
  shouldDeload: boolean
  severity: 'light' | 'moderate' | 'strong'
  reason: string
  suggestion: string
}

export interface TrainingBalance {
  leastTrained: TrainingBalanceInsight[]
  mostTrained: TrainingBalanceInsight[]
  imbalances: { pair: string; message: string }[]
  deloadRecommendation: DeloadRecommendation
  overallHealth: 'balanced' | 'slightly_imbalanced' | 'highly_imbalanced'
}

/**
 * Analyze training balance across all muscle groups
 * 
 * Identifies:
 * - Which muscles haven't been trained recently
 * - Which muscles are being overtrained
 * - Imbalances (e.g., chest > back)
 * - Whether deload week is recommended
 */
export function analyzeTrainingBalance(
  muscleProgress: MuscleProgress[],
  workouts: CompletedWorkout[],
  goals: Goal[],
  fitnessProfile: FitnessProfile | null
): TrainingBalance {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Build per-muscle training stats
  const muscleStats = muscleProgress.map((mp) => {
    const lastTrainedDate = mp.last_trained_at ? new Date(mp.last_trained_at) : null
    const daysAgo = lastTrainedDate ? Math.floor((Date.now() - lastTrainedDate.getTime()) / (1000 * 60 * 60 * 24)) : 999

    // Count how many times trained in last 30 days (approximation via weekly_volume trend)
    // In reality, this would come from counting specific set sessions
    const trainingFrequency = mp.weekly_volume > 0 ? 4 : 0 // Simplified

    return {
      muscleId: mp.id,
      muscleName: mp.muscle_group?.display_name || 'Unknown',
      volumeLastWeek: mp.weekly_volume || 0,
      daysAgo,
      trainingFrequency,
      xp: mp.xp,
      recoveryScore: mp.recovery_score,
    }
  })

  // Determine status for each muscle
  const insights: TrainingBalanceInsight[] = muscleStats.map((ms) => {
    let status: 'undertrained' | 'well_balanced' | 'overtrained'
    let recommendation = ''

    // Undertrained: Not trained in 14+ days OR very low weekly volume
    if (ms.daysAgo >= 14 || (ms.daysAgo >= 7 && ms.volumeLastWeek < 100)) {
      status = 'undertrained'
      recommendation = `${ms.muscleName} hasn't been trained recently. Consider adding it to your next workout.`
    }
    // Overtrained: High weekly volume (2000+) AND trained within last 2 days AND low recovery score
    else if (ms.volumeLastWeek > 2000 && ms.daysAgo <= 2 && ms.recoveryScore < 50) {
      status = 'overtrained'
      recommendation = `${ms.muscleName} has high training load with low recovery. Give it more rest.`
    }
    // Well balanced: Trained in last 7 days with moderate volume
    else if (ms.daysAgo <= 7 && ms.volumeLastWeek > 200 && ms.volumeLastWeek < 1800) {
      status = 'well_balanced'
      recommendation = `${ms.muscleName} training is balanced. Keep your current approach.`
    }
    // Default to undertrained if unclear
    else {
      status = ms.daysAgo > 10 ? 'undertrained' : 'well_balanced'
      recommendation = status === 'undertrained'
        ? `${ms.muscleName} is due for training soon.`
        : `${ms.muscleName} is maintaining good training frequency.`
    }

    return {
      muscleId: ms.muscleId,
      muscleName: ms.muscleName,
      volumeLastWeek: ms.volumeLastWeek,
      daysAgo: ms.daysAgo,
      trainingFrequency: ms.trainingFrequency,
      status,
      recommendation,
    }
  })

  // Sort to find least and most trained
  const sortedByDays = [...insights].sort((a, b) => b.daysAgo - a.daysAgo)
  const leastTrained = sortedByDays.slice(0, 3)

  const sortedByVolume = [...insights].sort((a, b) => b.volumeLastWeek - a.volumeLastWeek)
  const mostTrained = sortedByVolume.slice(0, 3)

  // Detect imbalances (related muscle groups with big differences)
  const imbalances = detectImbalances(insights)

  // Calculate overall health
  const undertrainedCount = insights.filter((i) => i.status === 'undertrained').length
  const overtrainedCount = insights.filter((i) => i.status === 'overtrained').length
  let overallHealth: 'balanced' | 'slightly_imbalanced' | 'highly_imbalanced'
  if (undertrainedCount + overtrainedCount <= 2) {
    overallHealth = 'balanced'
  } else if (undertrainedCount + overtrainedCount <= 5) {
    overallHealth = 'slightly_imbalanced'
  } else {
    overallHealth = 'highly_imbalanced'
  }

  // Deload recommendation
  const deloadRecommendation = recommendDeload(workouts, insights, fitnessProfile)

  return {
    leastTrained,
    mostTrained,
    imbalances,
    deloadRecommendation,
    overallHealth,
  }
}

/**
 * Detect imbalances between related muscle groups
 * e.g., if chest is trained much more than back
 */
function detectImbalances(insights: TrainingBalanceInsight[]): { pair: string; message: string }[] {
  const imbalances: { pair: string; message: string }[] = []

  // Map muscle names to find related pairs
  const pairs: { pair: [string, string]; names: [string, string] }[] = [
    { pair: ['chest', 'back'], names: ['Chest', 'Back'] },
    { pair: ['quadriceps', 'hamstrings'], names: ['Quadriceps', 'Hamstrings'] },
    { pair: ['biceps', 'triceps'], names: ['Biceps', 'Triceps'] },
  ]

  for (const { pair: pairKeys, names } of pairs) {
    const muscle1 = insights.find((i) => i.muscleName.toLowerCase().includes(pairKeys[0].toLowerCase()))
    const muscle2 = insights.find((i) => i.muscleName.toLowerCase().includes(pairKeys[1].toLowerCase()))

    if (!muscle1 || !muscle2) continue

    const volumeDifference = Math.abs(muscle1.volumeLastWeek - muscle2.volumeLastWeek)
    const maxVolume = Math.max(muscle1.volumeLastWeek, muscle2.volumeLastWeek)

    // If one side is 50%+ lower in volume than the other
    if (maxVolume > 0 && volumeDifference / maxVolume > 0.5) {
      const higher = muscle1.volumeLastWeek > muscle2.volumeLastWeek ? names[0] : names[1]
      const lower = higher === names[0] ? names[1] : names[0]
      imbalances.push({
        pair: `${names[0]} vs ${names[1]}`,
        message: `${higher} has been prioritized heavily. ${lower} is lagging behind.`,
      })
    }
  }

  return imbalances
}

/**
 * Recommend deload week based on:
 * - High recent workload (total_volume high)
 * - Repeated high effort sessions
 * - Low readiness state
 * - Repeated training of same muscles with low recovery
 */
function recommendDeload(
  workouts: CompletedWorkout[],
  insights: TrainingBalanceInsight[],
  fitnessProfile: FitnessProfile | null
): DeloadRecommendation {
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  // Get last 4 weeks of workouts
  const recentWorkouts = workouts.filter((w) => new Date(w.completed_at || w.started_at) > fourWeeksAgo)

  // Count high-effort sessions (effort_level >= 4)
  const highEffortCount = recentWorkouts.filter((w) => (w.effort_level || 0) >= 4).length

  // Calculate average volume per workout
  const avgVolume = recentWorkouts.length > 0 ? recentWorkouts.reduce((sum, w) => sum + w.total_volume, 0) / recentWorkouts.length : 0

  // Check for overtrained muscles
  const overtrainedMuscles = insights.filter((i) => i.status === 'overtrained').length

  // Check if many muscles have low recovery
  const lowRecoveryCount = insights.filter((i) => i.recoveryScore < 50).length

  let shouldDeload = false
  let severity: 'light' | 'moderate' | 'strong' = 'light'
  let reason = ''
  let suggestion = ''

  // Condition 1: Very high volume (avg > 1500 per workout)
  if (avgVolume > 1500) {
    shouldDeload = true
    severity = 'strong'
    reason = 'Training volume has been consistently high'
    suggestion = 'Consider a deload week with 40-50% lower volume and lighter weights'
  }
  // Condition 2: Many high-effort sessions in a row (4+ in 4 weeks)
  else if (highEffortCount >= 4) {
    shouldDeload = true
    severity = 'moderate'
    reason = 'Multiple high-effort sessions without sufficient recovery'
    suggestion = 'Take a lighter week focusing on technique and mobility'
  }
  // Condition 3: Multiple overtrained muscles (2+)
  else if (overtrainedMuscles >= 2) {
    shouldDeload = true
    severity = 'moderate'
    reason = 'Several muscle groups show signs of overtraining'
    suggestion = 'Reduce training frequency and volume this week for faster recovery'
  }
  // Condition 4: Low recovery across many muscles
  else if (lowRecoveryCount >= 3) {
    shouldDeload = true
    severity = 'light'
    reason = 'Overall recovery is lagging behind training load'
    suggestion = 'Consider a lighter week with more rest days'
  }

  return {
    shouldDeload,
    severity,
    reason,
    suggestion,
  }
}

/**
 * Get specific deload suggestion based on target muscle
 */
export function getDeloadSuggestionForMuscle(muscleName: string): string {
  const suggestions: Record<string, string> = {
    chest: 'Consider a lighter chest day with reduced volume and intensity',
    back: 'Give your back some recovery time, focus on mobility',
    legs: 'Legs are demanding—take it easier this week',
    quadriceps: 'Reduce leg volume, especially on quads',
    hamstrings: 'Hamstrings need recovery time',
    biceps: 'Light arm work or skip entirely this week',
    triceps: 'Allow triceps more recovery',
    shoulders: 'Shoulders handle deload well—focus on light mobility',
  }

  const key = muscleName.toLowerCase()
  return suggestions[key] || `Give ${muscleName} more recovery time this week`
}
