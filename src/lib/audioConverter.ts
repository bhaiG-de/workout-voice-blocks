/**
 * Audio conversion utilities to handle different audio formats
 * and convert them to WAV format for consistent processing
 */

/**
 * Converts any audio blob to WAV format
 * @param audioBlob - The audio blob in any format (webm, mp4, etc.)
 * @returns Promise resolving to a WAV format blob
 */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  console.group('🔄 Converting Audio to WAV');
  console.log('Original audio blob:', {
    type: audioBlob.type,
    size: audioBlob.size
  });
  
  try {
    // If it's already a WAV file, just return it
    if (audioBlob.type === 'audio/wav') {
      console.log('✅ Audio is already in WAV format, no conversion needed');
      console.groupEnd();
      return audioBlob;
    }
    
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Read the blob as an array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.log('📊 Audio buffer size:', arrayBuffer.byteLength, 'bytes');
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('📊 Decoded audio:', {
      duration: audioBuffer.duration,
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate
    });
    
    // Convert to WAV format
    const wavBlob = await encodeWavFromAudioBuffer(audioBuffer);
    console.log('✅ Conversion successful:', {
      type: wavBlob.type,
      size: wavBlob.size
    });
    
    console.groupEnd();
    return wavBlob;
  } catch (error) {
    console.error('❌ Error converting audio to WAV:', error);
    console.log('⚠️ Falling back to original audio format');
    console.groupEnd();
    
    // If conversion fails, create a new blob with audio/wav type but keep original data
    // This is a fallback to at least have the correct MIME type
    try {
      return new Blob([await audioBlob.arrayBuffer()], { type: 'audio/wav' });
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      // Last resort: just return the original blob
      return audioBlob;
    }
  }
}

/**
 * Encodes an AudioBuffer to a WAV format Blob
 * @param audioBuffer - The AudioBuffer to encode
 * @returns Promise resolving to a WAV format blob
 */
async function encodeWavFromAudioBuffer(audioBuffer: AudioBuffer): Promise<Blob> {
  const numOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM format
  const bitDepth = 16; // 16-bit audio
  
  // Get audio data from each channel
  const channelData = [];
  for (let channel = 0; channel < numOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }
  
  // Calculate the total buffer size
  const dataLength = channelData[0].length * numOfChannels * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataLength); // 44 bytes for the header
  const view = new DataView(buffer);
  
  // Write the WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true); // audio format (PCM)
  view.setUint16(22, numOfChannels, true); // number of channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * numOfChannels * (bitDepth / 8), true); // byte rate
  view.setUint16(32, numOfChannels * (bitDepth / 8), true); // block align
  view.setUint16(34, bitDepth, true); // bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // data chunk size
  
  // Write the PCM samples
  const offset = 44;
  let position = offset;
  
  // Interleave the channels
  for (let i = 0; i < channelData[0].length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      // Convert float to 16-bit PCM
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(position, value, true);
      position += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
} 