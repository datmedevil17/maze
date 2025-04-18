import * as THREE from 'three';
import { IGameObject, IPositionable } from './types';

export class Player implements IGameObject, IPositionable {
    public ship!: THREE.Mesh;
    public hasShield: boolean = false;
    private engineGlow!: THREE.PointLight;

    constructor(private scene: THREE.Scene, private mousePosition: THREE.Vector2) {
        this.createPlayerShip();
    }

    private createPlayerShip(): void {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 5, 0,    // top center
            -4, -5, 0,   // bottom left
            4, -5, 0    // bottom right
        ]);
        // Create faces (indices) - important for BufferGeometry triangles
        geometry.setIndex([0, 1, 2]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals(); // Optional but good practice

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
        });

        this.ship = new THREE.Mesh(geometry, material);
        this.scene.add(this.ship);

        this.engineGlow = new THREE.PointLight(0x00ffff, 1, 10);
        this.engineGlow.position.set(0, -3, 0);
        this.ship.add(this.engineGlow);
    }

    update(delta: number): void {
        // Convert normalized mouse position to world coordinates
        // Adjust scaling based on your camera view size
        const worldX = this.mousePosition.x * 65;
        const worldY = this.mousePosition.y * 100;

        // Simple lerp for smoother movement (optional)
        const lerpFactor = 1 - Math.exp(-15 * delta); // Adjust 15 for responsiveness
        this.ship.position.x += (worldX - this.ship.position.x) * lerpFactor;
        this.ship.position.y += (worldY - this.ship.position.y) * lerpFactor;

        // Clamp position to screen bounds (approximate)
        const bounds = 95; // Adjust based on view
        this.ship.position.x = Math.max(-bounds, Math.min(bounds, this.ship.position.x));
        this.ship.position.y = Math.max(-bounds + 5, Math.min(bounds -5 , this.ship.position.y)); // Y bounds might differ
    }

    getPosition(): THREE.Vector3 {
        return this.ship.position;
    }

    // Helper to add/remove shield visual
    setShieldActive(active: boolean): void {
        this.hasShield = active;
        const existingShield = this.ship.getObjectByName('playerShield');
        if (active && !existingShield) {
            const shieldGeometry = new THREE.RingGeometry(6, 7, 32);
            const shieldMaterial = new THREE.MeshBasicMaterial({
                name: 'playerShieldMaterial', // For disposal
                color: 0x00ff00,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
            });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.name = 'playerShield';
            this.ship.add(shield);
        } else if (!active && existingShield) {
            this.ship.remove(existingShield);
            (existingShield as THREE.Mesh).geometry.dispose();
            const material = (existingShield as THREE.Mesh).material;
            if (Array.isArray(material)) {
                material.forEach(mat => mat.dispose());
            } else {
                material.dispose();
            }
        }
    }

    dispose(): void {
        this.scene.remove(this.ship);
        this.ship.geometry.dispose();
        (this.ship.material as THREE.Material).dispose();
        this.ship.children.forEach(child => {
             if (child instanceof THREE.Mesh || child instanceof THREE.Light) {
                 if (child instanceof THREE.Mesh) {
                     child.geometry.dispose();
                 }
                 if (child instanceof THREE.Mesh) {
                     if (Array.isArray(child.material)) {
                         child.material.forEach(mat => mat.dispose());
                     } else {
                         (child.material as THREE.Material)?.dispose();
                     }
                 }
             }
        });
    }
}
