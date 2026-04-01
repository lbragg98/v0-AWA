-- Forge Fitness App Seed Data
-- Run after 001-setup-database.sql

-- ============================================
-- MUSCLE GROUPS
-- ============================================
INSERT INTO muscle_groups (name, slug, display_name, body_region, body_side, svg_path_id) VALUES
  -- Upper Body - Front
  ('chest', 'chest', 'Chest', 'upper', 'front', 'muscle-chest'),
  ('front_deltoids', 'front-deltoids', 'Front Deltoids', 'upper', 'front', 'muscle-front-deltoids'),
  ('biceps', 'biceps', 'Biceps', 'upper', 'front', 'muscle-biceps'),
  ('forearms', 'forearms', 'Forearms', 'upper', 'both', 'muscle-forearms'),
  ('abs', 'abs', 'Abs', 'core', 'front', 'muscle-abs'),
  ('obliques', 'obliques', 'Obliques', 'core', 'front', 'muscle-obliques'),
  
  -- Upper Body - Back
  ('traps', 'traps', 'Traps', 'upper', 'back', 'muscle-traps'),
  ('rear_deltoids', 'rear-deltoids', 'Rear Deltoids', 'upper', 'back', 'muscle-rear-deltoids'),
  ('side_deltoids', 'side-deltoids', 'Side Deltoids', 'upper', 'both', 'muscle-side-deltoids'),
  ('lats', 'lats', 'Lats', 'upper', 'back', 'muscle-lats'),
  ('rhomboids', 'rhomboids', 'Rhomboids', 'upper', 'back', 'muscle-rhomboids'),
  ('lower_back', 'lower-back', 'Lower Back', 'core', 'back', 'muscle-lower-back'),
  ('triceps', 'triceps', 'Triceps', 'upper', 'back', 'muscle-triceps'),
  
  -- Lower Body - Front
  ('quads', 'quads', 'Quadriceps', 'lower', 'front', 'muscle-quads'),
  ('hip_flexors', 'hip-flexors', 'Hip Flexors', 'lower', 'front', 'muscle-hip-flexors'),
  ('adductors', 'adductors', 'Adductors', 'lower', 'front', 'muscle-adductors'),
  
  -- Lower Body - Back
  ('glutes', 'glutes', 'Glutes', 'lower', 'back', 'muscle-glutes'),
  ('hamstrings', 'hamstrings', 'Hamstrings', 'lower', 'back', 'muscle-hamstrings'),
  ('calves', 'calves', 'Calves', 'lower', 'back', 'muscle-calves')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- EXERCISE LIBRARY (comprehensive list)
-- ============================================

