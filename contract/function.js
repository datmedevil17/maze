import { readContract, writeContract, prepareWriteContract } from '@wagmi/core'
import { tokenABI, tokenAddress, nftABI, nftAddress, gameABI, gameAddress } from "./contract"

// Token Contract Functions
export const registerUser = async () => {
  const config = await prepareWriteContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'register'
  })
  return await writeContract(config)
}

export const getTokenBalance = async (address) => {
  return await readContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: [address]
  })
}

// Profile Contract Functions
export const createProfile = async () => {
  const config = await prepareWriteContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'createProfile'
  })
  return await writeContract(config)
}

export const checkIfNewUser = async (address) => {
  return await readContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'isNewUser',
    args: [address]
  })
}

// Game Contract Functions
export const startGame = async (gameId, amount) => {
  const config = await prepareWriteContract({
    address: gameAddress,
    abi: gameABI,
    functionName: 'startGame',
    args: [gameId, amount]
  })
  return await writeContract(config)
}

export const endGame = async (gameId, player, score) => {
  const config = await prepareWriteContract({
    address: gameAddress,
    abi: gameABI,
    functionName: 'endGame',
    args: [gameId, player, score]
  })
  return await writeContract(config)
}

export const getHighScore = async (gameId) => {
  return await readContract({
    address: gameAddress,
    abi: gameABI,
    functionName: 'getHighScore',
    args: [gameId]
  })
}

export const getGameDeposit = async (gameId, player) => {
  return await readContract({
    address: gameAddress,
    abi: gameABI,
    functionName: 'getDeposit',
    args: [gameId, player]
  })
}