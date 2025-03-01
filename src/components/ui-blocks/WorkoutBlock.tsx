import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Block } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkoutBlockProps {
  block: Block;
  className?: string;
}

export function WorkoutBlock({ block, className }: WorkoutBlockProps) {
  console.group('🧱 Rendering WorkoutBlock');
  console.log('Block data:', block);
  
  const renderBlockContent = () => {
    console.log('📦 Rendering block content for type:', block.block_type);
    switch (block.block_type) {
      case 'log_exercise':
        return <ExerciseBlock data={block.block_data} />;
      case 'asked_question':
        return <QuestionBlock data={block.block_data} />;
      case 'made_a_note':
        return <NoteBlock data={block.block_data} />;
      default:
        console.warn('⚠️ Unknown block type:', block.block_type);
        return <div>Unknown block type: {block.block_type}</div>;
    }
  };

  const getBlockTitle = () => {
    switch (block.block_type) {
      case 'log_exercise':
        return 'Exercise';
      case 'asked_question':
        return 'Question';
      case 'made_a_note':
        return 'Note';
      default:
        return block.block_type;
    }
  };

  console.groupEnd();
  return (
    <Card className={cn("workout-card overflow-hidden animate-slide-in", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{getBlockTitle()}</CardTitle>
          <TimeLabel date={new Date(block.created_at)} />
        </div>
      </CardHeader>
      <CardContent>
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
}

function TimeLabel({ date }: { date: Date }) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Badge variant="outline" className="text-xs font-normal">
      {formatTime(date)}
    </Badge>
  );
}

function ExerciseBlock({ data }: { data: any }) {
  console.group('💪 Rendering ExerciseBlock');
  console.log('Exercise data:', data);
  
  if (!data.exercises) {
    console.warn('⚠️ No exercises found in data');
    console.groupEnd();
    return null;
  }
  
  console.groupEnd();
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {data.exercises.map((exercise: any, index: number) => (
          <div 
            key={index} 
            className="flex flex-col p-3 rounded-lg bg-secondary/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{exercise.exercise_name}</span>
            </div>
            
            {exercise.sets.map((set: any, setIndex: number) => (
              <div key={setIndex} className="flex items-center justify-between py-1 border-t border-secondary">
                <span className="text-sm">Set {setIndex + 1}</span>
                <span className="text-sm text-muted-foreground">
                  {set.weight > 0 ? `${set.weight}kg × ` : ''}{set.reps} reps
                </span>
              </div>
            ))}
            
            {exercise.sets.some((set: any) => set.notes) && (
              <div className="mt-2 text-xs text-muted-foreground">
                {exercise.sets.map((set: any, i: number) => 
                  set.notes ? <p key={i}>Set {i+1}: {set.notes}</p> : null
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {data.notes && (
        <div className="text-sm text-muted-foreground mt-2">
          {data.notes}
        </div>
      )}
    </div>
  );
}

function QuestionBlock({ data }: { data: any }) {
  console.group('❓ Rendering QuestionBlock');
  console.log('Question data:', data);
  console.groupEnd();
  
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-secondary/50">
        <div className="text-sm font-medium mb-1">Question:</div>
        <div>{data.userMessage}</div>
      </div>
      <div className="p-3 rounded-lg bg-primary/10">
        <div className="text-sm font-medium mb-1">Answer:</div>
        <div>{data.AIresponse}</div>
      </div>
    </div>
  );
}

function NoteBlock({ data }: { data: any }) {
  console.group('📝 Rendering NoteBlock');
  console.log('Note data:', data);
  console.groupEnd();
  
  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      {data.note}
    </div>
  );
}
