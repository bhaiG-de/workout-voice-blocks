-- Add user_id column to workouts table
ALTER TABLE workouts ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create an index on user_id for faster queries
CREATE INDEX idx_workouts_user_id ON workouts(user_id);

-- Create a policy to restrict access to workouts based on user_id
CREATE POLICY "Users can view their own workouts" 
ON workouts FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own workouts" 
ON workouts FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own workouts" 
ON workouts FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create a policy to restrict access to blocks based on workout_id
CREATE POLICY "Users can view blocks from their workouts" 
ON blocks FOR SELECT 
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid() OR user_id IS NULL
  )
);

CREATE POLICY "Users can insert blocks to their workouts" 
ON blocks FOR INSERT 
WITH CHECK (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid() OR user_id IS NULL
  )
);

CREATE POLICY "Users can update blocks from their workouts" 
ON blocks FOR UPDATE 
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid() OR user_id IS NULL
  )
);

-- Enable Row Level Security on tables
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY; 