import * as THREE from 'three';

/**
 * Represents an object within the game that needs periodic updates.
 */
export interface IGameObject {
    /**
     * Updates the game object's state based on the time elapsed since the last frame.
     *
     * @param delta - The time elapsed in seconds since the last update.
     * @param args - Optional additional arguments specific to the object's update logic.
     *               It's generally better to define specific arguments in inheriting interfaces
     *               rather than relying on `unknown[]`. Consider if these are truly needed.
     */
    update(delta: number, ...args: unknown[]): void; // Use unknown instead of any
}

/**
 * Represents an object within the game that has a position in 3D space.
 */
export interface IPositionable {
    /**
     * Retrieves the current position of the object.
     *
     * @returns A THREE.Vector3 representing the object's world position.
     */
    getPosition(): THREE.Vector3;
}