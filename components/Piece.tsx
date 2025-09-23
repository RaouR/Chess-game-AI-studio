import React from 'react';
import type { Piece } from 'chess.js';
import { PIECE_SVGS } from 'components/pieces';

interface PieceProps {
  piece: Piece;
  onDragStart: () => void;
  isBeingDragged: boolean;
}

const PieceComponent: React.FC<PieceProps> = ({ piece, onDragStart, isBeingDragged }) => {
  const { type, color } = piece;
  const svg = PIECE_SVGS[color]?.[type];

  if (!svg) {
    return null;
  }

  const dragClass = isBeingDragged ? 'opacity-50' : '';

  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      className={`w-[85%] h-[85%] z-20 pointer-events-none ${dragClass}`}
      style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default PieceComponent;