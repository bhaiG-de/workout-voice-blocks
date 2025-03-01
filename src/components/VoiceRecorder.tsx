import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2, RefreshCw } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void;
  isProcessing: boolean;
}

export function VoiceRecorder({ onRecordingComplete, isProcessing }: VoiceRecorderProps) {
  const { 
    status, 
    audioFile, 
    audioUrl, 
    startRecording, 
    stopRecording, 
    resetRecording 
  } = useVoiceRecorder();

  const handleSubmit = () => {
    if (audioFile) {
      onRecordingComplete(audioFile);
    }
  };

  // Determine if we're in a processing state (either converting audio or API processing)
  const isConverting = status === 'processing';
  const isInProcessingState = isConverting || isProcessing;
  
  // Get appropriate status message
  const getStatusMessage = () => {
    if (isConverting) return "Converting audio...";
    if (isProcessing) return "Processing with AI...";
    if (status === 'recording') return "Recording...";
    if (status === 'inactive' && !audioUrl) return "Record your workout";
    if (status === 'inactive' && audioUrl) return "Ready to submit";
    return "";
  };

  return (
    <Card className="glass-panel">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Recording status display */}
          <div 
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-2",
              status === 'recording' 
                ? "bg-red-100 text-red-500 animate-pulse-recording" 
                : "bg-secondary text-primary"
            )}
          >
            {status === 'recording' ? (
              <Mic className="h-8 w-8" />
            ) : isInProcessingState ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {isConverting && <span className="text-amber-500">Converting audio...</span>}
              {isProcessing && <span className="text-blue-500">Processing with AI...</span>}
              {status === 'recording' && <span className="text-red-500">Recording...</span>}
              {status === 'inactive' && !audioUrl && "Record your workout"}
              {status === 'inactive' && audioUrl && !isProcessing && "Ready to submit"}
            </p>
            <p className="text-sm text-muted-foreground">
              {status === 'inactive' && !audioUrl && "Speak clearly about what you've done"}
              {status === 'recording' && "Tap stop when you're finished"}
              {isConverting && "Converting to WAV format for better compatibility"}
              {isProcessing && "Your recording is being analyzed"}
              {status === 'inactive' && audioUrl && !isProcessing && "Submit your recording or try again"}
            </p>
          </div>

          {/* Audio player if recording exists */}
          {audioUrl && (
            <div className="w-full mt-2">
              <audio 
                src={audioUrl} 
                controls 
                className="w-full h-10 mt-2" 
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
            {status === 'inactive' && !audioUrl && (
              <Button
                onClick={startRecording}
                className="w-full"
                variant="default"
                size="lg"
              >
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            )}

            {status === 'recording' && (
              <Button
                onClick={stopRecording}
                className="w-full"
                variant="destructive"
                size="lg"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {status === 'inactive' && audioUrl && (
              <>
                <Button
                  onClick={resetRecording}
                  className="w-full"
                  variant="outline"
                  size="lg"
                  disabled={isProcessing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Record Again
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  variant="default"
                  size="lg"
                  disabled={isInProcessingState}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Submit Recording</>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
