import React, { useState, useMemo } from 'react';
import type { Piece, Square as ChessJSSquare, Chess } from 'chess.js';
import Square from './Square';
import type { Square as SquareType, Move } from '../types';

interface ChessboardProps {
    board: (Piece | null)[][];
    game: Chess;
    onMove: (from: SquareType, to: SquareType) => void;
    isFlipped: boolean;
    lastMove: Move | null;
    isInteractionDisabled: boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({ board, game, onMove, isFlipped, lastMove, isInteractionDisabled }) => {
    const [selectedSquare, setSelectedSquare] = useState<SquareType | null>(null);
    const [draggedSquare, setDraggedSquare] = useState<SquareType | null>(null);

    const possibleMoves = useMemo(() => {
        const square = selectedSquare || draggedSquare;
        if (!square || isInteractionDisabled) return new Set<string>();
        const moves = game.moves({ square, verbose: true });
        return new Set(moves.map(move => move.to));
    }, [selectedSquare, draggedSquare, game, isInteractionDisabled]);

    const handleSquareClick = (square: SquareType) => {
        if (isInteractionDisabled) return;

        const pieceOnSquare = game.get(square);

        if (selectedSquare) {
            const isPossible = possibleMoves.has(square);
            if (isPossible) {
                onMove(selectedSquare, square);
                setSelectedSquare(null);
            } 
            else if (selectedSquare === square) {
                setSelectedSquare(null);
            }
            else if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
                setSelectedSquare(square);
            }
            else {
                setSelectedSquare(null);
            }
        } else {
            if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
                setSelectedSquare(square);
            }
        }
    };

    const handleDragStart = (square: SquareType) => {
        if (isInteractionDisabled || game.get(square)?.color !== game.turn()) return;
        setDraggedSquare(square);
        setSelectedSquare(null); // Clear click selection on drag
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (toSquare: SquareType) => {
        if (draggedSquare && possibleMoves.has(toSquare)) {
            onMove(draggedSquare, toSquare);
        }
        setDraggedSquare(null);
    };
    
    const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    return (
        <div className="w-full max-w-[70vh] aspect-square flex items-center justify-center">
            <div className={`grid grid-cols-8 grid-rows-8 w-full h-full border-2 border-slate-800 rounded-lg overflow-hidden shadow-2xl ${isInteractionDisabled ? 'cursor-wait' : ''}`}>
                {ranks.map((rank, rowIndex) =>
                    files.map((file, colIndex) => {
                        const squareName = `${file}${rank}` as ChessJSSquare;
                        const piece = game.get(squareName);
                        
                        return (
                            <Square
                                key={squareName}
                                name={squareName}
                                piece={piece}
                                isLight={(rowIndex + colIndex) % 2 !== 0}
                                isSelected={selectedSquare === squareName}
                                isLastMove={lastMove?.from === squareName || lastMove?.to === squareName}
                                isPossibleMove={possibleMoves.has(squareName)}
                                isBeingDragged={draggedSquare === squareName}
                                isCapture={possibleMoves.has(squareName) && !!piece}
                                onClick={() => handleSquareClick(squareName)}
                                onDragStart={() => handleDragStart(squareName)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(squareName)}
                                rank={rank}
                                file={file}
                                isFlipped={isFlipped}
                                isInteractionDisabled={isInteractionDisabled}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Chessboard;