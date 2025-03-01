import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { WorkoutBlock } from "@/components/ui-blocks/WorkoutBlock";
import { supabaseFunctions, Block, Workout } from "@/lib/supabase";
import { processVoiceNote } from "@/services/voiceProcessing";
import { ChevronLeft, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WorkoutPage = () => {
  console.log('🏋️‍♂️ Rendering WorkoutPage');
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
      console.group('📥 Fetching Workout Data');
      console.log('Workout ID:', workoutId);
      try {
        if (!workoutId) return;
        
        // Use real Supabase functions
        const { data: workoutData, error: workoutError } = await supabaseFunctions.getWorkout(workoutId);
        if (workoutError) throw new Error(workoutError.message);
        console.log('✅ Workout data:', workoutData);
        
        const { data: blocksData, error: blocksError } = await supabaseFunctions.getBlocks(workoutId);
        if (blocksError) throw new Error(blocksError.message);
        console.log('✅ Blocks data:', blocksData);
        
        setWorkout(workoutData);
        setBlocks(blocksData);
      } catch (error) {
        console.error('❌ Error fetching workout:', error);
        toast({
          title: "Error",
          description: "Failed to load workout data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };
    
    fetchWorkout();
  }, [workoutId, toast]);

  const handleVoiceNote = async (file: File) => {
    console.group('🎤 Processing Voice Note');
    console.log('File:', file);
    console.log('File type:', file.type);
    console.log('File name:', file.name);
    console.log('File size:', file.size, 'bytes');
    console.log('Workout ID:', workoutId);
    console.log('Current workout:', workout);
    
    if (!workoutId || !workout) {
      console.error('❌ Missing workout data');
      console.groupEnd();
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Upload the voice note to Supabase storage
      console.log('📤 Uploading voice note to Supabase storage...');
      const { data: uploadData, error: uploadError } = await supabaseFunctions.uploadVoiceNote(file, workoutId);
      if (uploadError) throw new Error(uploadError.message);
      console.log('✅ Upload successful:', uploadData);
      
      // 2. Process the voice note with the AI
      console.log('🤖 Processing with AI...');
      const aiResponse = await processVoiceNote(uploadData.publicUrl);
      console.log('✅ AI Processing complete:', aiResponse);
      
      // 3. Save the new blocks to Supabase
      console.log('💾 Saving blocks...');
      const blocksWithWorkoutId = aiResponse.blocks.map(block => ({
        ...block,
        workout_id: workoutId
      }));
      
      const { data: newBlocksData, error: saveError } = await supabaseFunctions.saveBlocks(blocksWithWorkoutId);
      if (saveError) throw new Error(saveError.message);
      console.log('✅ Blocks saved:', newBlocksData);
      
      // 4. Update the workout.blocks array with the new block IDs
      if (newBlocksData && newBlocksData.length > 0) {
        const newBlockIds = newBlocksData.map(block => block.id);
        console.log('🔄 Updating workout.blocks with new block IDs:', newBlockIds);
        
        const { data: updatedWorkout, error: updateError } = await supabaseFunctions.updateWorkoutBlocks(workoutId, newBlockIds);
        if (updateError) {
          console.error('❌ Error updating workout blocks:', updateError);
          throw new Error(updateError.message);
        }
        console.log('✅ Workout blocks updated:', updatedWorkout);
        
        // Update the local workout state with the updated blocks array
        if (updatedWorkout) {
          setWorkout(updatedWorkout);
        }
      }
      
      // 5. Update the local blocks state
      if (newBlocksData) {
        setBlocks(prevBlocks => [...prevBlocks, ...newBlocksData]);
      }
      
      toast({
        title: "Voice note processed",
        description: `Added ${aiResponse.blocks.length} new block(s) to your workout.`,
      });
    } catch (error) {
      console.error('❌ Error processing voice note:', error);
      toast({
        title: "Error processing voice note",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      console.groupEnd();
    }
  };

  const handleFinishWorkout = async () => {
    if (!workoutId) return;
    
    setIsFinishing(true);
    try {
      const { data, error } = await supabaseFunctions.finishWorkout(workoutId);
      if (error) throw new Error(error.message);
      
      toast({
        title: "Workout Completed",
        description: "Your workout has been saved",
      });
      
      // Navigate to the summary page
      navigate(`/workouts/${workoutId}/summary`);
    } catch (error) {
      console.error('Error finishing workout:', error);
      toast({
        title: "Error",
        description: "Failed to finish workout",
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
            onClick={handleFinishWorkout}
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
