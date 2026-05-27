import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameRefs } from '../../game/GameContext';
import { useGameStore, triggerHorseEvent } from '../../store/gameStore';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../game/config';

export default function Turtle() {
  const { turtlePos, dogPos } = useGameRefs();
  const { gameId, status } = useGameStore();
  const groupRef = useRef<Group>(null);
  
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef(0);
  
  // Spawns every 15 seconds if active
  const hasSpawnedThisGame = useRef(false);
  const gameIdRef = useRef(gameId);

  // Quick reset on new game
  if (gameIdRef.current !== gameId) {
     gameIdRef.current = gameId;
     hasSpawnedThisGame.current = false;
     setActive(false);
     turtlePos.current.set(100, 0, 100);
     timer.current = 0;
  }

  useFrame((state, delta) => {
     if (status !== 'playing') return;

     timer.current += delta;

     // Spawn turtle randomly every 20 seconds, only once per cycle to keep it simple, or just a chance
     if (timer.current > 20 && !active) {
        timer.current = 0;
        if (Math.random() > 0.5) { // 50% chance to spawn every 20s
            setActive(true);
            turtlePos.current.set(
                (Math.random() - 0.5) * WORLD_WIDTH * 0.8,
                0,
                (Math.random() - 0.5) * WORLD_HEIGHT * 0.8
            );
            setMessage("SNAP!");
            useGameStore.getState().addLog("Snapping Turtle appeared!");
            if (!useGameStore.getState().hasSeenTurtleTooltip && !useGameStore.getState().showTooltip) {
                useGameStore.getState().setShowTooltip('turtle');
                useGameStore.getState().markTooltipSeen('turtle');
            }
        }
     }

     if (active && groupRef.current) {
         // It doesn't move much, just rotates slowly
         groupRef.current.rotation.y += delta * 0.5;

         // Check collision with dog
         if (dogPos.current.distanceTo(turtlePos.current) < 2.0 && useGameStore.getState().dogStunnedUntil < state.clock.elapsedTime) {
            useGameStore.getState().setDogStunned(state.clock.elapsedTime + 3); // Stun for 3 seconds
            useGameStore.getState().addLog("BITTEN! Slowed down!");
            triggerHorseEvent('laugh');
            // Despawn after biting
            setActive(false);
            turtlePos.current.set(100, 0, 100);
         }
         
         // Despawn after 10 seconds of being active
         if (timer.current > 10) {
             setActive(false);
             turtlePos.current.set(100, 0, 100);
         }
     }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={turtlePos.current}>
        <Html position={[0, 1.5, 0]} center wrapperClass="pointer-events-none z-50">
            <div className="text-white font-black text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap bg-green-800/80 px-2 py-1 rounded border border-green-500">
                "{message}"
            </div>
        </Html>

        {/* Turtle Model */}
        <group position={[0, 0.4, 0]}>
            {/* Shell */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.8, 0.8, 0.4, 6]} />
                <meshStandardMaterial color="#2E4A1E" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#3A5A2E" roughness={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0, -1.0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.3, 0.5]} />
                <meshStandardMaterial color="#4A6A3E" roughness={0.9} />
            </mesh>
            {/* Legs */}
            <mesh position={[0.6, -0.2, -0.5]} castShadow receiveShadow rotation={[0, 0.5, 0]}>
                <boxGeometry args={[0.4, 0.2, 0.2]} />
                <meshStandardMaterial color="#3A5A2E" roughness={0.9} />
            </mesh>
            <mesh position={[-0.6, -0.2, -0.5]} castShadow receiveShadow rotation={[0, -0.5, 0]}>
                <boxGeometry args={[0.4, 0.2, 0.2]} />
                <meshStandardMaterial color="#3A5A2E" roughness={0.9} />
            </mesh>
            <mesh position={[0.6, -0.2, 0.5]} castShadow receiveShadow rotation={[0, -0.5, 0]}>
                <boxGeometry args={[0.4, 0.2, 0.2]} />
                <meshStandardMaterial color="#3A5A2E" roughness={0.9} />
            </mesh>
            <mesh position={[-0.6, -0.2, 0.5]} castShadow receiveShadow rotation={[0, 0.5, 0]}>
                <boxGeometry args={[0.4, 0.2, 0.2]} />
                <meshStandardMaterial color="#3A5A2E" roughness={0.9} />
            </mesh>
            {/* Tail */}
            <mesh position={[0, -0.1, 0.8]} castShadow receiveShadow>
                <coneGeometry args={[0.1, 0.5, 4]} />
                <meshStandardMaterial color="#3A5A2E" roughness={0.9} />
            </mesh>
        </group>
    </group>
  );
}
