import bishopB from './bishop-b.svg?raw';
import bishopW from './bishop-w.svg?raw';
import kingB from './king-b.svg?raw';
import kingW from './king-w.svg?raw';
import knightB from './knight-b.svg?raw';
import knightW from './knight-w.svg?raw';
import pawnB from './pawn-b.svg?raw';
import pawnW from './pawn-w.svg?raw';
import queenB from './queen-b.svg?raw';
import queenW from './queen-w.svg?raw';
import rookB from './rook-b.svg?raw';
import rookW from './rook-w.svg?raw';

const PIECE_SVGS = {
  b: {
    b: bishopB,
    k: kingB,
    n: knightB,
    p: pawnB,
    q: queenB,
    r: rookB,
  },
  w: {
    b: bishopW,
    k: kingW,
    n: knightW,
    p: pawnW,
    q: queenW,
    r: rookW,
  },
};

export { PIECE_SVGS };