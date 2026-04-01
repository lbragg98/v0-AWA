-- Seed exercise library with common exercises
INSERT INTO exercise_library (name, slug, primary_muscle, secondary_muscles, equipment, difficulty, is_compound, category, mechanic, instructions)
VALUES
('Barbell Bench Press', 'barbell-bench-press', 'chest', ARRAY['triceps', 'shoulders'], 'barbell', 'intermediate', true, 'strength', 'compound', ARRAY['Lie flat on bench', 'Grip barbell shoulder width', 'Lower to chest', 'Press up explosively']),
('Barbell Squats', 'barbell-squats', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'barbell', 'intermediate', true, 'strength', 'compound', ARRAY['Place bar on shoulders', 'Stand with feet shoulder width', 'Lower hips back and down', 'Drive through heels to stand']),
('Deadlift', 'deadlift', 'hamstrings', ARRAY['glutes', 'back'], 'barbell', 'intermediate', true, 'strength', 'compound', ARRAY['Stand with feet hip width', 'Grip bar at shoulder width', 'Drive through heels to lift', 'Stand fully at top']),
('Dumbbell Curls', 'dumbbell-curls', 'biceps', ARRAY['forearms'], 'dumbbell', 'beginner', false, 'strength', 'isolation', ARRAY['Stand with dumbbells at sides', 'Curl weights up to shoulders', 'Control descent back down']),
('Push-ups', 'push-ups', 'chest', ARRAY['triceps', 'shoulders'], 'bodyweight', 'beginner', true, 'strength', 'compound', ARRAY['Start in plank position', 'Lower body until chest near ground', 'Push back to starting position']),
('Pull-ups', 'pull-ups', 'back', ARRAY['biceps', 'shoulders'], 'bodyweight', 'intermediate', true, 'strength', 'compound', ARRAY['Grip bar with hands shoulder width', 'Pull body up until chin above bar', 'Lower with control']),
('Overhead Press', 'overhead-press', 'shoulders', ARRAY['triceps', 'chest'], 'barbell', 'intermediate', true, 'strength', 'compound', ARRAY['Hold barbell at shoulder height', 'Press bar straight overhead', 'Lower under control to shoulders']),
('Lat Pulldowns', 'lat-pulldowns', 'back', ARRAY['biceps'], 'cable', 'beginner', false, 'strength', 'isolation', ARRAY['Sit at machine with feet planted', 'Grip bar wider than shoulders', 'Pull bar down to chest', 'Control weight back up']),
('Leg Press', 'leg-press', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'machine', 'beginner', true, 'strength', 'compound', ARRAY['Sit with back and head against pad', 'Place feet on platform', 'Lower weight by bending knees', 'Push weight away extending legs']),
('Treadmill Running', 'treadmill-running', 'quadriceps', ARRAY['hamstrings', 'calves'], 'machine', 'beginner', false, 'cardio', 'isolation', ARRAY['Step onto treadmill', 'Set speed and incline', 'Maintain steady pace', 'Cool down gradually'])
ON CONFLICT (slug) DO NOTHING;
