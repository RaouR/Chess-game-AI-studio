import React from 'react';
import type { Piece } from 'chess.js';
import PieceComponent from './Piece';
import type { Square as SquareType } from '../types';

interface SquareProps {
    name: SquareType;
    piece: Piece | null;
    isLight: boolean;
    isSelected: boolean;
    isLastMove: boolean;
    isPossibleMove: boolean;
    isBeingDragged: boolean;
    isCapture: boolean;
    onClick: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    rank: string;
    file: string;
    isFlipped: boolean;
    isInteractionDisabled: boolean;
}

const Square: React.FC<SquareProps> = ({
    name,
    piece,
    isLight,
    isSelected,
    isLastMove,
    isPossibleMove,
    isBeingDragged,
    isCapture,
    onClick,
    onDragStart,
    onDragOver,
    onDrop,
    rank,
    file,
    isFlipped,
    isInteractionDisabled
}) => {
    const bgColor = isLight ? 'bg-slate-500' : 'bg-slate-700';
    
    const highlightClass = isSelected
        ? 'bg-yellow-400/70'
        : isLastMove
        ? 'bg-cyan-400/40'
        : '';
    
    const rankLabelClass = isFlipped ? 'right-0.5 top-0.5' : 'left-0.5 top-0.5';
    const fileLabelClass = isFlipped ? 'left-0.5 bottom-0.5' : 'right-0.5 bottom-0.5';
    const coordColor = isLight ? 'text-slate-800/80' : 'text-slate-400/80';
    const cursorClass = isInteractionDisabled ? 'cursor-wait' : (piece ? 'cursor-grab' : 'cursor-pointer');

    return (
        <div
            className={`relative flex items-center justify-center ${bgColor} ${cursorClass}`}
            onClick={onClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            aria-label={`Square ${name}`}
        >
            <div className={`absolute inset-0 transition-colors duration-200 ${highlightClass}`} style={{ pointerEvents: 'none' }}></div>
            
            {file === (isFlipped ? 'h' : 'a') && (
                <span className={`absolute text-xs font-semibold select-none pointer-events-none ${rankLabelClass} ${coordColor}`}>
                    {rank}
                </span>
            )}
            {rank === (isFlipped ? '8' : '1') && (
                <span className={`absolute text-xs font-semibold select-none pointer-events-none ${fileLabelClass} ${coordColor}`}>
                    {file}
                </span>
            )}
            
            {piece && <PieceComponent piece={piece} onDragStart={onDragStart} isBeingDragged={isBeingDragged} />}
            
            {isPossibleMove && !isCapture && (
                <div className="absolute w-1/3 h-1/3 bg-black/30 rounded-full z-10 pointer-events-none"></div>
            )}
            
            {isPossibleMove && isCapture && (
                <div className="absolute w-full h-full box-border border-[6px] border-black/30 rounded-full z-10 pointer-events-none"></div>
            )}
        </div>
    );
};

export default Square;