import React from 'react';

interface ModalProps {
    isLoading: boolean;
    title?: string;
    message?: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isLoading, title, message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-lg shadow-2xl text-center border border-slate-700 w-80">
                {isLoading && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                        <h2 className="text-2xl font-bold mt-4 text-slate-100">AI is thinking...</h2>
                        <p className="text-slate-400 mt-2">The AI is analyzing the board to find the best move.</p>
                    </>
                )}
                {!isLoading && title && (
                    <>
                        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
                        {message && <p className="text-slate-400 mt-2">{message}</p>}
                        <button
                            onClick={onClose}
                            className="mt-6 bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                            Play Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Modal;