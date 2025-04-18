import * as THREE from 'three';
import { IGameObject } from './types';

interface Particle extends THREE.Mesh {
    velocity: THREE.Vector2;
    lifetime: number;
    age: number;
    rotationSpeed: number;
}

interface Explosion {
    particles: Particle[];
}

export class ExplosionManager implements IGameObject {
    private explosions: Explosion[] = [];
    private particleCount: number = 15;
    private particleMaterials: THREE.MeshBasicMaterial[]; // Reusable materials

    constructor(private scene: THREE.Scene) {
        this.particleMaterials = [
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 1 }),
            new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 1 }),
            new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1 }),
        ];
    }

    createExplosion(position: THREE.Vector3, baseColor?: THREE.Color | number): void {
        const particles: Particle[] = [];
        const baseSpeed = 40;

        for (let i = 0; i < this.particleCount; i++) {
            const materialIndex = Math.floor(Math.random() * this.particleMaterials.length);
            // Clone material to allow individual opacity changes
            const material = this.particleMaterials[materialIndex].clone();
            const size = Math.random() * 1.5 + 0.5; // Slightly larger particles
            const geometry = new THREE.CircleGeometry(size, 6);

            const particle = new THREE.Mesh(geometry, material) as unknown as Particle;
            particle.position.copy(position);

            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * baseSpeed + 15; // Add minimum speed
            particle.velocity = new THREE.Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            particle.rotationSpeed = (Math.random() - 0.5) * 10;
            particle.lifetime = 0.6 + Math.random() * 0.4; // Shorter lifetime
            particle.age = 0;

            this.scene.add(particle);
            particles.push(particle);
        }

        this.explosions.push({ particles });
        this.createFlash(position, baseColor || 0xffffff);
    }

    private createFlash(position: THREE.Vector3, color: THREE.Color | number): void {
        const flashGeometry = new THREE.CircleGeometry(1, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);

        let scale = 1;
        const animateFlash = () => {
            scale += 1.5; // Faster flash expansion
            flash.scale.set(scale, scale, 1);
            flashMaterial.opacity -= 0.15; // Faster fade

            if (flashMaterial.opacity > 0) {
                requestAnimationFrame(animateFlash);
            } else {
                this.scene.remove(flash);
                flash.geometry.dispose();
                flashMaterial.dispose();
            }
        };
        animateFlash();
    }

    update(delta: number): void {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            let allParticlesRemoved = true;

            for (let j = explosion.particles.length - 1; j >= 0; j--) {
                const particle = explosion.particles[j];
                particle.age += delta;

                if (particle.age >= particle.lifetime) {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    (particle.material as THREE.Material).dispose(); // Dispose cloned material
                    explosion.particles.splice(j, 1);
                } else {
                    particle.position.x += particle.velocity.x * delta;
                    particle.position.y += particle.velocity.y * delta;
                    particle.velocity.y -= 50 * delta; // Stronger gravity
                    particle.rotation.z += particle.rotationSpeed * delta;
                    // Fade based on lifetime
                    (particle.material as THREE.Material).opacity = (1 - particle.age / particle.lifetime) * 0.9; // Max opacity 0.9
                    allParticlesRemoved = false;
                }
            }

            if (allParticlesRemoved) {
                this.explosions.splice(i, 1);
            }
        }
    }

    clearAll(): void {
        // Remove any remaining particles from scene and dispose
         this.explosions.forEach(exp => {
            exp.particles.forEach(p => {
                this.scene.remove(p);
                p.geometry.dispose();
                (p.material as THREE.Material).dispose();
            });
         });
        this.explosions = [];
    }

    dispose(): void {
        this.clearAll();
        // Dispose base materials
        this.particleMaterials.forEach(mat => mat.dispose());
    }
}

