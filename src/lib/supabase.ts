import { createClient } from '@supabase/supabase-js';

// Debug logging
console.log('Environment variables:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our Supabase tables
export type Workout = {
  id: string;
  started_at: string;
  ended_at: string | null;
  blocks: string[];
  created_at: string;
  updated_at: string;
}

export type Block = {
  id: string;
  workout_id: string;
  block_type: 'log_exercise' | 'asked_question' | 'made_a_note' | string;
  block_data: any;
  created_at: string;
}

// Real Supabase functions
export const supabaseFunctions = {
  startWorkout: async () => {
    // Create a new workout object that matches the actual database schema
    const newWorkout = {
      started_at: new Date().toISOString(),
      ended_at: null,
      blocks: []
    };
    
    const { data, error } = await supabase
      .from('workouts')
      .insert(newWorkout)
      .select()
      .single();
      
    return { data, error };
  },
  
  getWorkout: async (workoutId: string) => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
      
    return { data, error };
  },
  
  getBlocks: async (workoutId: string) => {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: true });
      
    return { data, error };
  },
  
  finishWorkout: async (workoutId: string) => {
    const { data, error } = await supabase
      .from('workouts')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', workoutId)
      .select()
      .single();
      
    return { data, error };
  },
  
  uploadVoiceNote: async (file: File, workoutId: string) => {
    // Create a unique file path with timestamp and workout ID
    const filePath = `${workoutId}/${Date.now()}_${file.name}`;
    
    // Upload to the workout_recordings bucket
    const { data, error } = await supabase.storage
      .from('workout_recordings')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      return { data: null, error };
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('workout_recordings')
      .getPublicUrl(filePath);
      
    return { data: { publicUrl }, error: null };
  },
  
  saveBlocks: async (blocks: Array<Omit<Block, 'id' | 'created_at'> & { workout_id: string }>) => {
    const blocksWithTimestamp = blocks.map(block => ({
      ...block,
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('blocks')
      .insert(blocksWithTimestamp)
      .select();
      
    return { data, error };
  },
  
  updateWorkoutBlocks: async (workoutId: string, blockIds: string[]) => {
    // Get the current workout to access its existing blocks
    const { data: workout, error: getError } = await supabase
      .from('workouts')
      .select('blocks')
      .eq('id', workoutId)
      .single();
      
    if (getError) {
      return { data: null, error: getError };
    }
    
    // Combine existing blocks with new block IDs
    const updatedBlocks = [...(workout.blocks || []), ...blockIds];
    
    // Update the workout with the new blocks array
    const { data, error } = await supabase
      .from('workouts')
      .update({ 
        blocks: updatedBlocks,
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId)
      .select()
      .single();
      
    return { data, error };
  }
};
