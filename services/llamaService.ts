import type { Difficulty } from '../types.js';

const getBaseUrl = () => {
    if (import.meta.env.DEV) {
        return 'http://localhost:3002';
    }
    return '';
};

// Log the base URL for debugging
console.log('Base URL:', getBaseUrl());

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
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;
                
                console.error('API error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                
                if (response.status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                    console.warn(`Rate limit detected on attempt ${attempt}. Waiting longer...`);
                    const jitter = Math.random() * 1000;
                    const delay = Math.pow(2, attempt) * 4000 + jitter;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                throw new Error(`API error: ${errorMessage}`);
            }

            const data = await response.json();
            console.log('Raw response from backend:', JSON.stringify(data, null, 2));
            
            // Extract move from the simplified response format
            const move = data.move?.trim();
            console.log('Extracted move:', move);

            if (!move) {
                console.error('Invalid response format:', JSON.stringify(data, null, 2));
                throw new Error("No move returned from API");
            }

            if (legalMoves.includes(move)) {
                console.log('Move is valid and legal:', move);
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
            console.error(`Attempt ${attempt} failed:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            if (attempt === MAX_RETRIES) {
                console.error("All retry attempts failed:", {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
                
                if (error instanceof Error && error.message.includes('Network error')) {
                    throw new Error(`Failed to connect to AI server at ${getBaseUrl()}/api/llama. Please check that the server is running and accessible.`);
                }
                
                if (error instanceof Error && error.message.includes('rate limit')) {
                    throw new Error("AI service is currently rate limited. Please try again in a few minutes.");
                }
                
                throw new Error(`Failed to get move from AI API after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            
            const jitter = Math.random() * 1000;
            const delay = Math.pow(2, attempt) * 4000 + jitter;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Unexpected error in retry loop");
};