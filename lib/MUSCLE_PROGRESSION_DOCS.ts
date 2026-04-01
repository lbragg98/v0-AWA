/**
 * MUSCLE PROGRESSION SYSTEM - V1 FORMULAS & DOCUMENTATION
 * 
 * This file documents the muscle progression calculation pipeline implemented in lib/muscle-progression.ts
 */

/**
 * XP CALCULATION (V1)
 * ==================
 * 
 * Formula: XP = (10 × sets) + (5 × total_reps)
 * 
 * Example:
 * - Bench Press: 3 sets × 8 reps = 3 × 10 + 24 × 5 = 30 + 120 = 150 XP
 * - Primary muscle (chest): 150 XP
 * - Secondary muscles (triceps, shoulders): 150 × 0.5 = 75 XP each
 */

/**
 * VOLUME TRACKING (V1)
 * ====================
 * 
 * Formula: Volume = Σ(weight × reps) per exercise
 * 
 * Example:
 * - Set 1: 185 lbs × 8 reps = 1,480
 * - Set 2: 185 lbs × 7 reps = 1,295
 * - Set 3: 185 lbs × 6 reps = 1,110
 * - Total Volume: 3,885
 * 
 * Secondary muscles receive 50% volume contribution
 */

/**
 * LEVEL & TIER PROGRESSION (V1)
 * =============================
 * 
 * Formula: Level = floor(XP / 10)
 * 
 * Tier Thresholds:
 * - Unawakened: Level 0-4
 * - Weakling: Level 5-14
 * - Novice: Level 15-29
 * - Builder: Level 30-49
 * - Beast: Level 50-74
 * - Elite: Level 75-99
 * - God Tier: Level 100+
 * 
 * Example:
 * - 150 XP = Level 15 = Novice
 * - 500 XP = Level 50 = Beast
 * - 1000 XP = Level 100 = God Tier
 */

/**
 * STRENGTH SCORE (V1)
 * ===================
 * 
 * Formula: Strength += 0.5 for (1-5 reps) | 0.3 for (6-10 reps) | 0.1 for (11+ reps)
 * 
 * Rationale: Heavy, lower-rep sets contribute more to strength development
 * 
 * Example:
 * - Heavy squat (3 reps): +0.5
 * - Moderate curl (10 reps): +0.3
 * - Light isolation (15 reps): +0.1
 */

/**
 * CONSISTENCY SCORE (V1)
 * ======================
 * 
 * Formula: Consistency += 0.1 per workout session
 * 
 * Purpose: Rewards regular training adherence
 * Simplified for V1, can track time-based decay in future versions
 */

/**
 * RECOVERY SCORE (V1)
 * ===================
 * 
 * Formula: Recovery = 5.0 (baseline) - 0.05 per workout
 * Range: 0 to 5 (clamped to min 0)
 * 
 * Purpose: Basic fatigue tracking - muscles need recovery time
 * Simplified V1 implementation, future versions can include:
 * - Time-based recovery (recovery increases over time)
 * - Muscle group priority recovery
 * - Training frequency thresholds
 */

/**
 * EXERCISE TO MUSCLE MAPPING (V1)
 * ================================
 * 
 * Hard-coded mappings in EXERCISE_MUSCLE_MAP:
 * 
 * Compound Exercises (distribute XP to primary + secondary):
 * - Bench Press: Primary=chest, Secondary=[triceps, shoulders]
 * - Squats: Primary=quadriceps, Secondary=[glutes, hamstrings]
 * - Deadlift: Primary=hamstrings, Secondary=[glutes, back]
 * - Pull-ups: Primary=back, Secondary=[biceps, shoulders]
 * - Overhead Press: Primary=shoulders, Secondary=[triceps, chest]
 * 
 * Isolation Exercises (primary only):
 * - Dumbbell Curls: Primary=biceps, Secondary=[forearms]
 * - Lat Pulldowns: Primary=back, Secondary=[biceps]
 * 
 * Fallback: If exercise slug not in EXERCISE_MUSCLE_MAP,
 * uses exercise_library.primary_muscle and exercise_library.secondary_muscles
 */

/**
 * DATA FLOW
 * =========
 * 
 * 1. User completes workout → POST /api/workouts/complete
 * 2. Workout saved to completed_workouts table
 * 3. Sets saved to completed_sets table
 * 4. processWorkoutCompletion() called in workout-progress action
 * 5. updateMuscleProgressFromWorkout() called
 * 6. For each exercise in the workout:
 *    - Get exercise data from exercise_library
 *    - Determine primary and secondary muscles
 *    - Calculate XP, volume, strength bonus
 *    - Update muscle_progress records
 * 7. Tier calculated automatically based on level
 * 8. Body map UI renders current tier and progress data
 */

/**
 * ERROR HANDLING
 * ==============
 * 
 * All errors logged with [v0] prefix
 * Individual muscle group failures don't stop the entire pipeline
 * Missing exercises logged and skipped gracefully
 * Progression updates are fire-and-forget (don't fail workout save)
 */

export {}
