import * as THREE from 'three';
import { IGameObject } from './types';
import { BulletManager } from './bulletManager';
import { Player } from './player';

interface PowerUpType {
    type: 'rapidFire' | 'spreadShot' | 'shield';
    color: number;
    duration: number; // seconds
    iconGeometry?: THREE.BufferGeometry | THREE.RingGeometry; // Pre-create geometries
    applyEffect: (bulletManager: BulletManager, player: Player) => () => void; // Returns a cleanup function
}

interface PowerUpMesh extends THREE.Mesh {
    powerUpType: PowerUpType;
}

export class PowerUpManager implements IGameObject {
    public powerUps: PowerUpMesh[] = [];
    public spawnRate: number = 10; // seconds
    public timeSinceLastSpawn: number = 0;
    public powerUpSpeed: number = 25;
    public powerUpRadius: number = 3;
    public powerUpTypes: PowerUpType[];
    public activePowerUpTimers: { [type: string]: NodeJS.Timeout } = {}; // Track active timers

    constructor(public scene: THREE.Scene) {
         // Pre-create icon geometries
         const rapidFireIconGeom = this.createRapidFireIcon();
         const spreadShotIconGeom = this.createSpreadShotIcon();
         const shieldIconGeom = new THREE.RingGeometry(1, 1.5, 24);

        this.powerUpTypes = [
            {
                type: 'rapidFire', color: 0xffff00, duration: 5, iconGeometry: rapidFireIconGeom,
                applyEffect: (bulletManager, _player) => {
                    const originalFireRate = bulletManager.fireRate;
                    bulletManager.fireRate = 0.06;
                    return () => { bulletManager.fireRate = originalFireRate; }; // Cleanup function
                }
            },
            {
                type: 'spreadShot', color: 0xff00ff, duration: 6, iconGeometry: spreadShotIconGeom,
                applyEffect: (bulletManager, _player) => {
                    bulletManager.setFireMethod('spread');
                    return () => { bulletManager.setFireMethod('single'); };
                }
            },
            {
                type: 'shield', color: 0x00ff00, duration: 8, iconGeometry: shieldIconGeom,
                applyEffect: (_bulletManager, player) => {
                    player.setShieldActive(true);
                    return () => { player.setShieldActive(false); };
                }
            }
        ];
    }

     // --- Icon Creation Helpers ---
     public createRapidFireIcon(): THREE.BufferGeometry {
         const geometry = new THREE.BufferGeometry();
         const vertices = new Float32Array([-1,-1.5,0, 0,0.5,0, 1,-0.5,0, 0,1.5,0]);
         geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
         geometry.setIndex([0,1,2, 1,3,2]);
         geometry.computeVertexNormals();
         return geometry;
     }
     public createSpreadShotIcon(): THREE.BufferGeometry {
         const geometry = new THREE.BufferGeometry();
         const vertices = new Float32Array([0,-1.5,0, 0,1.5,0, -1.5,-1.5,0, -1.5,1.5,0, 1.5,-1.5,0, 1.5,1.5,0]);
         geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
         // Define lines instead of triangles
         geometry.setIndex([0,1, 2,3, 4,5]); // 3 separate lines
         return geometry; // Will be rendered as lines if material supports it, or use shape geometry
     }
     // --- End Icon Helpers ---

