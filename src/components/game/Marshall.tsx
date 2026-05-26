import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameRefs } from '../../game/GameContext';
import { useGameStore } from '../../store/gameStore';
import { WORLD_WIDTH } from '../../game/config';

export default function Marshall() {
  const { marshallPos } = useGameRefs();
  const { gameId, status } = useGameStore();
  const groupRef = useRef<Group>(null);
  
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef(0);
  
  // Every 3 games (when gameId % 3 === 0 and gameId > 0), he spawns once
  const hasSpawnedThisGame = useRef(false);
  const gameIdRef = useRef(gameId);

  // Quick reset on new game
  if (gameIdRef.current !== gameId) {
     gameIdRef.current = gameId;
     hasSpawnedThisGame.current = false;
     setActive(false);
     marshallPos.current.set(100, 0, 100);
  }

  useFrame((state, delta) => {
     if (status !== 'playing') return;

     if (gameId % 3 === 0 && gameId > 0 && !hasSpawnedThisGame.current) {
        timer.current += delta;
        if (timer.current > 10) { // Spawns 10 seconds into the match
            hasSpawnedThisGame.current = true;
            setActive(true);
            marshallPos.current.set(-WORLD_WIDTH, 0, 0); // Start far left
            setMessage("I'm a honey badger!");
            useGameStore.getState().addLog("MARSHALL ENTERED! Chaos ensues!");
        }
     }

     if (active && groupRef.current) {
         // Dash across
         marshallPos.current.x += 15 * delta; // Very fast
         
         // Bob slightly
         marshallPos.current.z = Math.sin(state.clock.elapsedTime * 5) * 5;

         groupRef.current.position.copy(marshallPos.current);
         groupRef.current.lookAt(marshallPos.current.clone().add(new Vector3(1, 0, 0)));

         if (marshallPos.current.x > WORLD_WIDTH * 1.5) {
             setActive(false);
             marshallPos.current.set(100, 0, 100);
             setMessage("");
         }
     }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={marshallPos.current}>
        <Html position={[0, 2, 0]} center wrapperClass="pointer-events-none z-50">
            <div className="text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap bg-red-600/80 px-3 py-1 rounded border border-white">
                "{message}"
            </div>
        </Html>

        {/* Marshall Model - White and Black Spots */}
        <group position={[0, 0.5, 0]}>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.9, 1.2, 1.8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            {/* Spots */}
            <mesh position={[0.46, 0.2, 0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.4, 0.5]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            <mesh position={[-0.46, -0.2, -0.4]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.3, 0.4]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.8, -0.8]} castShadow receiveShadow>
                <boxGeometry args={[0.7, 0.7, 0.7]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            {/* Ear Spot */}
            <mesh position={[0.3, 1.15, -0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.3, 0.1]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            <mesh position={[-0.3, 1.15, -0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.3, 0.1]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            {/* Snout */}
            <mesh position={[0, 0.5, -1.1]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.3, 0.4]} />
                <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.6, -1.3]}>
                <boxGeometry args={[0.15, 0.15, 0.1]} />
                <meshStandardMaterial color="#111" />
            </mesh>
        </group>
    </group>
  );
}
