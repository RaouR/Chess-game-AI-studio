import React, { useState, useRef, useEffect } from 'react';
import { GameState, type PlayerColor, type Difficulty, type GameMode } from '../types';

interface ControlsProps {
    gameState: GameState;
    gameMode: GameMode;
    status: string;
    history: string[];
    onStartGame: (gameMode: GameMode, options: { playerColor?: PlayerColor; difficulty?: Difficulty }) => void;
    onNewGame: () => void;
    onFlipBoard: () => void;
}

const RadioGroup = <T extends string>({ label, name, options, selectedValue, onChange }: { label: string, name: string, options: { value: T, label: string }[], selectedValue: T, onChange: (value: T) => void }) => (
    <div className="mb-4">
        <h3 className="font-semibold mb-2 text-slate-400">{label}</h3>
        <div className={`grid grid-cols-${options.length} gap-2`}>
            {options.map(({ value, label: optionLabel }) => (
                <div key={value}>
                    <input
                        type="radio"
                        id={`${name}-${value}`}
                        name={name}
                        value={value}
                        checked={selectedValue === value}
                        onChange={() => onChange(value)}
                        className="hidden"
                    />
                    <label
                        htmlFor={`${name}-${value}`}
                        className={`block w-full text-center p-2 border rounded-md cursor-pointer text-sm transition-all duration-200 ${
                            selectedValue === value
                                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {optionLabel}
                    </label>
                </div>
            ))}
        </div>
    </div>
);

const SettingsPanel: React.FC<{ onStartGame: ControlsProps['onStartGame'] }> = ({ onStartGame }) => {
    const [gameMode, setGameMode] = useState<GameMode>('ai');
    const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');

    const handleStart = () => {
        onStartGame(gameMode, { playerColor, difficulty });
    };

    return (
        <div>
            <RadioGroup<GameMode>
                label="Game Mode"
                name="game-mode"
                selectedValue={gameMode}
                onChange={setGameMode}
                options={[
                    { value: 'ai', label: 'vs AI' },
                    { value: 'friend', label: 'vs Friend' }
                ]}
            />
            {gameMode === 'ai' && (
                <>
                    <RadioGroup<Difficulty>
                        label="Difficulty"
                        name="difficulty"
                        selectedValue={difficulty}
                        onChange={setDifficulty}
                        options={[
                            { value: 'easy', label: 'Easy' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'hard', label: 'Hard' }
                        ]}
                    />
                    <RadioGroup<PlayerColor>
                        label="Play as"
                        name="player-color"
                        selectedValue={playerColor}
                        onChange={setPlayerColor}
                        options={[
                            { value: 'w', label: 'White' },
                            { value: 'b', label: 'Black' }
                        ]}
                    />
                </>
            )}
            <button
                onClick={handleStart}
                className="w-full bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors duration-200 mt-4"
            >
                Start Game
            </button>
        </div>
    );
};

const StatusPanel: React.FC<Pick<ControlsProps, 'status' | 'history' | 'onNewGame' | 'gameMode' | 'onFlipBoard'>> = ({ status, history, onNewGame, gameMode, onFlipBoard }) => {
    const historyEndRef = useRef<HTMLDivElement>(null);
    const [copyButtonText, setCopyButtonText] = useState('Copy Invite Link');

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Invite Link'), 2000);
        });
    };

    const movePairs = history.reduce((acc, move, i) => {
        if (i % 2 === 0) acc.push([move]);
        else acc[acc.length - 1].push(move);
        return acc;
    }, [] as string[][]);

    return (
        <div>
            <div className="text-lg font-semibold text-center p-3 mb-4 bg-slate-700 text-slate-100 rounded-md">
                {status}
            </div>
            <div className="h-48 overflow-y-auto bg-slate-900 p-2 border border-slate-700 rounded-md text-sm mb-4">
                {history.length === 0 ? (
                    <p className="text-gray-400 text-center pt-2">No moves yet.</p>
                ) : (
                    <ol className="text-slate-300 space-y-1">
                        {movePairs.map((turn, i) => (
                           <li key={i} className="grid grid-cols-[20px_1fr_1fr] items-center gap-x-3 px-2 py-1 rounded bg-slate-800/50">
                                <span className="text-slate-500 font-medium">{i + 1}.</span>
                                <span className="font-mono">{turn[0]}</span>
                                {turn[1] && <span className="font-mono">{turn[1]}</span>}
                            </li>
                        ))}
                    </ol>
                )}
                <div ref={historyEndRef} />
            </div>
            {gameMode === 'friend' && (
                 <div className="grid grid-cols-2 gap-2 mb-2">
                     <button onClick={onFlipBoard} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-200">
                         Flip Board
                     </button>
                     <button onClick={handleCopyLink} className="w-full bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors duration-200">
                         {copyButtonText}
                     </button>
                 </div>
            )}
            <button onClick={onNewGame} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-200">
                New Game
            </button>
        </div>
    );
};

const Controls: React.FC<ControlsProps> = ({ gameState, gameMode, status, history, onStartGame, onNewGame, onFlipBoard }) => {
    return (
        <div className="w-full lg:w-96 p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 self-start">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-100">Online Chess</h1>
            </div>
            {gameState === GameState.SETTINGS ? (
                <SettingsPanel onStartGame={onStartGame} />
            ) : (
                <StatusPanel status={status} history={history} onNewGame={onNewGame} gameMode={gameMode} onFlipBoard={onFlipBoard} />
            )}
        </div>
    );
};

export default Controls;