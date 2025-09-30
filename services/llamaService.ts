import type { Difficulty } from '../types.js';

const getBaseUrl = () => {
    if (import.meta.env.DEV) {                        const data = await response.json();
            console.log('Raw response from backend:', JSON.stringify(data, null, 2));
            
            const move = data.choices?.[0]?.message?.content?.trim();
            console.log('Extracted move:', move);

            if (!move) {
                console.error('Invalid response format:', JSON.stringify(data, null, 2));
                throw new Error("No move returned from API");
            }

            if (legalMoves.includes(move)) {
                console.log('Move is valid and legal:', move);
                return move;a = await response.json();
            console.log('Received response from backend:', data);
            
            const move = data.choices?.[0]?.message?.content?.trim();
            console.log('Extracted move:', move);

            if (!move) {
                console.error('Invalid response format:', data);
                throw new Error("No move returned from API");
            }

            if (legalMoves.includes(move)) {
                return move;return 'http://localhost:3002';
    }
    return '';
};

// Log the base URL for debugging
console.log('Base URL:', getBaseUrl());

// Enhanced connectivity test
const testLlamaServerConnectivity = async () => {
  try {
    const testUrl = LLAMA_SERVER_URL.replace('/v1/chat/completions', '');
    console.log('Testing connectivity to:', testUrl);
    
    // Try multiple endpoints to diagnose the issue
    const endpoints = [
      testUrl,
      'http://llama_server:8080',
      'http://llama_server:8080/health', // Common health endpoint
      'http://llama_server:8080/v1/models' // Common OpenAI-compatible endpoint
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log('Testing endpoint:', endpoint);
        const response = await fetch(endpoint, { method: 'HEAD' });
        console.log(`Endpoint ${endpoint} response status:`, response.status);
        if (response.ok) return true;
      } catch (error) {
        console.error(`Endpoint ${endpoint} failed:`, error);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Connectivity test failed:', error);
    return false;
  }
};

const difficultyPrompts: Record<Difficulty, string> = {
    easy: "You are a beginner chess player. Pick a reasonable but not optimal move. Sometimes make a mistake.",
    medium: "You are an intermediate chess player. Analyze the position and pick a strong move. Avoid obvious blunders.",
    hard: "You are a world-class chess grandmaster. Analyze the position deeply and pick the absolute best move.",
};

export const getAiMove = async (
    pgn: string,
    fen: string,
    legalMoves: string[],
    difficulty: Difficulty
): Promise<string | null> => {
    const systemInstruction = `You are a chess engine. Your task is to analyze the given chess game and determine the best next move for the current player.
The game history is provided in PGN format, and the current board state in FEN format.

${difficultyPrompts[difficulty]}

From the list of legal moves provided, choose the single best move.
You must respond with only that move from the list. Do not provide any other text, explanation, or commentary.`;

    const userMessage = `Game history (PGN):
${pgn}

Current position (FEN):
${fen}

Legal moves:
[${legalMoves.join(', ')}]`;

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 4000; // 4 seconds

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Attempt ${attempt}: Sending request to ${getBaseUrl()}/api/llama`);
            console.log('Request body:', {
                systemMessage: systemInstruction.substring(0, 100) + '...',
                userMessage: userMessage.substring(0, 100) + '...'
            });

            const response = await fetch(`${getBaseUrl()}/api/llama`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemMessage: systemInstruction,
                    userMessage: userMessage
                }),
            }).catch(error => {
                console.error('Fetch error details:', error);
                throw new Error(`Network error: ${error.message}`);
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || response.statusText;
                
                // Check for rate limit errors specifically
                if (response.status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                    console.warn(`Rate limit detected on attempt ${attempt}. Waiting longer...`);
                    // For rate limits, use exponential backoff with jitter
                    const jitter = Math.random() * 1000; // Add up to 1 second jitter
                    const delay = Math.pow(2, attempt) * 4000 + jitter; // Exponential backoff based on attempt
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry without throwing error yet
                }
                
                throw new Error(`Llama.cpp API error: ${errorMessage}`);
            }

            const data = await response.json();
            const move = data.choices[0]?.message?.content?.trim();

            if (!move) {
                throw new Error("No move returned from Llama.cpp API");
            }

            if (legalMoves.includes(move)) {
                return move;
            } else {
                console.error("AI returned a move that is not in the legal moves list:", move);
                console.warn("Legal moves were:", legalMoves);
                if (legalMoves.length > 0) {
                    const fallbackMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                    console.warn("Falling back to a random legal move:", fallbackMove);
                    return fallbackMove;
                }
                return null;
            }

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === MAX_RETRIES) {
                console.error("All retry attempts failed for Llama.cpp API:", error);
                if (error instanceof Error) {
                    console.error("Error details:", error.message, error.stack);
                }
                
                // Provide more specific error message for network issues
                if (error instanceof Error && error.message.includes('Network error')) {
                    throw new Error(`Failed to connect to AI server at ${getBaseUrl()}/api/llama. Please check that the server is running and accessible.`);
                }
                
                // Provide more specific error message for rate limiting
                if (error instanceof Error && error.message.includes('rate limit')) {
                    throw new Error("AI service is currently rate limited. Please try again in a few minutes.");
                }
                
                throw new Error(`Failed to get move from AI API after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            
            // Exponential backoff with jitter for non-rate-limit errors
            const jitter = Math.random() * 1000; // Add up to 1 second jitter
            const delay = Math.pow(2, attempt) * 4000 + jitter; // Exponential backoff based on attempt
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Unexpected error in retry loop");
};