import * as THREE from 'three';
import { IGameObject } from './types';

// Extend Mesh with custom properties
interface Enemy extends THREE.Mesh {
    radius: number;
    speedBonus: number;
    rotationSpeed: number;
}

export class EnemyManager implements IGameObject {
    public enemies: Enemy[] = [];
    private enemySpeed: number = 30;
    private enemyRadius: number = 5;
    private spawnRate: number = 1.5; // seconds between spawns
    private timeSinceLastSpawn: number = 0;
    private enemyColors: number[] = [0xff0000, 0xff6600, 0xff9900];

    constructor(private scene: THREE.Scene, private difficulty: number) {}

    update(delta: number, currentDifficulty: number): void {
        this.difficulty = currentDifficulty;
        this.timeSinceLastSpawn += delta;

        // Spawn enemies based on difficulty
        const effectiveSpawnRate = this.spawnRate / this.difficulty;
        if (this.timeSinceLastSpawn >= effectiveSpawnRate) {
            this.spawnEnemy();
            this.timeSinceLastSpawn = 0; // Reset timer fully
            // Optional: Carry over excess time: this.timeSinceLastSpawn -= effectiveSpawnRate;
        }

        // Update enemy positions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.position.y -= (this.enemySpeed + enemy.speedBonus) * delta;
            enemy.rotation.z += delta * enemy.rotationSpeed;

            // Remove enemies that have gone off screen (adjust bounds as needed)
            if (enemy.position.y < -110) { // Give some margin
                this.removeEnemy(i);
            }
        }
    }

    private spawnEnemy(): void {
        const type = Math.floor(Math.random() * 3);
        let geometry: THREE.BufferGeometry;

        switch (type) {
            case 0: geometry = new THREE.CircleGeometry(this.enemyRadius, 3); break; // Triangle
            case 1: geometry = new THREE.CircleGeometry(this.enemyRadius, 4); break; // Square
            case 2: geometry = new THREE.CircleGeometry(this.enemyRadius, 6); break; // Hexagon
            default: geometry = new THREE.CircleGeometry(this.enemyRadius, 6); break;
        }

        const colorIndex = Math.floor(Math.random() * this.enemyColors.length);
        const material = new THREE.MeshBasicMaterial({
            color: this.enemyColors[colorIndex],
            side: THREE.DoubleSide,
        });

        const enemy = new THREE.Mesh(geometry, material) as unknown as Enemy;

        const x = Math.random() * 180 - 90; // Adjust range based on camera view
        enemy.position.set(x, 110, 0); // Start slightly off-screen top
        enemy.radius = this.enemyRadius;
        enemy.speedBonus = Math.random() * 20 * this.difficulty;
        enemy.rotationSpeed = (Math.random() - 0.5) * 4; // Increased rotation variation

        this.scene.add(enemy);
        this.enemies.push(enemy);
    }

    removeEnemy(index: number): void {
        if (index < 0 || index >= this.enemies.length) return;
        const enemy = this.enemies[index];
        this.scene.remove(enemy);
        enemy.geometry.dispose();
        if (Array.isArray(enemy.material)) {
            enemy.material.forEach(mat => mat.dispose());
        } else {
            enemy.material.dispose();
        }
        this.enemies.splice(index, 1);
    }

    getEnemies(): Enemy[] {
        return this.enemies;
    }

    clearAll(): void {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.removeEnemy(i);
        }
        this.enemies = [];
        this.timeSinceLastSpawn = 0;
    }
}