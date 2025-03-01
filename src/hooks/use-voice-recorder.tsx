
import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'inactive' | 'recording' | 'paused' | 'processing';

export function useVoiceRecorder() {
  const [status, setStatus] = useState<RecordingStatus>('inactive');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setAudioFile(audioFile);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setStatus('inactive');
      });
      
      mediaRecorder.start();
      setStatus('recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('inactive');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
      
      // Stop and release the microphone stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [status]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setStatus('inactive');
  }, [audioUrl]);

  return {
    status,
    audioFile,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording
  };
}
