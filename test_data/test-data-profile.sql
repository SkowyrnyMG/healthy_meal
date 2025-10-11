-- Test data for GET /api/profile endpoint
-- Run this SQL in Supabase SQL Editor to create test profile

-- Insert test profile for mock user
INSERT INTO profiles (
  user_id,
  weight,
  age,
  gender,
  activity_level,
  diet_type,
  target_goal,
  target_value,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  75.5,
  28,
  'male',
  'moderately_active',
  'high_protein',
  'lose_weight',
  5.0,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  weight = EXCLUDED.weight,
  age = EXCLUDED.age,
  gender = EXCLUDED.gender,
  activity_level = EXCLUDED.activity_level,
  diet_type = EXCLUDED.diet_type,
  target_goal = EXCLUDED.target_goal,
  target_value = EXCLUDED.target_value,
  updated_at = NOW();

-- Verify the inserted data
SELECT * FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
