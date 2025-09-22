import bishopB from './bishop-b.svg';
import bishopW from './bishop-w.svg';
import kingB from './king-b.svg';
import kingW from './king-w.svg';
import knightB from './knight-b.svg';
import knightW from './knight-w.svg';
import pawnB from './pawn-b.svg';
import pawnW from './pawn-w.svg';
import queenB from './queen-b.svg';
import queenW from './queen-w.svg';
import rookB from './rook-b.svg';
import rookW from './rook-w.svg';

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