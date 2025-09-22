// @google/genai is used as per the coding guidelines.
import { GoogleGenAI } from "@google/genai";
import type { Difficulty } from '../types';

const apiKey = process.env.API_KEY;

// Check for API key at module level for an early warning.
if (!apiKey) {
    console.error("Google AI API key is not configured. Please set your Google AI key in the API_KEY environment variable. The AI will not function.");
}
// Initialize the GoogleGenAI client as per coding guidelines.
const ai = new GoogleGenAI({ apiKey: apiKey! });

const difficultyPrompts = {
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
        throw new Error("API key not found. Please set it in the API_KEY environment variable.");
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

    try {
        // Use ai.models.generateContent with the 'gemini-2.5-flash' model.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
            },
        });
        
        // Extract text directly from response.text as per guidelines.
        const move = response.text.trim();
        
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
        console.error("Error communicating with Google GenAI API:", error);
        throw new Error("Failed to get move from AI API.");
    }
};
