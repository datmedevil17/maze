
interface GameOverOverlayProps {
    score: number;
    highScore: number;
    isNewHighScore: boolean;
    onRestart: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
    score,
    highScore,
    isNewHighScore,
    onRestart,
}) => {
    return (
        <div className="absolute inset-0 flex justify-center items-center z-50 bg-black/50">
            <div
                className="
                    w-4/5 max-w-lg p-8 rounded-xl
                    bg-[rgba(0,0,30,0.7)] 
                    shadow-[0_0_30px_rgba(0,255,255,0.3)]
                    border border-[rgba(0,255,255,0.3)]
                    text-white font-sans text-center
                    flex flex-col items-center justify-center
                "
            // Optional: Inline style for Safari prefix if backdrop-blur doesn't work
            // style={{ WebkitBackdropFilter: 'blur(10px)' }}
            >
                <h1
                    className="
                       text-5xl mb-6 text-[#ff3a3a] font-bold tracking-wider uppercase
                       animate-[pulseRedGlow_2s_infinite] /* Reference keyframes */
                   "
                >
                    GAME OVER
                </h1>

                {/* Score Section */}
                <div className="mb-6 p-4 rounded-lg bg-[rgba(0,0,60,0.5)] w-4/5">
                    <div className="text-lg font-bold text-cyan-400 mb-1 uppercase">
                        YOUR SCORE
                    </div>
                    <div className="text-4xl font-bold text-white">{score}</div>
                </div>

                {/* High Score Section */}
                <div className="mb-7 p-4 rounded-lg bg-[rgba(0,0,60,0.5)] w-4/5">
                    <div
                        className={`
                            text-lg font-bold mb-1 uppercase
                            ${isNewHighScore
                                ? 'text-[#ffcc00] animate-[newHighScorePulse_1.5s_infinite]' // Arbitrary color and animation reference
                                : 'text-cyan-400' // Standard color
                            }
                        `}
                    >
                        {isNewHighScore ? 'NEW HIGH SCORE!' : 'HIGH SCORE'}
                    </div>
                    <div
                        className={`
                            text-4xl font-bold
                             ${isNewHighScore ? 'text-[#ffcc00]' : 'text-white'}
                        `}
                        // Conditional inline style for text-shadow still needed
                        style={{
                            textShadow: isNewHighScore ? '0 0 10px rgba(255, 255, 0, 0.7)' : 'none'
                        }}
                    >
                        {highScore}
                    </div>
                </div>


                {/* Restart Button */}
                <button
                    className="
                        py-4 px-6 text-xl font-bold uppercase tracking-wider
                        bg-cyan-500/20 text-cyan-300 
                        border-2 border-cyan-300 rounded-lg
                        cursor-pointer transition-all duration-300 ease-in-out
                        shadow-[0_0_10px_rgba(0,255,255,0.3)]
                        mt-2.5 /* Standard margin */
                        hover:bg-cyan-500/40 hover:-translate-y-0.5
                        hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] 
                        active:translate-y-px
                        active:shadow-[0_0_8px_rgba(0,255,255,0.2)]
                    "
                    onClick={onRestart}
                >
                    PLAY AGAIN
                </button>
            </div>
        </div>
    );
};

export default GameOverOverlay;