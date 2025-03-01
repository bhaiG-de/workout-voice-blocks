import { useState, useRef, useCallback } from 'react';
import { convertToWav } from '@/lib/audioConverter';

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
      
      // Get the browser's preferred MIME type for recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : '';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', async () => {
        try {
          setStatus('processing');
          
          // Get the original format audio blob
          const originalBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          
          // Convert to WAV format
          const wavBlob = await convertToWav(originalBlob);
          
          // Create a File object from the WAV blob
          const wavFile = new File([wavBlob], `voice-note-${Date.now()}.wav`, { type: 'audio/wav' });
          
          // Create a URL for playback
          const audioObjectUrl = URL.createObjectURL(wavBlob);
          
          setAudioFile(wavFile);
          setAudioUrl(audioObjectUrl);
          setStatus('inactive');
          
          console.log(`Converted audio from ${mediaRecorder.mimeType} to audio/wav`);
        } catch (error) {
          console.error('Error converting audio:', error);
          setStatus('inactive');
        }
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
