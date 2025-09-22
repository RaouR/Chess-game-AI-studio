import React from 'react';
import type { PieceSymbol } from 'chess.js';
import { PIECE_SVGS } from '../constants';
import type { PlayerColor } from '../types';

interface PromotionModalProps {
    color: PlayerColor;
    onPromote: (piece: PieceSymbol) => void;
}

const PROMOTION_PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

const PromotionModal: React.FC<PromotionModalProps> = ({ color, onPromote }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-center text-slate-100 mb-4">Promote Pawn</h3>
                <div className="flex justify-center space-x-4">
                    {PROMOTION_PIECES.map(piece => (
                        <button
                            key={piece}
                            onClick={() => onPromote(piece)}
                            className="w-20 h-20 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors p-2"
                            aria-label={`Promote to ${piece}`}
                        >
                            <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ __html: PIECE_SVGS[color][piece] }}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PromotionModal;