    update(delta: number, bulletManager: BulletManager, player: Player): void {
        this.timeSinceLastSpawn += delta;

        if (this.timeSinceLastSpawn >= this.spawnRate) {
            this.spawnPowerUp();
            this.timeSinceLastSpawn = 0;
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.position.y -= this.powerUpSpeed * delta;
            powerUp.rotation.z += delta * 2;

            const dx = powerUp.position.x - player.ship.position.x;
            const dy = powerUp.position.y - player.ship.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.powerUpRadius + 5) { // Collision radius (player approx 5)
                this.applyPowerUp(powerUp.powerUpType, bulletManager, player);
                this.createPickupEffect(powerUp.position, powerUp.powerUpType.color);
                this.removePowerUp(i);
                continue; // Skip off-screen check if picked up
            }

            if (powerUp.position.y < -110) {
                this.removePowerUp(i);
            }
        }
    }

    public spawnPowerUp(): void {
        const typeIndex = Math.floor(Math.random() * this.powerUpTypes.length);
        const powerUpType = this.powerUpTypes[typeIndex];

        const geometry = new THREE.CircleGeometry(this.powerUpRadius, 6);
        const material = new THREE.MeshBasicMaterial({
            color: powerUpType.color,
            transparent: true,
            opacity: 0.8,
        });
        const powerUp = new THREE.Mesh(geometry, material) as unknown as PowerUpMesh;

        // Add icon
        if (powerUpType.iconGeometry) {
             const iconMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
             // Check if it's the line geometry for spread shot
             let icon: THREE.Mesh | THREE.LineSegments;
             if (powerUpType.type === 'spreadShot') {
                  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
                  icon = new THREE.LineSegments(powerUpType.iconGeometry, lineMaterial);
             } else {
                  icon = new THREE.Mesh(powerUpType.iconGeometry, iconMaterial);
             }

             icon.scale.setScalar(0.8); // Scale icon appropriately
             powerUp.add(icon);
        }


        const x = Math.random() * 180 - 90;
        powerUp.position.set(x, 110, 0);
        powerUp.powerUpType = powerUpType;

        this.scene.add(powerUp);
        this.powerUps.push(powerUp);
    }

    removePowerUp(index: number): void {
        if (index < 0 || index >= this.powerUps.length) return;
        const powerUp = this.powerUps[index];

        // Dispose icon geometry/material if present
        powerUp.children.forEach(child => {
            if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
                 child.geometry?.dispose();
                 if (Array.isArray(child.material)) {
                     child.material.forEach(mat => mat.dispose());
                 } else {
                     child.material?.dispose();
                 }
            }
        });

        this.scene.remove(powerUp);
        powerUp.geometry.dispose();
        if (Array.isArray(powerUp.material)) {
            powerUp.material.forEach(mat => mat.dispose());
        } else {
            powerUp.material.dispose();
        }
        this.powerUps.splice(index, 1);
    }

    public applyPowerUp(powerUpType: PowerUpType, bulletManager: BulletManager, player: Player): void {
        // Clear any existing timer for the same power-up type
        if (this.activePowerUpTimers[powerUpType.type]) {
            clearTimeout(this.activePowerUpTimers[powerUpType.type]);
            // Note: Need to handle resetting the *previous* effect cleanly if it overlaps.
            // This simple version just starts the new one. A more robust system
            // might queue effects or require the effect function to handle its own reset first.
        }

        const resetEffect = powerUpType.applyEffect(bulletManager, player);

        // Set a timer to reset the effect
        this.activePowerUpTimers[powerUpType.type] = setTimeout(() => {
            resetEffect();
            delete this.activePowerUpTimers[powerUpType.type]; // Remove timer reference
        }, powerUpType.duration * 1000);
    }

     public createPickupEffect(position: THREE.Vector3, color: number): void {
        // Simple expanding ring effect
        const ringGeometry = new THREE.RingGeometry(1, 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        this.scene.add(ring);

        let scale = 1;
        const animateEffect = () => {
            scale += 0.5; // Expansion speed
            ring.scale.set(scale, scale, 1);
            ringMaterial.opacity -= 0.04; // Fade speed

            if (ringMaterial.opacity > 0) {
                requestAnimationFrame(animateEffect);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ringMaterial.dispose();
            }
        };
        animateEffect();
     }

    clearAll(): void {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.removePowerUp(i);
        }
        this.powerUps = [];
        // Clear all active timers
        Object.values(this.activePowerUpTimers).forEach(clearTimeout);
        this.activePowerUpTimers = {};
        this.timeSinceLastSpawn = 0;
    }

    // Call this on component unmount
    dispose(): void {
         this.clearAll();
         // Dispose pre-created geometries if not shared elsewhere
         this.powerUpTypes.forEach(pt => pt.iconGeometry?.dispose());
    }
}
