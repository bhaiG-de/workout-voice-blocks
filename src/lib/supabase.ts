
import { createClient } from '@supabase/supabase-js';

// These values will be replaced with actual environment variables
// when the user connects their Supabase account
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our Supabase tables
export type Workout = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  blocks: string[];
  title?: string;
}

export type Block = {
  id: string;
  workout_id: string;
  block_type: 'log_exercise' | 'asked_question' | 'made_note' | string;
  block_data: any;
  created_at: string;
}

// Mock functions for development (to be replaced with actual Supabase calls)
const mockWorkout: Workout = {
  id: '1',
  user_id: 'user-1',
  started_at: new Date().toISOString(),
  ended_at: null,
  blocks: [],
  title: 'Morning Workout'
};

const mockBlocks: Block[] = [
  {
    id: '1',
    workout_id: '1',
    block_type: 'log_exercise',
    block_data: {
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 10 },
        { name: 'Squats', sets: 3, reps: 15 }
      ],
      notes: 'Feeling strong today!'
    },
    created_at: new Date().toISOString()
  }
];

// We'll use these mock functions during development
export const mockFunctions = {
  startWorkout: async (userId: string) => {
    return { data: { ...mockWorkout, user_id: userId }, error: null };
  },
  getWorkout: async (workoutId: string) => {
    return { data: mockWorkout, error: null };
  },
  getBlocks: async (workoutId: string) => {
    return { data: mockBlocks, error: null };
  },
  finishWorkout: async (workoutId: string) => {
    return { data: { ...mockWorkout, ended_at: new Date().toISOString() }, error: null };
  },
  uploadVoiceNote: async (file: File, userId: string) => {
    return { data: { publicUrl: 'https://example.com/voice-note.mp3' }, error: null };
  },
  saveBlocks: async (blocks: Omit<Block, 'id' | 'created_at'>[]) => {
    return { data: blocks.map((b, i) => ({ ...b, id: `new-${i}`, created_at: new Date().toISOString() })), error: null };
  }
};
