
import React, { useState } from 'react';
import { startGame } from '@/contract/function'; // Adjust the import path as needed

interface RestartGameOverlayProps {
    // Function to be called AFTER the startGame transaction is initiated (or potentially completed/failed)
    // You might want to pass transaction details or error status back up
    onGameStartAttempted: () => void;
    // Optional: A function to handle closing the overlay if needed (e.g., a cancel button)
    // onClose?: () => void;
}

const RestartGameOverlay: React.FC<RestartGameOverlayProps> = ({
    onGameStartAttempted,
    // onClose, // Uncomment if you add a close/cancel mechanism
}) => {
    const [amount, setAmount] = useState<string>(''); // Use string for input flexibility
    const [isStarting, setIsStarting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const gameId = 1; // As specified in the requirements

    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null); // Clear error on input change
        // Allow only numbers (and potentially decimals if needed, adjust regex accordingly)
        const value = event.target.value;
        if (/^\d*$/.test(value)) { // Basic check for positive integers
            setAmount(value);
        }
    };

    const handleStartGame = async () => {
        setError(null); // Clear previous errors
        const numericAmount = parseInt(amount, 10);

        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Please enter a valid amount greater than 0.');
            return;
        }

        setIsStarting(true);
        try {
            console.log(`Attempting to start game ${gameId} with amount ${numericAmount}`);
            // Call the imported function
            const txResponse = await startGame(gameId, BigInt(numericAmount)); // Convert to BigInt for contract interaction

            // You might want to wait for the transaction receipt for confirmation
            console.log('Start game transaction sent:', txResponse);
            // Notify parent component that an attempt was made (successfully initiated)
            onGameStartAttempted();

            // Optionally clear amount after successful start,
            // although the parent will likely unmount this overlay anyway.
            // setAmount('');

        } catch (err: unknown) {
            console.error("Failed to start game:", err);
            const errorMessage = (err as { details?: string })?.details || 'Please try again.';
            setError(`Failed to start game: ${errorMessage}`);
        } finally {
            setIsStarting(false);
        }
    };

    // Basic validation for enabling the button
    const isValidAmount = !isNaN(parseInt(amount, 10)) && parseInt(amount, 10) > 0;

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
            >
                <h1
                    className="
                       text-5xl mb-6 text-cyan-400 font-bold tracking-wider uppercase
                       animate-[pulseCyanGlow_2s_infinite] /* Needs corresponding keyframes */
                   "
                    // Example inline style for the pulse effect if not using CSS keyframes
                    // style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.7)' }}
                >
                    START GAME
                </h1>

                {/* Stake Amount Section */}
                <div className="mb-6 p-4 rounded-lg bg-[rgba(0,0,60,0.5)] w-4/5">
                    <label
                        htmlFor="stake-amount"
                        className="text-lg font-bold text-cyan-400 mb-2 uppercase block"
                    >
                        Amount to Stake
                    </label>
                    <input
                        id="stake-amount"
                        type="number" // Use number but handle as string for validation flexibility
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter amount"
                        min="1" // Basic HTML5 validation hint
                        className="
                            w-full p-3 rounded bg-[rgba(0,0,80,0.6)] border border-cyan-500/50
                            text-white text-2xl font-bold text-center
                            focus:outline-none focus:ring-2 focus:ring-cyan-400
                            disabled:opacity-50
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none // Hide number spinners
                        "
                        disabled={isStarting}
                    />
                </div>

                {/* Error Message Display */}
                {error && (
                    <div className="mb-4 p-2 text-red-400 bg-red-900/30 border border-red-500/50 rounded w-4/5 text-sm">
                        {error}
                    </div>
                )}

                {/* Start Button */}
                <button
                    className={`
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
                        disabled:opacity-60 disabled:cursor-not-allowed
                        disabled:hover:translate-y-0 disabled:hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]
                        disabled:active:translate-y-0
                    `}
                    onClick={handleStartGame}
                    disabled={isStarting || !isValidAmount}
                >
                    {isStarting ? 'STARTING...' : 'STAKE & PLAY'}
                </button>

                {/* Optional: Add a Cancel/Close button if needed */}
                {/*
                <button
                    className="mt-4 text-sm text-gray-400 hover:text-gray-200"
                    onClick={onClose}
                    disabled={isStarting}
                >
                    Cancel
                </button>
                */}
            </div>
        </div>
    );
};

export default RestartGameOverlay;
