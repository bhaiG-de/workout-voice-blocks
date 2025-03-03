interface BlockData {
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    exercise_catalogue_id?: string;
    sets: Array<{
      weight: number;
      reps: number;
      notes: string;
    }>;
  }> | null;
  notes: string | null;
  userMessage: string | null;
  AIresponse: string | null;
  note: string | null;
}

interface Block {
  block_type: 'log_exercise' | 'asked_question' | 'made_a_note';
  block_data: BlockData;
}

interface VoiceProcessingResponse {
  strict: boolean;
  blocks: Block[];
}

export async function processVoiceNote(mediaUrl: string): Promise<VoiceProcessingResponse> {
  console.group('🎤 Voice Processing Service');
  console.log('Processing voice note from URL:', mediaUrl);
  
  const endpoint = import.meta.env.VITE_AI_VOICE_ENDPOINT;
  
  if (!endpoint) {
    console.error('❌ Missing AI endpoint configuration');
    console.groupEnd();
    throw new Error('Missing AI voice processing endpoint configuration');
  }

  try {
    console.log('📡 Sending request to AI endpoint:', endpoint);
    console.log('📡 Request payload:', JSON.stringify({ mediaUrl }));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaUrl }),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries([...response.headers.entries()]));

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.groupEnd();
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawResult = await response.text();
    console.log('📥 Raw response (first 1000 chars):', rawResult.substring(0, 1000));
    console.log('📥 Raw response type:', typeof rawResult);
    console.log('📥 Raw response length:', rawResult.length);
    
    let result: VoiceProcessingResponse;
    let parsedData: any;
    
    // Try multiple parsing strategies
    try {
      // Strategy 1: Direct JSON parse
      console.log('🔍 Attempting direct JSON parse...');
      parsedData = JSON.parse(rawResult);
      console.log('✅ Direct parse successful, result type:', typeof parsedData);
      
      // Strategy 2: If it's a string, try parsing it again (double-encoded JSON)
      if (typeof parsedData === 'string') {
        console.log('🔍 Result is a string, attempting second parse...');
        parsedData = JSON.parse(parsedData);
        console.log('✅ Second parse successful, result type:', typeof parsedData);
      }
    } catch (parseError) {
      console.error('❌ All parsing attempts failed:', parseError);
      console.error('❌ Response first 50 chars:', JSON.stringify(rawResult.substring(0, 50)));
      console.groupEnd();
      throw new Error('Invalid response format from voice processing service');
    }
    
    console.log('🔍 Parsed data structure:', JSON.stringify(parsedData, null, 2).substring(0, 500) + '...');
    
    // Try to adapt the response to our expected format
    if (parsedData) {
      // Case 1: Response already matches our expected format
      if (parsedData.blocks && Array.isArray(parsedData.blocks)) {
        console.log('✅ Response already in expected format');
        result = parsedData as VoiceProcessingResponse;
      } 
      // Case 2: Response is an array of blocks directly
      else if (Array.isArray(parsedData)) {
        console.log('⚠️ Response is an array, adapting to expected format');
        result = {
          strict: false,
          blocks: parsedData.map(block => {
            // Ensure each block has the required structure
            if (!block.block_type) {
              block.block_type = 'log_exercise';
            }
            if (!block.block_data) {
              block.block_data = {
                exercises: null,
                notes: null,
                userMessage: null,
                AIresponse: null,
                note: null
              };
            }
            return block;
          })
        };
      }
      // Case 3: Response is a single block
      else if (parsedData.block_type || parsedData.type) {
        console.log('⚠️ Response is a single block, adapting to expected format');
        const blockType = parsedData.block_type || parsedData.type || 'log_exercise';
        const blockData = parsedData.block_data || parsedData.data || {
          exercises: null,
          notes: null,
          userMessage: null,
          AIresponse: null,
          note: null
        };
        
        result = {
          strict: false,
          blocks: [{
            block_type: blockType,
            block_data: blockData
          }]
        };
      }
      // Case 4: Unknown format but has some data we can use
      else {
        console.log('⚠️ Unknown response format, creating fallback structure');
        // Create a generic note from the response
        const noteText = typeof parsedData === 'string' 
          ? parsedData 
          : JSON.stringify(parsedData);
          
        result = {
          strict: false,
          blocks: [{
            block_type: 'made_a_note',
            block_data: {
              exercises: null,
              notes: null,
              userMessage: null,
              AIresponse: null,
              note: `AI processed your voice note but returned an unexpected format. Raw data: ${noteText.substring(0, 200)}...`
            }
          }]
        };
      }
    } else {
      throw new Error('Failed to parse response data');
    }

    console.log('🎉 Successfully processed voice note');
    console.log('🎉 Final result:', result);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error('❌ Error processing voice note:', error);
    console.groupEnd();
    throw error;
  }
} 