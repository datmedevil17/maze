// Import necessary functions from @wagmi/core, including getAccount

// src/config/wagmi.ts

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  monadTestnet // Ensure this custom chain is correctly configured
} from 'wagmi/chains';

import { readContract, writeContract, getAccount } from '@wagmi/core';
import { tokenABI, tokenAddress, nftABI, nftAddress, gameABI, gameContract } from "./contract";

// --- Token Contract Functions ---
const wagmiConfig = getDefaultConfig({
  appName: 'Maze ',
  projectId: 'YOUR_PROJECT_ID', // !! Remember to replace this !!
  chains: [mainnet, polygon, optimism, arbitrum, base, monadTestnet],
  ssr: true, // Keep this if using SSR features with Wagmi/RainbowKit
});
/**
 * Registers the connected user with the token contract.
 */
export const registerUser = async () => {
  try {
    // Ensure a wallet is connected before trying to write
    const { address, isConnected } = getAccount(wagmiConfig);
    if (!isConnected || !address) {
      throw new Error('Wallet not connected. Cannot register user.');
    }
    // No need to pass address explicitly, writeContract uses the connected one
    const result = await writeContract(wagmiConfig, {
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
    if (!address) {
        throw new Error("Address is required to get token balance.");
    }
    return await readContract(wagmiConfig, { // Pass wagmiConfig as the first argument
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
    // Ensure a wallet is connected before trying to write
    const { address, isConnected } = getAccount(wagmiConfig);
    if (!isConnected || !address) {
      throw new Error('Wallet not connected. Cannot create profile.');
    }
    // No need to pass address explicitly, writeContract uses the connected one
    const result = await writeContract(wagmiConfig, {
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
    if (!address) {
        throw new Error("Address is required to check if new user.");
    }
    return await readContract(wagmiConfig, { // Pass wagmiConfig as the first argument
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
 * The transaction is sent by the connected wallet.
 * @param {string | number | bigint} gameId - The identifier for the game.
 * @param {bigint} amount - The amount (e.g., deposit) associated with starting the game.
 */
export const startGame = async (gameId, amount) => {
  try {
    // Ensure a wallet is connected before trying to write
    const { address, isConnected } = getAccount(wagmiConfig);
    if (!isConnected || !address) {
      throw new Error('Wallet not connected. Cannot start game.');
    }
    // The 'from' address for the transaction will be the connected address
    const result= await writeContract(wagmiConfig, {
      address: gameContract,
      abi: gameABI,
      functionName: 'startGame',
      args: [gameId, amount],
      // 'value' might be needed here if the deposit is in native currency (ETH/MATIC etc.)
      // value: amount // Uncomment and adjust if 'amount' represents native currency deposit
    });
    return result
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

/**
 * Ends a game and records the score for the currently connected player.
 * @param {string | number | bigint} gameId - The identifier for the game.
 * @param {number | bigint} score - The player's score.
 */
export const endGame = async (gameId, score) => {
  try {
    // Get the connected account's address
    const { address: playerAddress, isConnected } = getAccount(wagmiConfig); // Use getAccount

    // Check if a wallet is connected and an address is available
    if (!isConnected || !playerAddress) {
      throw new Error('No wallet connected. Please connect your wallet to end the game.');
    }

    // Call the contract write function, passing the automatically determined player address
    const result = await writeContract(wagmiConfig, {
      address: gameContract,
      abi: gameABI,
      functionName: 'endGame',
      // Pass the retrieved playerAddress as the second argument
      args: [gameId, playerAddress, score]
    });
    return result;
  } catch (error) {
    console.error("Error ending game:", error);
    // Re-throw the error so the caller can handle it if needed
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
    return await readContract(wagmiConfig, { // Pass wagmiConfig as the first argument
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
    if (!player) {
        throw new Error("Player address is required to get game deposit.");
    }
    return await readContract(wagmiConfig, { // Pass wagmiConfig as the first argument
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