-- CHEST EXERCISES
INSERT INTO exercise_library (name, slug, primary_muscle, secondary_muscles, equipment, difficulty, is_compound, category, mechanic, instructions, tips) VALUES
  ('Barbell Bench Press', 'barbell-bench-press', 'chest', ARRAY['triceps', 'front_deltoids'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Lie on bench with feet flat on floor', 'Grip bar slightly wider than shoulder width', 'Unrack and lower bar to mid-chest', 'Press bar up until arms are extended', 'Keep shoulder blades retracted throughout'],
   ARRAY['Keep wrists straight', 'Drive through your heels', 'Maintain an arch in your lower back']),
   
  ('Dumbbell Bench Press', 'dumbbell-bench-press', 'chest', ARRAY['triceps', 'front_deltoids'], 'dumbbell', 'beginner', true, 'strength', 'compound',
   ARRAY['Lie on bench holding dumbbells at chest level', 'Press dumbbells up until arms are extended', 'Lower with control to starting position'],
   ARRAY['Allow natural arc movement', 'Keep elbows at 45 degree angle']),
   
  ('Incline Barbell Press', 'incline-barbell-press', 'chest', ARRAY['triceps', 'front_deltoids'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Set bench to 30-45 degree incline', 'Grip bar slightly wider than shoulders', 'Lower bar to upper chest', 'Press up to lockout'],
   ARRAY['Focus on upper chest squeeze', 'Keep core tight']),
   
  ('Incline Dumbbell Press', 'incline-dumbbell-press', 'chest', ARRAY['triceps', 'front_deltoids'], 'dumbbell', 'beginner', true, 'strength', 'compound',
   ARRAY['Set bench to 30-45 degree incline', 'Press dumbbells from chest to overhead', 'Lower with control'],
   ARRAY['Great for upper chest development', 'Keep shoulder blades pinched']),
   
  ('Dumbbell Flyes', 'dumbbell-flyes', 'chest', ARRAY['front_deltoids'], 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Lie on flat bench with dumbbells extended above chest', 'Lower arms out to sides in arc motion', 'Bring dumbbells back together at top'],
   ARRAY['Keep slight bend in elbows', 'Feel stretch at bottom']),
   
  ('Cable Crossover', 'cable-crossover', 'chest', ARRAY['front_deltoids'], 'cable', 'intermediate', false, 'strength', 'isolation',
   ARRAY['Stand between cable stations', 'Bring handles together in front of chest', 'Control return to start'],
   ARRAY['Lean slightly forward', 'Squeeze at the bottom']),
   
  ('Push-Ups', 'push-ups', 'chest', ARRAY['triceps', 'front_deltoids', 'abs'], 'bodyweight', 'beginner', true, 'strength', 'compound',
   ARRAY['Start in plank position', 'Lower chest to floor', 'Push back up to start'],
   ARRAY['Keep body in straight line', 'Engage core throughout']),
   
  ('Dips (Chest)', 'dips-chest', 'chest', ARRAY['triceps', 'front_deltoids'], 'bodyweight', 'intermediate', true, 'strength', 'compound',
   ARRAY['Grip parallel bars', 'Lean forward and lower body', 'Push back up to start'],
   ARRAY['Lean forward to target chest', 'Go to 90 degrees or below']),

-- BACK EXERCISES
  ('Barbell Deadlift', 'barbell-deadlift', 'lower_back', ARRAY['glutes', 'hamstrings', 'traps', 'forearms'], 'barbell', 'advanced', true, 'strength', 'compound',
   ARRAY['Stand with feet hip-width apart', 'Grip bar just outside legs', 'Keep back flat, chest up', 'Drive through heels to stand', 'Lower with control'],
   ARRAY['Keep bar close to body', 'Engage lats before pull', 'Avoid rounding lower back']),
   
  ('Barbell Row', 'barbell-row', 'lats', ARRAY['rhomboids', 'biceps', 'rear_deltoids'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Hinge at hips with flat back', 'Pull bar to lower chest', 'Squeeze shoulder blades', 'Lower with control'],
   ARRAY['Keep core braced', 'Pull with elbows, not hands']),
   
  ('Pull-Ups', 'pull-ups', 'lats', ARRAY['biceps', 'rhomboids'], 'bodyweight', 'intermediate', true, 'strength', 'compound',
   ARRAY['Hang from bar with overhand grip', 'Pull chest to bar', 'Lower with control'],
   ARRAY['Initiate with lats', 'Avoid swinging']),
   
  ('Lat Pulldown', 'lat-pulldown', 'lats', ARRAY['biceps', 'rhomboids'], 'cable', 'beginner', true, 'strength', 'compound',
   ARRAY['Sit at lat pulldown machine', 'Pull bar to upper chest', 'Control return to start'],
   ARRAY['Lean back slightly', 'Pull elbows down and back']),
   
  ('Seated Cable Row', 'seated-cable-row', 'rhomboids', ARRAY['lats', 'biceps'], 'cable', 'beginner', true, 'strength', 'compound',
   ARRAY['Sit at cable row machine', 'Pull handle to midsection', 'Squeeze shoulder blades', 'Return with control'],
   ARRAY['Keep chest up', 'Avoid using momentum']),
   
  ('Dumbbell Row', 'dumbbell-row', 'lats', ARRAY['biceps', 'rhomboids'], 'dumbbell', 'beginner', true, 'strength', 'compound',
   ARRAY['Support on bench with one hand', 'Row dumbbell to hip', 'Lower with control'],
   ARRAY['Keep back flat', 'Pull elbow past torso']),
   
  ('T-Bar Row', 't-bar-row', 'lats', ARRAY['rhomboids', 'biceps', 'lower_back'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Straddle T-bar or landmine', 'Hinge at hips', 'Row weight to chest', 'Lower with control'],
   ARRAY['Keep back flat', 'Squeeze at top']),
   
  ('Face Pulls', 'face-pulls', 'rear_deltoids', ARRAY['traps', 'rhomboids'], 'cable', 'beginner', false, 'strength', 'isolation',
   ARRAY['Set cable at face height', 'Pull rope to face', 'External rotate at end', 'Control return'],
   ARRAY['Great for shoulder health', 'Keep elbows high']),

-- SHOULDER EXERCISES
  ('Overhead Press', 'overhead-press', 'front_deltoids', ARRAY['triceps', 'traps', 'side_deltoids'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Start with bar at shoulders', 'Press overhead', 'Lower with control'],
   ARRAY['Brace core tight', 'Push head through at top']),
   
  ('Dumbbell Shoulder Press', 'dumbbell-shoulder-press', 'front_deltoids', ARRAY['triceps', 'side_deltoids'], 'dumbbell', 'beginner', true, 'strength', 'compound',
   ARRAY['Hold dumbbells at shoulders', 'Press overhead', 'Lower with control'],
   ARRAY['Keep core tight', 'Avoid arching back']),
   
  ('Lateral Raises', 'lateral-raises', 'side_deltoids', NULL, 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Hold dumbbells at sides', 'Raise arms to shoulder height', 'Lower with control'],
   ARRAY['Slight bend in elbows', 'Lead with elbows']),
   
  ('Front Raises', 'front-raises', 'front_deltoids', NULL, 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Hold dumbbells in front of thighs', 'Raise to shoulder height', 'Lower with control'],
   ARRAY['Alternate arms or do together', 'Avoid swinging']),
   
  ('Reverse Flyes', 'reverse-flyes', 'rear_deltoids', ARRAY['rhomboids', 'traps'], 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Bend forward at hips', 'Raise arms out to sides', 'Squeeze shoulder blades', 'Lower with control'],
   ARRAY['Keep slight bend in elbows', 'Focus on rear delts']),
   
  ('Arnold Press', 'arnold-press', 'front_deltoids', ARRAY['side_deltoids', 'triceps'], 'dumbbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Start with palms facing you', 'Rotate and press overhead', 'Reverse motion down'],
   ARRAY['Smooth rotation throughout', 'Full range of motion']),

-- ARM EXERCISES
  ('Barbell Curl', 'barbell-curl', 'biceps', ARRAY['forearms'], 'barbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Stand holding barbell', 'Curl weight to shoulders', 'Lower with control'],
   ARRAY['Keep elbows at sides', 'Avoid swinging']),
   
  ('Dumbbell Curl', 'dumbbell-curl', 'biceps', ARRAY['forearms'], 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Stand with dumbbells at sides', 'Curl to shoulders', 'Lower with control'],
   ARRAY['Can alternate or do together', 'Supinate at top']),
   
  ('Hammer Curl', 'hammer-curl', 'biceps', ARRAY['forearms'], 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Hold dumbbells with neutral grip', 'Curl to shoulders', 'Lower with control'],
   ARRAY['Great for forearm development', 'Keep palms facing each other']),
   
  ('Preacher Curl', 'preacher-curl', 'biceps', NULL, 'dumbbell', 'intermediate', false, 'strength', 'isolation',
   ARRAY['Rest arms on preacher bench', 'Curl weight up', 'Lower with control'],
   ARRAY['Full stretch at bottom', 'Avoid swinging']),
   
  ('Tricep Pushdown', 'tricep-pushdown', 'triceps', NULL, 'cable', 'beginner', false, 'strength', 'isolation',
   ARRAY['Grip cable attachment at chest', 'Push down until arms straight', 'Control return'],
   ARRAY['Keep elbows at sides', 'Squeeze at bottom']),
   
  ('Skull Crushers', 'skull-crushers', 'triceps', NULL, 'barbell', 'intermediate', false, 'strength', 'isolation',
   ARRAY['Lie on bench with bar overhead', 'Lower to forehead', 'Extend arms back up'],
   ARRAY['Keep upper arms stationary', 'Control the weight']),
   
  ('Overhead Tricep Extension', 'overhead-tricep-extension', 'triceps', NULL, 'dumbbell', 'beginner', false, 'strength', 'isolation',
   ARRAY['Hold dumbbell overhead', 'Lower behind head', 'Extend back up'],
   ARRAY['Keep elbows pointing forward', 'Full range of motion']),
   
  ('Dips (Triceps)', 'dips-triceps', 'triceps', ARRAY['chest', 'front_deltoids'], 'bodyweight', 'intermediate', true, 'strength', 'compound',
   ARRAY['Grip parallel bars', 'Keep body upright', 'Lower and press up'],
   ARRAY['Stay vertical for triceps focus', 'Full lockout at top']),

-- LEG EXERCISES
  ('Barbell Squat', 'barbell-squat', 'quads', ARRAY['glutes', 'hamstrings', 'lower_back'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Bar on upper back', 'Feet shoulder width apart', 'Squat to parallel or below', 'Drive through heels to stand'],
   ARRAY['Keep chest up', 'Knees track over toes', 'Brace core throughout']),
   
  ('Front Squat', 'front-squat', 'quads', ARRAY['glutes', 'abs'], 'barbell', 'advanced', true, 'strength', 'compound',
   ARRAY['Bar on front shoulders', 'Elbows high', 'Squat deep', 'Drive up'],
   ARRAY['Requires good mobility', 'More quad dominant']),
   
  ('Leg Press', 'leg-press', 'quads', ARRAY['glutes', 'hamstrings'], 'machine', 'beginner', true, 'strength', 'compound',
   ARRAY['Sit in leg press machine', 'Lower weight with control', 'Press back up'],
   ARRAY['Do not lock knees', 'Control the negative']),
   
  ('Romanian Deadlift', 'romanian-deadlift', 'hamstrings', ARRAY['glutes', 'lower_back'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Hold bar at hips', 'Hinge at hips, lower bar', 'Keep legs relatively straight', 'Drive hips forward to stand'],
   ARRAY['Feel stretch in hamstrings', 'Keep bar close to legs']),
   
  ('Leg Curl', 'leg-curl', 'hamstrings', NULL, 'machine', 'beginner', false, 'strength', 'isolation',
   ARRAY['Lie on leg curl machine', 'Curl weight toward glutes', 'Lower with control'],
   ARRAY['Full range of motion', 'Control the eccentric']),
   
  ('Leg Extension', 'leg-extension', 'quads', NULL, 'machine', 'beginner', false, 'strength', 'isolation',
   ARRAY['Sit in leg extension machine', 'Extend legs fully', 'Lower with control'],
   ARRAY['Squeeze quads at top', 'Avoid locking knees hard']),
   
  ('Bulgarian Split Squat', 'bulgarian-split-squat', 'quads', ARRAY['glutes', 'hamstrings'], 'dumbbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Rear foot on bench', 'Lower front leg to 90 degrees', 'Drive up through front heel'],
   ARRAY['Keep torso upright', 'Great unilateral exercise']),
   
  ('Walking Lunges', 'walking-lunges', 'quads', ARRAY['glutes', 'hamstrings'], 'dumbbell', 'beginner', true, 'strength', 'compound',
   ARRAY['Step forward into lunge', 'Lower back knee toward ground', 'Step through to next lunge'],
   ARRAY['Keep torso upright', 'Control each step']),
   
  ('Hip Thrust', 'hip-thrust', 'glutes', ARRAY['hamstrings'], 'barbell', 'intermediate', true, 'strength', 'compound',
   ARRAY['Back against bench', 'Bar on hips', 'Drive hips up', 'Squeeze glutes at top', 'Lower with control'],
   ARRAY['Chin tucked at top', 'Full hip extension']),
   
  ('Calf Raises', 'calf-raises', 'calves', NULL, 'machine', 'beginner', false, 'strength', 'isolation',
   ARRAY['Stand on calf raise machine', 'Raise onto toes', 'Lower with full stretch'],
   ARRAY['Pause at top', 'Full range of motion']),

-- CORE EXERCISES
  ('Plank', 'plank', 'abs', ARRAY['obliques', 'lower_back'], 'bodyweight', 'beginner', false, 'strength', 'isolation',
   ARRAY['Hold push-up position on forearms', 'Keep body in straight line', 'Hold for time'],
   ARRAY['Engage entire core', 'Do not let hips sag']),
   
  ('Hanging Leg Raise', 'hanging-leg-raise', 'abs', ARRAY['hip_flexors'], 'bodyweight', 'intermediate', false, 'strength', 'isolation',
   ARRAY['Hang from pull-up bar', 'Raise legs to parallel or higher', 'Lower with control'],
   ARRAY['Avoid swinging', 'Curl pelvis at top']),
   
  ('Cable Crunch', 'cable-crunch', 'abs', NULL, 'cable', 'beginner', false, 'strength', 'isolation',
   ARRAY['Kneel facing cable', 'Crunch down against resistance', 'Return with control'],
   ARRAY['Focus on ab contraction', 'Keep hips stationary']),
   
  ('Russian Twist', 'russian-twist', 'obliques', ARRAY['abs'], 'bodyweight', 'beginner', false, 'strength', 'isolation',
   ARRAY['Sit with feet off ground', 'Rotate torso side to side', 'Touch ground each side'],
   ARRAY['Keep core tight', 'Can add weight']),
   
  ('Ab Wheel Rollout', 'ab-wheel-rollout', 'abs', ARRAY['obliques', 'lats'], 'other', 'advanced', false, 'strength', 'compound',
   ARRAY['Kneel with ab wheel', 'Roll out extending arms', 'Pull back to start'],
   ARRAY['Keep core braced', 'Do not arch back']),

-- WARMUP EXERCISES
  ('Arm Circles', 'arm-circles', 'front_deltoids', ARRAY['side_deltoids', 'rear_deltoids'], 'bodyweight', 'beginner', false, 'warmup', 'isolation',
   ARRAY['Stand with arms extended', 'Make circular motions', 'Increase circle size gradually'],
   ARRAY['Do forward and backward', 'Great for shoulder mobility']),
   
  ('Leg Swings', 'leg-swings', 'hip_flexors', ARRAY['hamstrings', 'quads'], 'bodyweight', 'beginner', false, 'warmup', 'isolation',
   ARRAY['Hold onto support', 'Swing leg forward and back', 'Keep core engaged'],
   ARRAY['Control the movement', 'Do both directions']),
   
  ('Jumping Jacks', 'jumping-jacks', 'quads', ARRAY['calves', 'side_deltoids'], 'bodyweight', 'beginner', true, 'warmup', 'compound',
   ARRAY['Start standing', 'Jump feet out while raising arms', 'Jump back to start'],
   ARRAY['Great for getting heart rate up', 'Land softly']),
   
  ('High Knees', 'high-knees', 'hip_flexors', ARRAY['quads', 'abs'], 'bodyweight', 'beginner', false, 'warmup', 'compound',
   ARRAY['Run in place', 'Bring knees to hip height', 'Pump arms'],
   ARRAY['Quick tempo', 'Stay on balls of feet'])
   
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (name, slug, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
  -- Consistency achievements
  ('First Workout', 'first-workout', 'Complete your first workout', '🎯', 'milestone', 'workouts_completed', 1, 100),
  ('Week Warrior', 'week-warrior', 'Complete 7 workouts', '📅', 'consistency', 'workouts_completed', 7, 250),
  ('Month Master', 'month-master', 'Complete 30 workouts', '🗓️', 'consistency', 'workouts_completed', 30, 500),
  ('Century Club', 'century-club', 'Complete 100 workouts', '💯', 'consistency', 'workouts_completed', 100, 1000),
  
  -- Streak achievements
  ('3 Day Streak', 'streak-3', 'Maintain a 3 day workout streak', '🔥', 'consistency', 'streak_days', 3, 150),
  ('7 Day Streak', 'streak-7', 'Maintain a 7 day workout streak', '🔥', 'consistency', 'streak_days', 7, 300),
  ('30 Day Streak', 'streak-30', 'Maintain a 30 day workout streak', '🔥', 'consistency', 'streak_days', 30, 750),
  
  -- Strength achievements  
  ('First PR', 'first-pr', 'Set your first personal record', '🏆', 'strength', 'pr_achieved', 1, 200),
  ('PR Hunter', 'pr-hunter', 'Set 10 personal records', '🏆', 'strength', 'pr_achieved', 10, 500),
  ('PR Legend', 'pr-legend', 'Set 50 personal records', '🏆', 'strength', 'pr_achieved', 50, 1000),
  
  -- Volume achievements
  ('Volume Rookie', 'volume-rookie', 'Lift 10,000 lbs total', '💪', 'volume', 'total_volume', 10000, 200),
  ('Volume Veteran', 'volume-veteran', 'Lift 100,000 lbs total', '💪', 'volume', 'total_volume', 100000, 500),
  ('Volume Legend', 'volume-legend', 'Lift 1,000,000 lbs total', '💪', 'volume', 'total_volume', 1000000, 2000),
  
  -- Progression achievements
  ('Muscle Awakening', 'muscle-awakening', 'Get your first muscle to Weakling tier', '⚡', 'progression', 'tier_reached', 1, 150),
  ('Builder Status', 'builder-status', 'Get a muscle to Builder tier', '🏗️', 'progression', 'tier_reached', 3, 400),
  ('Beast Mode', 'beast-mode', 'Get a muscle to Beast tier', '🦁', 'progression', 'tier_reached', 4, 750),
  ('Elite Physique', 'elite-physique', 'Get a muscle to Elite tier', '👑', 'progression', 'tier_reached', 5, 1500),
  ('God Tier', 'god-tier', 'Achieve God Tier on any muscle', '⚡', 'progression', 'tier_reached', 6, 3000),
  
  -- Milestone achievements
  ('Full Body Focus', 'full-body-focus', 'Train all muscle groups in one week', '🎯', 'milestone', 'muscles_trained_week', 19, 300),
  ('Leg Day Hero', 'leg-day-hero', 'Never skip leg day for 4 weeks', '🦵', 'milestone', 'leg_days_streak', 4, 400),
  ('Push Pull Master', 'push-pull-master', 'Complete a PPL split for 4 weeks', '🔄', 'milestone', 'ppl_weeks', 4, 500)
ON CONFLICT (slug) DO NOTHING;
