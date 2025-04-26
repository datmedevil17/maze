"use client";

import React, { useEffect, useRef, useState, useCallback, use } from 'react';
import * as THREE from 'three';

// ... imports remain the same ...
import { Player } from './utils/player';
import { EnemyManager } from './utils/enemyManager';
import { BulletManager } from './utils/bulletManager';
import { PowerUpManager } from './utils/powerUpManager';
import { ExplosionManager } from './utils/explosionManager';
import { HighScoreManager } from './utils/highScoreManager';
import ScoreDisplay from './components/ScoreDisplay';
import GameOverOverlay from './components/GameOverOverlay';
import RestartGameOverlay from './components/RestartGameOverlay';


interface GameManagers {
    player: Player;
    bulletManager: BulletManager;
    enemyManager: EnemyManager;
    powerUpManager: PowerUpManager;
    explosionManager: ExplosionManager;
    highScoreManager: HighScoreManager;
}

// Simplified Loading States
enum LoadingStatus {
    WaitingForDimensions,
    Initializing,
    Ready,
    Error
}

const SpaceShooterGame: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasMountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const mousePositionRef = useRef(new THREE.Vector2(0, 0));
    const managersRef = useRef<GameManagers | null>(null);
    const clockRef = useRef(new THREE.Clock());
    const animationFrameIdRef = useRef<number | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const dimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    // Ref to prevent multiple initialization attempts
    const initAttemptedRef = useRef(false);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isStakeOverlay, setIsStakeOverlay] = useState(false);

    // Simplified state
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.WaitingForDimensions);

    // --- Effect for Initialization, Measurement, Resize ---
    useEffect(() => {
        const container = containerRef.current;
        const mountPoint = canvasMountRef.current;

        // Need both refs to proceed
        if (!container || !mountPoint) {
            console.warn("Setup Effect: Refs not ready.");
            // If already initialized somehow, reset (edge case during hot reload)
            if (loadingStatus !== LoadingStatus.WaitingForDimensions) {
                 setLoadingStatus(LoadingStatus.WaitingForDimensions);
            }
            return;
        }

        let didSetupSuccessfully = false; // Track if setup *within this effect run* completes
        // let localRenderer: THREE.WebGLRenderer | null = null; // Use local vars for cleanup

        console.log(`Setup Effect: Current Status = ${LoadingStatus[loadingStatus]}`);

        // --- Core THREE.js Setup Function ---
        const initializeThree = (width: number, height: number) => {
            // Prevent multiple successful initializations
            if (initAttemptedRef.current) {
                console.log("Initialization already attempted/completed.");
                return;
            }
            // console.log(`Initializing THREE.js with ${width}x${height}`);
            setLoadingStatus(LoadingStatus.Initializing); // Signal initialization start
            initAttemptedRef.current = true; // Mark attempt

            try {
                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(width, height);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setClearColor(0x000000, 0);
                while (mountPoint.firstChild) { mountPoint.removeChild(mountPoint.firstChild); } // Clear old canvas
                mountPoint.appendChild(renderer.domElement);
                rendererRef.current = renderer;
                // localRenderer = renderer; // Store locally for cleanup

                const scene = new THREE.Scene();
                sceneRef.current = scene;

                const aspectRatio = width / height;
                const cameraHeight = 100;
                const cameraWidth = cameraHeight * aspectRatio;
                const camera = new THREE.OrthographicCamera(-cameraWidth, cameraWidth, cameraHeight, -cameraHeight, 1, 1000);
                camera.position.z = 100;
                cameraRef.current = camera;

                const highScoreManager = new HighScoreManager();
                setHighScore(highScoreManager.getHighScore());

                managersRef.current = {
                    player: new Player(scene, mousePositionRef.current),
                    bulletManager: new BulletManager(scene),
                    enemyManager: new EnemyManager(scene, 1),
                    powerUpManager: new PowerUpManager(scene),
                    explosionManager: new ExplosionManager(scene),
                    highScoreManager: highScoreManager,
                };

                didSetupSuccessfully = true;
                setLoadingStatus(LoadingStatus.Ready); // Signal completion
                // console.log("Init Effect: THREE.js setup complete.");

            } catch (error) {
                console.error("Error during THREE.js initialization:", error);
                setLoadingStatus(LoadingStatus.Error);
                initAttemptedRef.current = false; // Allow retry on next mount if error occurred
            }
        };

        // --- Resize Handler ---
        const handleResize = (width: number, height: number) => {
             console.log(`Handling resize: ${width}x${height}`);
             dimensionsRef.current = { width, height };

             // Only resize renderer/camera if they exist (i.e., after setup)
             if (rendererRef.current) rendererRef.current.setSize(width, height);
             if (cameraRef.current) {
                 const aspectRatio = width / height || 1;
                 const cameraHeight = 100;
                 const cameraWidth = cameraHeight * aspectRatio;
                 cameraRef.current.left = -cameraWidth;
                 cameraRef.current.right = cameraWidth;
                 cameraRef.current.top = cameraHeight;
                 cameraRef.current.bottom = -cameraHeight;
                 cameraRef.current.updateProjectionMatrix();
             }
        };

        // --- Initial Measurement & Observer Setup ---
        const setupObserverAndMeasure = () => {
            // Check if observer already exists
            if (resizeObserverRef.current) return;

            resizeObserverRef.current = new ResizeObserver(entries => {
                if (!entries || entries.length === 0) return;
                const { width, height } = entries[0].contentRect;
                handleResize(width, height);

                 // If waiting for dimensions and we get valid ones, AND init hasn't been done
                 if (loadingStatus === LoadingStatus.WaitingForDimensions && width > 0 && height > 0 && !initAttemptedRef.current) {
                     console.log("ResizeObserver provided dimensions, triggering init.");
                     initializeThree(width, height);
                 }
            });
            resizeObserverRef.current.observe(container);
            console.log("ResizeObserver created and observing.");

            // Perform initial measurement
            const initialWidth = container.offsetWidth;
            const initialHeight = container.offsetHeight;
            console.log(`Initial Measurement: ${initialWidth}x${initialHeight}`);
            if (initialWidth > 0 && initialHeight > 0) {
                 // Store dimensions and trigger init immediately if possible
                 dimensionsRef.current = { width: initialWidth, height: initialHeight };
                 // Only initialize if still waiting and init not attempted
                 if (loadingStatus === LoadingStatus.WaitingForDimensions && !initAttemptedRef.current) {
                     initializeThree(initialWidth, initialHeight);
                 } else {
                    // Dimensions already set, just ensure ref is up-to-date
                    handleResize(initialWidth, initialHeight);
                 }
            } else {
                console.warn("Initial container dimensions 0. Waiting for ResizeObserver.");
                 // Ensure state remains WaitingForDimensions if it was Idle/Waiting
                 setLoadingStatus(prev => {
                    if (prev === LoadingStatus.WaitingForDimensions) {
                        return LoadingStatus.WaitingForDimensions;
                    }
                    return prev; // Don't revert from Initializing/Ready/Error
                 });
            }
        };

        // Run the setup logic
        setupObserverAndMeasure();

        // --- Cleanup Function ---
        return () => {
            console.log("Cleaning up Setup Effect...");
            if (resizeObserverRef.current) {
                 // Check ref before accessing current
                 const observer = resizeObserverRef.current;
                 // Unobserve container before disconnecting
                 if (containerRef.current) {
                     observer.unobserve(containerRef.current);
                 }
                 observer.disconnect();
                 resizeObserverRef.current = null;
                 console.log("ResizeObserver disconnected.");
             }

            // Only dispose if setup within *this effect run* succeeded
            if (didSetupSuccessfully) {
                console.log("Executing disposal logic...");
                 // Stop loop first (handled by game loop effect cleanup)
                 managersRef.current?.player?.dispose();
                 managersRef.current?.enemyManager?.clearAll();
                 managersRef.current?.bulletManager?.clearAll();
                 managersRef.current?.powerUpManager?.dispose();
                 managersRef.current?.explosionManager?.dispose();
                 sceneRef.current?.clear();
                 sceneRef.current?.traverse((object) => {
                     if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
                         object.geometry?.dispose();
                         const materials = Array.isArray(object.material) ? object.material : [object.material];
                         materials.forEach(mat => mat?.dispose());
                     }
                  });
                 if (rendererRef.current) { // Check ref before accessing
                     const currentRenderer = rendererRef.current;
                     currentRenderer.dispose();
                      // Use mountPoint ref for removal
                     if (canvasMountRef.current && currentRenderer.domElement && canvasMountRef.current.contains(currentRenderer.domElement)) {
                         canvasMountRef.current.removeChild(currentRenderer.domElement);
                     }
                 }
                 rendererRef.current = null;
                 sceneRef.current = null;
                 cameraRef.current = null;
                 managersRef.current = null;
             }

            // Reset state and attempt flag on unmount
            setLoadingStatus(LoadingStatus.WaitingForDimensions);
            initAttemptedRef.current = false;
            dimensionsRef.current = { width: 0, height: 0 };
            console.log("Setup cleanup finished.");
        };
    // This effect should only run on mount and unmount
    // Do NOT add loadingStatus here, internal logic prevents re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- Effect for Mouse Movement ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleMouseMove = (event: MouseEvent) => {
            const { width, height } = dimensionsRef.current;
            if (width <= 0 || height <= 0) return;
            const rect = container.getBoundingClientRect();
            const elementX = event.clientX - rect.left;
            const elementY = event.clientY - rect.top;
            mousePositionRef.current.x = (elementX / width) * 2 - 1;
            mousePositionRef.current.y = -(elementY / height) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []); // Add listener once

    // --- Game Over Handler (Memoized) ---
    const handleGameOver = useCallback(() => {
         if (isGameOver) return;
         setIsGameOver(true);
         if (managersRef.current) {
             const isNew = managersRef.current.highScoreManager.setHighScore(score);
             if (isNew) setHighScore(managersRef.current.highScoreManager.getHighScore());
         }
     }, [score, isGameOver]);

    // --- Collision Detection (Memoized) ---
    const checkCollisions = useCallback(() => {
        // Check Ready state AND refs
        if (loadingStatus !== LoadingStatus.Ready || !managersRef.current || !managersRef.current.player || !managersRef.current.bulletManager || !managersRef.current.enemyManager || !managersRef.current.explosionManager || !managersRef.current.powerUpManager) return;

        const { player, bulletManager, enemyManager, explosionManager, powerUpManager } = managersRef.current;
        // ... (rest of collision logic remains the same) ...
         const bullets = bulletManager.getBullets();
         const enemies = enemyManager.getEnemies();
         const playerPos = player.getPosition();

         // --- Bullet-Enemy ---
         for (let i = bullets.length - 1; i >= 0; i--) {
             const bullet = bullets[i];
             if (!bullet) continue;
             for (let j = enemies.length - 1; j >= 0; j--) {
                 const enemy = enemies[j];
                 if (!enemy) continue;
                 const dx = bullet.position.x - enemy.position.x;
                 const dy = bullet.position.y - enemy.position.y;
                 const distance = Math.sqrt(dx * dx + dy * dy);
                 if (distance < enemy.radius + bullet.radius) {
                     const color = (enemy.material instanceof THREE.Material && 'color' in enemy.material) ? enemy.material.color : 0xffffff;
                     explosionManager.createExplosion(enemy.position.clone(), color as THREE.Color | number);
                     enemyManager.removeEnemy(j);
                     bulletManager.removeBullet(i);
                     setScore(prev => prev + 1);
                     if (Math.random() < 0.08) powerUpManager.spawnPowerUp();
                     break;
                 }
             }
         }
         // --- Player-Enemy ---
         if (!player.hasShield) {
             const playerR = 4;
             for (let k = enemies.length - 1; k >= 0; k--) {
                 const enemy = enemies[k];
                 if (!enemy) continue;
                 const dx = playerPos.x - enemy.position.x;
                 const dy = playerPos.y - enemy.position.y;
                 const distance = Math.sqrt(dx * dx + dy * dy);
                 if (distance < enemy.radius + playerR) {
                     const color = (enemy.material instanceof THREE.Material && 'color' in enemy.material) ? enemy.material.color : 0xffffff;
                     explosionManager.createExplosion(enemy.position.clone(), color as THREE.Color | number);
                     explosionManager.createExplosion(playerPos.clone(), 0x00ffff);
                     enemyManager.removeEnemy(k);
                     handleGameOver();
                     return;
                 }
             }
         }
    }, [loadingStatus, handleGameOver]); // Dependency

    // --- Game Update Function (Memoized) ---
    const updateGame = useCallback((delta: number) => {
         if (loadingStatus !== LoadingStatus.Ready || !managersRef.current) return; // Check Ready state
         const { player, bulletManager, enemyManager, powerUpManager, explosionManager } = managersRef.current;
         const difficulty = 1 + Math.floor(score / 5) * 0.15;
         player.update(delta);
         bulletManager.update(delta, player.getPosition(), true);
         enemyManager.update(delta, difficulty);
         powerUpManager.update(delta, bulletManager, player);
         explosionManager.update(delta);
         checkCollisions();
     }, [loadingStatus, score, checkCollisions]); // Dependencies

    // --- Game Loop Logic (Memoized Animation Function) ---
    const animate = useCallback(() => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
         // Check Ready state and crucial refs for update/render
         if (loadingStatus !== LoadingStatus.Ready || !managersRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
             // Stop the loop explicitly if conditions aren't met
             if(animationFrameIdRef.current) {
                 cancelAnimationFrame(animationFrameIdRef.current);
                 animationFrameIdRef.current = null;
                 if(clockRef.current.running) clockRef.current.stop();
             }
             return;
         }
        const delta = clockRef.current.getDelta();
         // Add a sanity check for large deltas which can happen when tab is inactive
         if (delta < 0 || delta > 0.5) {
             console.warn(`Skipping frame due to large delta: ${delta}`);
             return;
         }
        updateGame(delta);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }, [loadingStatus, updateGame]); // Dependencies

    // --- Effect to Start/Stop Game Loop ---
    useEffect(() => {
        // Start conditions: Ready state AND not Game Over
        if (loadingStatus === LoadingStatus.Ready && !isGameOver) {
             console.log("Starting game loop via effect...");
             if (!clockRef.current.running) clockRef.current.start();
             if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
             animationFrameIdRef.current = requestAnimationFrame(animate);
         }
        // Stop conditions: Not Ready OR Game Over
        else {
            if (animationFrameIdRef.current) {
                 console.log(`Stopping game loop via effect (State: ${LoadingStatus[loadingStatus]}, GameOver: ${isGameOver})`);
                 cancelAnimationFrame(animationFrameIdRef.current);
                 animationFrameIdRef.current = null;
                 if (clockRef.current.running) clockRef.current.stop();
            }
        }
        return () => {
            if (animationFrameIdRef.current) {
                console.log("Cleaning up game loop effect (cancelling frame)...");
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
                if (clockRef.current.running) clockRef.current.stop();
            }
        };
    }, [loadingStatus, isGameOver, animate]); // Dependencies

    // --- Restart Game Handler (Memoized) ---
    const handleRestart = useCallback(() => {
        if (loadingStatus !== LoadingStatus.Ready || !managersRef.current) return;
        // console.log("Restarting game...");
        setScore(0);
        setHighScore(managersRef.current.highScoreManager.getHighScore());
        // Reset managers
        managersRef.current.player.ship.position.set(0, 0, 0);
        managersRef.current.player.setShieldActive(false);
        managersRef.current.enemyManager.clearAll();
        managersRef.current.bulletManager.clearAll();
        managersRef.current.powerUpManager.clearAll();
        managersRef.current.explosionManager.clearAll();
        // Set game over to false LAST
        setIsGameOver(false);
        setIsStakeOverlay(false);
        console.log("Game Restarted.");
    }, [loadingStatus]);

    // Restart Game stake overlay
    const handleRestartStake = useCallback(()=>{
        if (loadingStatus !== LoadingStatus.Ready || !managersRef.current) return;
        setIsStakeOverlay(true);
    },[loadingStatus]);

    // --- Render ---
    const getLoadingMessage = () => {
        switch (loadingStatus) {
            case LoadingStatus.WaitingForDimensions:
                return "Waiting for parent container dimensions...";
            case LoadingStatus.Initializing:
                return "Loading Game...";
            case LoadingStatus.Error:
                return "Error loading game.";
            default: // Ready or other states
                return null;
        }
    };
    const isLoading = loadingStatus !== LoadingStatus.Ready && loadingStatus !== LoadingStatus.Error;


    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-[#000510]"
            style={{ touchAction: 'none' }}
        >
            {/* Canvas Mount Point */}
            <div
                ref={canvasMountRef}
                className="absolute inset-0 w-full h-full z-0"
            />

             {/* Loading / Error Indicator (simplified) */}
            {isLoading && (
                 <div className="absolute inset-0 z-20 flex justify-center items-center text-white text-center p-4 bg-[#000510]/80 pointer-events-none">
                     {getLoadingMessage()}
                 </div>
            )}
             {loadingStatus === LoadingStatus.Error && (
                  <div className="absolute inset-0 z-20 flex justify-center items-center text-red-500 text-center p-4 bg-[#000510]/80 pointer-events-none">
                      {getLoadingMessage()}
                  </div>
             )}

            {/* Game UI - Render only when Ready */}
            {loadingStatus === LoadingStatus.Ready && (
                 <div className="absolute inset-0 z-10 pointer-events-none"> {/* UI Container */}
                     {!isGameOver && (
                         <div className="pointer-events-auto">
                             <ScoreDisplay score={score} highScore={highScore} />
                         </div>
                     )}
                     {isGameOver && managersRef.current && (
                         <div className="pointer-events-auto">
                            {isStakeOverlay &&
                            <RestartGameOverlay
                              onGameStartAttempted={handleRestart}/>
                             ||
                              <GameOverOverlay
                              score={score}
                              highScore={highScore}
                              isNewHighScore={score > 0 && score === managersRef.current.highScoreManager.getHighScore()}
                              onRestart={handleRestartStake}
                              />
                            }

                         </div>
                     )}
                 </div>
            )}
        </div>
    );
};

export default SpaceShooterGame;