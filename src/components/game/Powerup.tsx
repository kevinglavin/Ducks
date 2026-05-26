import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D } from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { useGameRefs } from '../../game/GameContext';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../game/config';

export default function PowerupSpawner() {
   const { status, powerupActive, powerupPos, setPowerup } = useGameStore();
   const { dogPos } = useGameRefs();
   const timer = useRef(0);
   const groupRef = useRef<Group>(null);
   const modelRef = useRef<Object3D>(null);

   useFrame((state, delta) => {
       if (status !== 'playing') return;

       if (!powerupActive && !powerupPos) {
           timer.current += delta;
           if (timer.current > 15 && Math.random() < 0.05) { // Try spawning
               const limitX = WORLD_WIDTH / 2 - 2;
               const limitZ = WORLD_HEIGHT / 2 - 2;
               const pos = new Vector3(
                   (Math.random() - 0.5) * limitX * 2,
                   0.5,
                   (Math.random() - 0.5) * limitZ * 2
               );
               setPowerup(false, pos);
               timer.current = 0;
           }
       }

       if (powerupPos && !powerupActive) {
           // Check collision with dog
           if (dogPos.current.distanceTo(powerupPos) < 2.0) {
               setPowerup(true, null);
               useGameStore.getState().addLog("SPEED BOOST ACTIVATED!");
               setTimeout(() => {
                   setPowerup(false, null);
                   timer.current = 0; // Reset timer for next respawn
               }, 5000);
           }
       }

       if (modelRef.current) {
           modelRef.current.rotation.y += delta * 2;
           modelRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
       }
   });

   if (powerupPos && !powerupActive) {
       return (
           <group ref={groupRef} position={powerupPos}>
               <Html position={[0, 1.5, 0]} center wrapperClass="pointer-events-none z-50">
                    <div className="text-cyan-400 font-bold text-sm drop-shadow bg-black/50 px-2 rounded">
                        ENERGY
                    </div>
               </Html>
               <group ref={modelRef as any}>
                    <mesh castShadow>
                        <octahedronGeometry args={[0.5]} />
                        <meshStandardMaterial color="#00ffff" emissive="#008888" />
                    </mesh>
               </group>
           </group>
       );
   }

   return null;
}
