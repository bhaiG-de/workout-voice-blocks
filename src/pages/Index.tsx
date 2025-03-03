import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseFunctions, Workout } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/lib/AuthContext";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch workout history
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (!user) return;
      
      try {
        // Fetch workouts for the current user
        const { data, error } = await supabaseFunctions.getUserWorkouts(user.id);
          
        if (error) throw error;
        setWorkoutHistory(data || []);
      } catch (error) {
        console.error('Error fetching workout history:', error);
        toast({
          title: "Error",
          description: "Failed to load workout history",
          variant: "destructive",
        });
      }
    };
    
    fetchWorkoutHistory();
  }, [toast, user]);

  const startNewWorkout = async () => {
    setIsLoading(true);
    try {
      // Pass the user ID when starting a new workout
      const { data, error } = await supabaseFunctions.startWorkout(user?.id || null);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        navigate(`/workouts/${data.id}`);
      }
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({
        title: "Error",
        description: "Failed to start a new workout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate workout duration
  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return "In progress";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();
    
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workout Voice Blocks</h1>
        <UserProfile />
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Start a New Workout</CardTitle>
            <CardDescription>
              Begin tracking your workout with voice commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Record your exercises, ask questions, and make notes using your voice during your workout.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={startNewWorkout} 
              disabled={isLoading}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? "Starting..." : "Start Workout"}
            </Button>
          </CardFooter>
        </Card>

        {workoutHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>
                Your workout history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workoutHistory.map((workout) => (
                  <div 
                    key={workout.id} 
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => navigate(`/workouts/${workout.id}/summary`)}
                  >
                    <div>
                      <p className="font-medium">{formatDate(workout.started_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        {workout.blocks?.length || 0} blocks recorded
                      </p>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>{calculateDuration(workout.started_at, workout.ended_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
