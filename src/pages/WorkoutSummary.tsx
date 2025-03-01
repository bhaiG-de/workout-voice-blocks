import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { WorkoutBlock } from "@/components/ui-blocks/WorkoutBlock";
import { supabaseFunctions, Block, Workout } from "@/lib/supabase";
import { ChevronLeft, Clock, Calendar, TimerOff, Dumbbell } from "lucide-react";

const WorkoutSummary = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutSummary = async () => {
      try {
        if (!workoutId) return;
        
        // Use real Supabase functions
        const { data: workoutData, error: workoutError } = await supabaseFunctions.getWorkout(workoutId);
        if (workoutError) throw new Error(workoutError.message);
        
        const { data: blocksData, error: blocksError } = await supabaseFunctions.getBlocks(workoutId);
        if (blocksError) throw new Error(blocksError.message);
        
        setWorkout(workoutData);
        setBlocks(blocksData);
      } catch (error) {
        console.error('Error fetching workout summary:', error);
        toast({
          title: "Error",
          description: "Failed to load workout summary",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutSummary();
  }, [workoutId, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading workout summary...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Workout not found</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = () => {
    if (!workout.ended_at) return 'N/A';
    
    const startTime = new Date(workout.started_at);
    const endTime = new Date(workout.ended_at);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const countExercises = () => {
    let count = 0;
    blocks.forEach(block => {
      if (block.block_type === 'log_exercise' && block.block_data.exercises) {
        count += block.block_data.exercises.length;
      }
    });
    return count;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 px-4 mx-auto max-w-2xl">
        <header className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
          
          <h1 className="text-2xl font-bold mb-2">Workout Summary</h1>
          <p className="text-muted-foreground">
            Workout Session
          </p>
        </header>
        
        <section className="mb-8">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div>{formatDate(workout.started_at)}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Started</div>
                    <div>{formatTime(workout.started_at)}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <TimerOff className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div>{calculateDuration()}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Dumbbell className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Exercises</div>
                    <div>{countExercises()} exercises</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        
        {blocks.length > 0 ? (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Workout Details</h2>
            <div className="space-y-4">
              {blocks.map(block => (
                <WorkoutBlock key={block.id} block={block} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-8 text-center">
            <p className="text-muted-foreground">No workout details recorded</p>
          </section>
        )}
        
        <div className="flex justify-center mb-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            Start New Workout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummary;
