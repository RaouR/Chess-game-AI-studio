import type { Difficulty } from '../types.js';

const apiKey = process.env.OPENROUTER_API_KEY;

// Check for API key at module level for an early warning.
if (!apiKey) {
    console.error("OpenRouter API key is not configured. Please set your OpenRouter key in the OPENROUTER_API_KEY environment variable. The AI will not function.");
}

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
    if (!apiKey) {
        throw new Error("OpenRouter API key not found. Please set it in the OPENROUTER_API_KEY environment variable.");
    }

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

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 1 second

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000', // Update with your actual domain for production
                    'X-Title': 'Online Chess App',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-exp:free', // Using Gemini 2.0 Flash via OpenRouter
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.2,
                    max_tokens: 10, // Limit response to just the move
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const move = data.choices[0]?.message?.content?.trim();

            if (!move) {
                throw new Error("No move returned from OpenRouter API");
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
                console.error("All retry attempts failed for OpenRouter API:", error);
                if (error instanceof Error) {
                    console.error("Error details:", error.message, error.stack);
                }
                throw new Error(`Failed to get move from AI API after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
    }
    throw new Error("Unexpected error in retry loop");
};