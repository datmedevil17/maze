// components/ScoreDisplay.tsx
import React from 'react';

interface ScoreDisplayProps {
    score: number;
    highScore: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, highScore }) => {
    return (
        <div
            className="
                absolute top-[20px] left-[20px] z-10
                flex flex-col gap-2.5
                p-4 rounded-lg
                bg-[rgba(0,0,30,0.5)] backdrop-blur-[5px]
                shadow-[0_0_10px_rgba(0,255,255,0.2)]
                border border-[rgba(0,255,255,0.1)]
                font-sans
            "
            // Optional: Inline style for Safari prefix if backdrop-blur doesn't work
            // style={{ WebkitBackdropFilter: 'blur(5px)' }}
        >
            <div
               className="text-cyan-400 text-2xl font-bold" // Using standard cyan color
               // Inline style for text-shadow is still necessary
               style={{ textShadow: '0 0 5px rgba(0, 255, 255, 0.7)' }}
            >
               Score: {score}
            </div>
            <div
                className="text-[#ffcc00] text-lg font-bold" // Arbitrary yellow color
                style={{ textShadow: '0 0 5px rgba(255, 204, 0, 0.7)' }}
            >
                Best: {highScore}
            </div>
        </div>
    );
};

export default ScoreDisplay;