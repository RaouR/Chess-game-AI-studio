import React, { useState, useEffect, useCallback } from 'react';
import type { Piece, PieceSymbol } from 'chess.js';
import { Chess } from 'chess.js';

import { GameState, type Difficulty, type PlayerColor, type Move, type GameOver, type GameMode, type Square } from './types';
import { getAiMove } from './services/llamaService';
import Chessboard from './components/Chessboard';
import Controls from './components/Controls';
import Modal from './components/Modal';
import PromotionModal from './components/PromotionModal';

const ChessConstructor = typeof Chess === 'function' ? Chess : (Chess as any).Chess;

const App: React.FC = () => {
    const [game, setGame] = useState<Chess>(new ChessConstructor());
    const [board, setBoard] = useState<(Piece | null)[][]>(game.board());
    const [gameState, setGameState] = useState<GameState>(GameState.SETTINGS);
    const [gameMode, setGameMode] = useState<GameMode>('ai');
    
    // AI Mode settings
    const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    
    // UI State
    const [status, setStatus] = useState("Start a new game");
    const [history, setHistory] = useState<string[]>([]);
    const [lastMove, setLastMove] = useState<Move | null>(null);
    const [gameOver, setGameOver] = useState<GameOver | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isBoardFlipped, setIsBoardFlipped] = useState(false);
    const [promotionMove, setPromotionMove] = useState<{from: Square, to: Square} | null>(null);

    const updateGame = useCallback((gameInstance?: Chess) => {
        const currentGame = gameInstance || game;
        setBoard(currentGame.board());
        setHistory(currentGame.history({ verbose: true }).map(move => move.san));

        const turn = currentGame.turn() === 'w' ? 'White' : 'Black';
        if (currentGame.isGameOver()) {
            if (currentGame.isCheckmate()) {
                const winner = turn === 'White' ? 'Black' : 'White';
                setStatus(`Checkmate! ${winner} wins.`);
                setGameOver({ title: "Checkmate!", message: `${winner} wins.` });
            } else if (currentGame.isDraw()) {
                setStatus("Draw!");
                setGameOver({ title: "Draw!", message: "The game is a draw." });
            } else if (currentGame.isStalemate()) {
                setStatus("Stalemate!");
                setGameOver({ title: "Stalemate!", message: "The game is a stalemate." });
            }
            setIsPlayerTurn(false);
        } else {
            setStatus(`${turn}'s turn`);
            if (gameMode === 'ai') {
                setIsPlayerTurn(currentGame.turn() === playerColor);
            }
        }
    }, [game, playerColor, gameMode]);

    // Effect for loading game from URL (for 'friend' mode)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const gamePgn = urlParams.get('game');
        if (gamePgn) {
            try {
                const pgn = atob(gamePgn);
                const newGame = new ChessConstructor();
                newGame.loadPgn(pgn);
                setGame(newGame);
                setGameMode('friend');
                setGameState(GameState.PLAYING);
                updateGame(newGame);
            } catch (e) {
                console.error("Failed to load game from URL:", e);
                // Clear the invalid param
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [updateGame]);

    // Effect for updating URL when game state changes in 'friend' mode
    useEffect(() => {
        if (gameMode === 'friend' && gameState === GameState.PLAYING && game.history().length > 0) {
            const encodedPgn = btoa(game.pgn());
            const newUrl = `${window.location.pathname}?game=${encodedPgn}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }
    }, [game.pgn(), gameMode, gameState]);
    
    // Effect for handling AI moves
    useEffect(() => {
        if (gameState === GameState.PLAYING && gameMode === 'ai' && !isPlayerTurn && !game.isGameOver()) {
            const makeAiMove = async () => {
                setIsLoadingAI(true);
                try {
                    const pgn = game.pgn();
                    const fen = game.fen();
                    const legalMoves = game.moves();

                    if (legalMoves.length === 0) {
                        updateGame();
                        setIsLoadingAI(false);
                        return;
                    }

                    const aiMove = await getAiMove(pgn, fen, legalMoves, difficulty);
                    
                    if (aiMove) {
                        const gameCopy = new ChessConstructor(game.fen());
                        const moveResult = gameCopy.move(aiMove);
                        
                        if (moveResult) {
                            setGame(gameCopy);
                            setLastMove({ from: moveResult.from, to: moveResult.to });
                            updateGame(gameCopy);
                        } else {
                            console.error("AI's chosen move was invalid:", aiMove, "FEN:", game.fen());
                            setGameOver({ title: "AI Error", message: `The AI made an invalid move (${aiMove}).` });
                        }
                    } else {
                        setGameOver({ title: "AI Error", message: "The AI failed to select a move." });
                    }
                } catch (error) {
                    console.error("Error getting AI move:", error);
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                    setGameOver({ title: "AI Error", message: errorMessage });
                } finally {
                    setIsLoadingAI(false);
                }
            };
            // A small delay to make the player's move feel more "final" before AI responds
            setTimeout(makeAiMove, 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlayerTurn, game, difficulty, gameState, gameMode]);

    const handleStartGame = (mode: GameMode, options: { playerColor?: PlayerColor, difficulty?: Difficulty }) => {
        const newGame = new ChessConstructor();
        setGame(newGame);
        setGameMode(mode);
        setGameState(GameState.PLAYING);
        setHistory([]);
        setLastMove(null);
        setGameOver(null);
        setStatus("White's turn");
        
        if (mode === 'ai') {
            const color = options.playerColor || 'w';
            setPlayerColor(color);
            setDifficulty(options.difficulty || 'easy');
            setIsPlayerTurn(color === 'w');
            setIsBoardFlipped(color === 'b');
        } else {
            setIsBoardFlipped(false);
            // In friend mode, clear any old game from URL
            if (window.location.search) {
                window.history.pushState({}, '', window.location.pathname);
            }
        }
        updateGame(newGame);
    };

    const handleNewGame = () => {
        setGameState(GameState.SETTINGS);
        setGameOver(null);
        setPromotionMove(null);
        if (window.location.search) {
            window.history.pushState({}, '', window.location.pathname);
        }
    };

    const handleMove = (from: Square, to: Square) => {
        if (game.isGameOver() || promotionMove) return;
        
        if (gameMode === 'ai' && !isPlayerTurn) return;

        const piece = game.get(from);
        const isPawn = piece?.type === 'p';
        const isPromotion = (isPawn && ((piece.color === 'w' && from[1] === '7' && to[1] === '8') || (piece.color === 'b' && from[1] === '2' && to[1] === '1')));

        if (isPromotion) {
            const moves = game.moves({square: from, verbose: true});
            if (moves.some(m => m.to === to && m.flags.includes('p'))) {
                setPromotionMove({ from, to });
                return;
            }
        }
        
        const gameCopy = new ChessConstructor(game.fen());
        const moveResult = gameCopy.move({ from, to });

        if (moveResult) {
            setGame(gameCopy);
            setLastMove({ from: moveResult.from, to: moveResult.to });
            updateGame(gameCopy);
        }
    };

    const handlePromotion = (promotionPiece: PieceSymbol) => {
        if (!promotionMove) return;

        const { from, to } = promotionMove;
        const gameCopy = new ChessConstructor(game.fen());
        const moveResult = gameCopy.move({ from, to, promotion: promotionPiece });

        if (moveResult) {
            setGame(gameCopy);
            setLastMove({ from: moveResult.from, to: moveResult.to });
            updateGame(gameCopy);
        }
        setPromotionMove(null);
    }

    const handleFlipBoard = () => {
        setIsBoardFlipped(prev => !prev);
    };
    
    return (
        <div className="text-slate-200 flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
                <Controls
                    gameState={gameState}
                    gameMode={gameMode}
                    status={status}
                    history={history}
                    onStartGame={handleStartGame}
                    onNewGame={handleNewGame}
                    onFlipBoard={handleFlipBoard}
                />
                
                <Chessboard
                    board={board}
                    game={game}
                    onMove={handleMove}
                    isFlipped={isBoardFlipped}
                    lastMove={lastMove}
                    isInteractionDisabled={(gameMode === 'ai' && !isPlayerTurn) || !!promotionMove}
                />
            </div>
            
            {(gameOver || isLoadingAI) && (
                <Modal
                    isLoading={isLoadingAI}
                    title={gameOver?.title}
                    message={gameOver?.message}
                    onClose={handleNewGame}
                />
            )}

            {promotionMove && (
                <PromotionModal 
                    color={game.turn()}
                    onPromote={handlePromotion}
                />
            )}
        </div>
    );
};

export default App;