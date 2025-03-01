
import { Block } from "./supabase";

// This is a mock implementation of the AI service
// In a real application, this would make an API call to your AI endpoint

export type AIResponse = {
  blocks: Omit<Block, 'id' | 'created_at'>[];
};

const mockExerciseTypes = [
  'Push-ups', 'Pull-ups', 'Squats', 'Lunges', 'Plank', 
  'Burpees', 'Mountain Climbers', 'Deadlifts', 'Bench Press', 
  'Jumping Jacks', 'Crunches', 'Bicycle Crunches'
];

const generateMockExerciseBlock = (workoutId: string): Omit<Block, 'id' | 'created_at'> => {
  const numExercises = Math.floor(Math.random() * 3) + 1;
  const exercises = [];
  
  for (let i = 0; i < numExercises; i++) {
    const exerciseIndex = Math.floor(Math.random() * mockExerciseTypes.length);
    const sets = Math.floor(Math.random() * 5) + 1;
    const reps = Math.floor(Math.random() * 15) + 5;
    
    exercises.push({
      name: mockExerciseTypes[exerciseIndex],
      sets,
      reps
    });
  }
  
  return {
    workout_id: workoutId,
    block_type: 'log_exercise',
    block_data: {
      exercises,
      notes: 'Generated from voice note'
    }
  };
};

const generateMockQuestionBlock = (workoutId: string): Omit<Block, 'id' | 'created_at'> => {
  return {
    workout_id: workoutId,
    block_type: 'asked_question',
    block_data: {
      userMessage: 'How can I improve my form for squats?',
      AIresponse: 'To improve your squat form, focus on keeping your chest up, distributing weight through your heels, and ensuring your knees track in line with your toes. Start with bodyweight squats before adding weight.'
    }
  };
};

const generateMockNoteBlock = (workoutId: string): Omit<Block, 'id' | 'created_at'> => {
  return {
    workout_id: workoutId,
    block_type: 'made_note',
    block_data: {
      note: 'I feel stronger today compared to last week. My endurance has improved significantly.'
    }
  };
};

export async function processVoiceNote(voiceUrl: string, workoutId: string): Promise<AIResponse> {
  // This would typically make an API call to your AI endpoint
  // For development, we'll simulate a delay and return mock data
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
  
  // Randomly decide what type of block to generate
  const random = Math.random();
  let block;
  
  if (random < 0.6) {
    block = generateMockExerciseBlock(workoutId);
  } else if (random < 0.8) {
    block = generateMockQuestionBlock(workoutId);
  } else {
    block = generateMockNoteBlock(workoutId);
  }
  
  return {
    blocks: [block]
  };
}
