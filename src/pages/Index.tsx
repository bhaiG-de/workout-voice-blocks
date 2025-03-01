
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockFunctions } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock workout history
  const workoutHistory = [
    { id: 'history-1', title: 'Morning Strength', date: '2023-05-15', blocks: 12 },
    { id: 'history-2', title: 'Evening Cardio', date: '2023-05-14', blocks: 8 },
    { id: 'history-3', title: 'Full Body Workout', date: '2023-05-12', blocks: 15 },
  ];

  const startNewWorkout = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would use the actual user ID
      const { data, error } = await mockFunctions.startWorkout('user-1');
      
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
            {workoutHistory.map((workout, index) => (
              <Card 
                key={workout.id} 
                className="workout-card cursor-pointer hover:bg-secondary/10"
                onClick={() => navigate(`/workouts/${workout.id}/summary`)}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{workout.title}</CardTitle>
                  <CardDescription>
                    {new Date(workout.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    {workout.blocks} workout moments
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
