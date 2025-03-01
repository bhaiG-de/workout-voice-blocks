
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { WorkoutBlock } from "@/components/ui-blocks/WorkoutBlock";
import { mockFunctions, Block, Workout } from "@/lib/supabase";
import { processVoiceNote } from "@/lib/ai-service";
import { ChevronLeft, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WorkoutPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        if (!workoutId) return;
        
        // In a real app, these would be actual Supabase calls
        const { data: workoutData, error: workoutError } = await mockFunctions.getWorkout(workoutId);
        if (workoutError) throw new Error(workoutError.message);
        
        const { data: blocksData, error: blocksError } = await mockFunctions.getBlocks(workoutId);
        if (blocksError) throw new Error(blocksError.message);
        
        setWorkout(workoutData);
        setBlocks(blocksData);
      } catch (error) {
        console.error('Error fetching workout:', error);
        toast({
          title: "Error",
          description: "Failed to load workout data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkout();
  }, [workoutId, toast]);

  const handleVoiceNote = async (file: File) => {
    if (!workoutId || !workout) return;
    
    setIsProcessing(true);
    try {
      // 1. Upload the voice note to Supabase storage
      const { data: uploadData, error: uploadError } = await mockFunctions.uploadVoiceNote(file, workout.user_id);
      if (uploadError) throw new Error(uploadError.message);
      
      // 2. Process the voice note with the AI
      const aiResponse = await processVoiceNote(uploadData.publicUrl, workoutId);
      
      // 3. Save the new blocks to Supabase
      const { data: newBlocksData, error: saveError } = await mockFunctions.saveBlocks(aiResponse.blocks);
      if (saveError) throw new Error(saveError.message);
      
      // 4. Update the UI with the new blocks
      setBlocks(prevBlocks => [...prevBlocks, ...newBlocksData as Block[]]);
      
      toast({
        title: "Success",
        description: "Your voice note has been processed",
      });
    } catch (error) {
      console.error('Error processing voice note:', error);
      toast({
        title: "Error",
        description: "Failed to process your voice note",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const finishWorkout = async () => {
    if (!workoutId) return;
    
    setIsFinishing(true);
    try {
      const { data, error } = await mockFunctions.finishWorkout(workoutId);
      if (error) throw new Error(error.message);
      
      toast({
        title: "Workout Completed",
        description: "Your workout has been saved",
      });
      
      navigate(`/workouts/${workoutId}/summary`);
    } catch (error) {
      console.error('Error finishing workout:', error);
      toast({
        title: "Error",
        description: "Failed to finish your workout",
        variant: "destructive",
      });
    } finally {
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading workout...</p>
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const workoutDuration = () => {
    const startTime = new Date(workout.started_at);
    const endTime = new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Active Workout</h1>
            <div className="text-sm text-muted-foreground">
              Started at {formatTime(workout.started_at)} ({workoutDuration()})
            </div>
          </div>
        </header>
        
        <section className="mb-8">
          <VoiceRecorder 
            onRecordingComplete={handleVoiceNote}
            isProcessing={isProcessing}
          />
        </section>
        
        {blocks.length > 0 ? (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Workout Moments</h2>
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <WorkoutBlock 
                  key={block.id} 
                  block={block}
                  className={`transition-all duration-300`}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>No moments yet</CardTitle>
                <CardDescription>
                  Record a voice note to start tracking your workout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Try saying something like:</p>
                  <ul className="mt-2 space-y-1">
                    <li>"I just did 3 sets of 10 push-ups"</li>
                    <li>"How can I improve my squat form?"</li>
                    <li>"Note: I'm feeling stronger today"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
        
        <div className="flex justify-center mb-8">
          <Button 
            size="lg" 
            onClick={finishWorkout}
            disabled={isFinishing || blocks.length === 0}
            className="w-full sm:w-auto animate-scale-in"
          >
            {isFinishing ? (
              <span className="flex items-center">
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Finishing...
              </span>
            ) : (
              <span className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finish Workout
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPage;
