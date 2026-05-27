import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameRefs } from '../../game/GameContext';
import { useGameStore } from '../../store/gameStore';
import { WORLD_WIDTH, WORLD_HEIGHT, COOP_POSITION } from '../../game/config';

export default function GoldenGoose() {
  const { dogPos } = useGameRefs();
  const { gameId, status } = useGameStore();
  const groupRef = useRef<Group>(null);
  
  const [active, setActive] = useState(false);
  const [popups, setPopups] = useState<{id: string, pos: Vector3, score: number}[]>([]);

  const addPopup = (pos: Vector3, score: number) => {
      const id = Date.now().toString() + Math.random().toString();
      setPopups(prev => [...prev, { id, pos: pos.clone(), score }]);
      setTimeout(() => {
          setPopups(prev => prev.filter(p => p.id !== id));
      }, 1500);
  };

  const timer = useRef(0);
  const coinDropTimer = useRef(0);
  const goosePos = useRef(new Vector3(100, 0, 100));
  const gooseVel = useRef(new Vector3(0, 0, 0));
  
  const gameIdRef = useRef(gameId);

  // Quick reset on new game
  if (gameIdRef.current !== gameId) {
     gameIdRef.current = gameId;
     setActive(false);
     goosePos.current.set(100, 0, 100);
     timer.current = 0;
  }

  useFrame((state, delta) => {
     if (status !== 'playing') return;

     timer.current += delta;

     // Super rare chance to spawn (timer > 30, tiny chance)
     if (timer.current > 30 && !active) {
        timer.current = 0;
        if (Math.random() > 0.8) { // 20% chance every 30s
            setActive(true);
            goosePos.current.set(
                (Math.random() - 0.5) * WORLD_WIDTH * 0.5,
                0.5,
                (Math.random() - 0.5) * WORLD_HEIGHT * 0.5
            );
            useGameStore.getState().addLog("Rare Golden Goose Appeared!");
            if (!useGameStore.getState().hasSeenGoldenEggTooltip && !useGameStore.getState().showTooltip) {
                // We'll reuse the golden egg tooltip or just let it roam
            }
        }
     }

     if (active && groupRef.current) {
         coinDropTimer.current += delta;
         
         if (coinDropTimer.current > 1.0) {
             coinDropTimer.current = 0;
             useGameStore.getState().addCoins(5);
             addPopup(goosePos.current, 5);
         }

         // Actively runs away from the coop
         const dirAwayFromCoop = new Vector3().subVectors(goosePos.current, COOP_POSITION).normalize();
         
         // Also runs away from dog if close
         if (goosePos.current.distanceTo(dogPos.current) < 10) {
             const dirAwayFromDog = new Vector3().subVectors(goosePos.current, dogPos.current).normalize();
             dirAwayFromCoop.add(dirAwayFromDog.multiplyScalar(2.0));
         }

         dirAwayFromCoop.normalize();
         
         gooseVel.current.lerp(dirAwayFromCoop.multiplyScalar(6.0), delta * 2.0); // Fast!
         goosePos.current.add(gooseVel.current.clone().multiplyScalar(delta));

         // Out of bounds check (escaped)
         if (Math.abs(goosePos.current.x) > WORLD_WIDTH / 2 || Math.abs(goosePos.current.z) > WORLD_HEIGHT / 2) {
             setActive(false);
             goosePos.current.set(100, 0, 100);
             useGameStore.getState().addLog("Golden Goose escaped!");
         }

         groupRef.current.position.copy(goosePos.current);
         
         const speedSq = gooseVel.current.lengthSq();
         if (speedSq > 0.01) {
             const targetLookAt = goosePos.current.clone().add(gooseVel.current);
             groupRef.current.lookAt(targetLookAt);
         }
         
         // Waddle animation
         groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.2;
     }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={goosePos.current}>
        <Html position={[0, 2.0, 0]} center wrapperClass="pointer-events-none z-50">
            <div className="text-yellow-400 font-black text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap bg-yellow-900/80 px-2 py-1 rounded border border-yellow-500 animate-pulse">
                "HONK!"
            </div>
        </Html>

        {/* Goose Model */}
        <group position={[0, 0.5, 0]}>
            {/* Body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.7, 0.6, 1.2]} />
                <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Head/Neck */}
            <mesh position={[0, 0.8, -0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 0.8, 0.4]} />
                <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Beak */}
            <mesh position={[0, 1.0, -1.0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.1, 0.4]} />
                <meshStandardMaterial color="#FF8C00" roughness={0.8} />
            </mesh>
        </group>

        {popups.map(p => (
            <Html key={p.id} position={[0, 3, 0]} center zIndexRange={[100, 0]}>
                <div className="animate-out slide-out-to-top-8 fade-out duration-1000 text-yellow-400 font-black text-2xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                    +{p.score} c
                </div>
            </Html>
        ))}
    </group>
  );
}
