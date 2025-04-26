import { readContract, writeContract, simulateContract } from '@wagmi/core';
// Assuming configg is your configured wagmi config object
// Renaming to 'config' for clarity is recommended if possible
import { tokenABI, tokenAddress, nftABI, nftAddress, gameABI, gameContract } from "./contract";
import { config } from '@/app/layout';
// --- Token Contract Functions ---

/**
 * Registers the connected user with the token contract.
 */
export const registerUser = async () => {
  try {
    const result = await writeContract(config, {
      address: tokenAddress,
      abi: tokenABI,
      functionName: 'register'
    });
    return result;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

/**
 * Gets the token balance for a given address.
 * @param {`0x${string}`} address - The address to check the balance for.
 * @returns {Promise<bigint>} The token balance.
 */
export const getTokenBalance = async (address) => {
  try {
    return await readContract(config, { // Pass config as the first argument
      address: tokenAddress,
      abi: tokenABI,
      functionName: 'balanceOf',
      args: [address]
    });
  } catch (error) {
    console.error("Error getting token balance:", error);
    throw error;
  }
};

// --- Profile Contract (NFT) Functions ---

/**
 * Creates a profile NFT for the connected user.
 */
export const createProfile = async () => {
  try {
    const result = await writeContract(config, {
      address: nftAddress,
      abi: nftABI,
      functionName: 'createProfile'
    });
    return result;
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
};

/**
 * Checks if a given address corresponds to a new user (has no profile NFT).
 * @param {`0x${string}`} address - The address to check.
 * @returns {Promise<boolean>} True if the user is new, false otherwise.
 */
export const checkIfNewUser = async (address) => {
  try {
    return await readContract(config, { // Pass config as the first argument
      address: nftAddress,
      abi: nftABI,
      functionName: 'isNewUser',
      args: [address]
    });
  } catch (error) {
    console.error("Error checking if new user:", error);
    throw error;
  }
};

// --- Game Contract Functions ---

/**
 * Starts a game, potentially requiring a deposit.
 * @param {string | number | bigint} gameId - The identifier for the game.
 * @param {bigint} amount - The amount (e.g., deposit) associated with starting the game.
 */
export const startGame = async (gameId, amount) => {
  try {
    const result= await writeContract(config, {
      address: gameContract,
      abi: gameABI,
      functionName: 'startGame',
      args: [gameId, amount],
    });
    return result
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

/**
 * Ends a game and records the player's score.
 * @param {string | number | bigint} gameId - The identifier for the game.
 * @param {`0x${string}`} player - The address of the player.
 * @param {number | bigint} score - The player's score.
 */
export const endGame = async (gameId, player, score) => {
  try {
    const result = await writeContract(config, {
      address: gameContract,
      abi: gameABI,
      functionName: 'endGame',
      args: [gameId, player, score]
    });
    return result;
  } catch (error) {
    console.error("Error ending game:", error);
    throw error;
  }
};

/**
 * Gets the high score for a specific game.
 * @param {string | number | bigint} gameId - The identifier for the game.
 * @returns {Promise<any>} The high score data (adjust type based on contract return type).
 */
export const getHighScore = async (gameId) => {
  try {
    return await readContract(config, { // Pass config as the first argument
      address: gameContract,
      abi: gameABI,
      functionName: 'getHighScore',
      args: [gameId]
    });
  } catch (error) {
    console.error("Error getting high score:", error);
    throw error;
  }
};

/**
 * Gets the deposit amount for a specific player in a specific game.
 * @param {string | number | bigint} gameId - The identifier for the game.
 * @param {`0x${string}`} player - The address of the player.
 * @returns {Promise<bigint>} The deposit amount.
 */
export const getGameDeposit = async (gameId, player) => {
  try {
    return await readContract(config, { // Pass config as the first argument
      address: gameContract,
      abi: gameABI,
      functionName: 'getDeposit',
      args: [gameId, player]
    });
  } catch (error) {
    console.error("Error getting game deposit:", error);
    throw error;
  }
};