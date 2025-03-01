import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseFunctions, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch workout history
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        // In a real app, you would fetch from Supabase
        // This would be a query to get recent workouts for the current user
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(5);
          
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
  }, [toast]);

  const startNewWorkout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseFunctions.startWorkout();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Navigate to the workout page
      navigate(`/workouts/${data.id}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({
        title: "Error",
        description: "Failed to start a new workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Fitness Tracker</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Record your workouts with voice notes and get AI-powered insights
          </p>
        </header>

        <section className="mb-12">
          <Card className="glass-panel animate-fade-in">
            <CardHeader>
              <CardTitle>Start Your Fitness Journey</CardTitle>
              <CardDescription>
                Begin a new workout session and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center bg-secondary/40 rounded-lg">
                <div className="text-center">
                  <p className="text-lg mb-3">Ready to get started?</p>
                  <Button 
                    size="lg"
                    onClick={startNewWorkout}
                    disabled={isLoading}
                    className="animate-scale-in"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Play className="mr-2 h-4 w-4" />
                        Start New Workout
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Workouts</h2>
          <div className="grid gap-4">
            {workoutHistory.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No workout history yet. Start your first workout!
              </Card>
            ) : (
              workoutHistory.map((workout, index) => (
                <Card 
                  key={workout.id} 
                  className="workout-card cursor-pointer hover:bg-secondary/10"
                  onClick={() => navigate(`/workouts/${workout.id}/summary`)}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Workout Session</CardTitle>
                    <CardDescription>
                      {new Date(workout.started_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <div className="text-sm text-muted-foreground">
                      {workout.blocks?.length || 0} workout moments
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
