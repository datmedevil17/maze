import * as THREE from 'three';
import { IGameObject } from './types';

interface Bullet extends THREE.Mesh {
    radius: number;
    velocity?: THREE.Vector2; // For spread shot
}

export class BulletManager implements IGameObject {
    public bullets: Bullet[] = [];
    public bulletSpeed: number = 200;
    public bulletRadius: number = 1;
    public fireRate: number = 0.15; // seconds between shots
    private timeSinceLastShot: number = 0;
    private bulletMaterial: THREE.MeshBasicMaterial;

    // Store original fire method for power-ups
    private originalFireBulletMethod: (playerPosition: THREE.Vector3) => void;

    constructor(public scene: THREE.Scene) { // Make scene public if needed by powerups
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        this.originalFireBulletMethod = this.fireSingleBullet; // Store the default
    }

    update(delta: number, playerPosition: THREE.Vector3, canFire: boolean): void {
        this.timeSinceLastShot += delta;

        if (canFire && this.timeSinceLastShot >= this.fireRate) {
            this.fireBullet(playerPosition); // Use the potentially overridden method
            this.timeSinceLastShot = 0;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            if (bullet.velocity) {
                bullet.position.x += bullet.velocity.x * delta;
                bullet.position.y += bullet.velocity.y * delta;
            } else {
                bullet.position.y += this.bulletSpeed * delta;
            }

            // Remove bullets off screen (adjust bounds)
            if (bullet.position.y > 110 || bullet.position.y < -110 || bullet.position.x < -110 || bullet.position.x > 110) {
                this.removeBullet(i);
            }
        }
    }

    // Default fire method
    private fireSingleBullet(playerPosition: THREE.Vector3): void {
        this.createBullet(playerPosition, 0, this.bulletSpeed);
    }

     // Base method to create any bullet
     createBullet(playerPosition: THREE.Vector3, angleOffset: number = 0, speed: number, velocity?: THREE.Vector2): Bullet {
        const geometry = new THREE.CircleGeometry(this.bulletRadius, 8);
        const bullet = new THREE.Mesh(geometry, this.bulletMaterial.clone()) as unknown as Bullet; // Clone material if changing props

        // Calculate initial position slightly ahead and potentially offset
        const offsetX = 5 * Math.sin(angleOffset); // Adjust 5 = distance from center
        const offsetY = 5 * Math.cos(angleOffset); // Usually positive for forward

        bullet.position.set(
            playerPosition.x + offsetX,
            playerPosition.y + offsetY + 5, // Start slightly ahead of ship nose
            playerPosition.z
        );

        bullet.radius = this.bulletRadius;
        bullet.velocity = velocity ? velocity.clone() : new THREE.Vector2(Math.sin(angleOffset) * speed, Math.cos(angleOffset) * speed);

        this.scene.add(bullet);
        this.bullets.push(bullet);
        return bullet;
    }

    // Current fire method (can be overridden by power-ups)
    fireBullet(playerPosition: THREE.Vector3): void {
        this.originalFireBulletMethod(playerPosition); // Call the stored method
    }

    // Method for spread shot power-up to override fireBullet
    fireSpreadShot(playerPosition: THREE.Vector3): void {
        const spreadAngle = 0.3; // Radians
        this.createBullet(playerPosition, 0, this.bulletSpeed); // Center
        this.createBullet(playerPosition, -spreadAngle, this.bulletSpeed); // Left
        this.createBullet(playerPosition, spreadAngle, this.bulletSpeed); // Right
    }

     // Method to set the fire function (used by power-ups)
     setFireMethod(method: 'single' | 'spread'): void {
        if (method === 'spread') {
            this.originalFireBulletMethod = this.fireSpreadShot;
        } else {
            this.originalFireBulletMethod = this.fireSingleBullet;
        }
     }

    removeBullet(index: number): void {
        if (index < 0 || index >= this.bullets.length) return;
        const bullet = this.bullets[index];
        this.scene.remove(bullet);
        bullet.geometry.dispose();
        if (Array.isArray(bullet.material)) {
            bullet.material.forEach((material) => material.dispose());
        } else {
            bullet.material.dispose();
        }
        this.bullets.splice(index, 1);
    }

    getBullets(): Bullet[] {
        return this.bullets;
    }

    clearAll(): void {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.removeBullet(i);
        }
        this.bullets = [];
        this.timeSinceLastShot = 0;
        this.fireRate = 0.15; // Reset fire rate
        this.setFireMethod('single'); // Reset fire method
    }
}
