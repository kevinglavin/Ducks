import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameEvents } from '../../store/gameStore';

export default function Spectators() {
  const groupRef = useRef<import('three').Group>(null);
  
  useFrame((state, dt) => {
     if (groupRef.current) {
        if (Date.now() < gameEvents.cheerUntil) {
           // Jump animation
           groupRef.current.position.y = Math.max(0, Math.sin(state.clock.elapsedTime * 15) * 0.5);
        } else {
           groupRef.current.position.y = 0;
        }
     }
  });

  return (
    <group position={[-15, 0, -10]} ref={groupRef}>
      {/* Viewers along the fence */}
      
      {/* Giraffe 1 */}
      <group position={[0, 0, 0]}>
         <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[0.6, 2, 0.6]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
         {/* Head */}
         <mesh position={[0, 4.2, 0.4]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.8]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
         <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[1, 1.5, 1.5]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
      </group>

      {/* Giraffe 2 */}
      <group position={[3, 0, -1]}>
         <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[0.6, 2, 0.6]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
         {/* Head */}
         <mesh position={[0, 4.2, 0.4]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.8]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
         <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[1, 1.5, 1.5]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
      </group>
      
      {/* Pig 1 */}
      <group position={[6, 0, 1]}>
         <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.8, 0.8, 1.2]} />
            <meshStandardMaterial color="#fbcfe8" />
         </mesh>
         <mesh position={[0, 0.8, 0.6]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#fbcfe8" />
         </mesh>
      </group>

      {/* Pig 2 */}
      <group position={[8, 0, 0.5]}>
         <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.8, 0.8, 1.2]} />
            <meshStandardMaterial color="#fbcfe8" />
         </mesh>
         <mesh position={[0, 0.8, 0.6]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#fbcfe8" />
         </mesh>
      </group>

      {/* Ostrich */}
      <group position={[11, 0, -0.5]}>
         {/* Legs */}
         <mesh position={[-0.2, 0.8, 0]} castShadow>
            <boxGeometry args={[0.1, 1.5, 0.1]} />
            <meshStandardMaterial color="#fbbf24" />
         </mesh>
         <mesh position={[0.2, 0.8, 0]} castShadow>
            <boxGeometry args={[0.1, 1.5, 0.1]} />
            <meshStandardMaterial color="#fbbf24" />
         </mesh>
         {/* Body */}
         <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[1.2, 1, 1.5]} />
            <meshStandardMaterial color="#111111" />
         </mesh>
         {/* Neck & Head */}
         <mesh position={[0, 3, 0.8]} castShadow>
            <boxGeometry args={[0.2, 1.5, 0.2]} />
            <meshStandardMaterial color="#fcd34d" />
         </mesh>
         <mesh position={[0, 3.8, 1]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.6]} />
            <meshStandardMaterial color="#111111" />
         </mesh>
      </group>

      {/* Camel */}
      <group position={[15, 0, 0]}>
         {/* Legs */}
         <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1, 1.5, 2]} />
            <meshStandardMaterial color="#d4a373" />
         </mesh>
         {/* Hump */}
         <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[0.8, 0.8, 1]} />
            <meshStandardMaterial color="#d4a373" />
         </mesh>
         {/* Neck/Head */}
         <mesh position={[0, 2, 1.2]} castShadow rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.4, 1, 0.5]} />
            <meshStandardMaterial color="#d4a373" />
         </mesh>
         <mesh position={[0, 2.5, 1.5]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.8]} />
            <meshStandardMaterial color="#d4a373" />
         </mesh>
      </group>

      {/* Honey Badger */}
      <group position={[18, 0, 1.5]}>
         <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, 1]} />
            <meshStandardMaterial color="#111111" />
         </mesh>
         {/* White back */}
         <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 1]} />
            <meshStandardMaterial color="#e5e5e5" />
         </mesh>
         <mesh position={[0, 0.4, 0.6]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#e5e5e5" />
         </mesh>
      </group>

      {/* Sloth */}
      <group position={[21, 0, -2]}>
         {/* Sitting position */}
         <mesh position={[0, 1.5, 0]} castShadow>
             <boxGeometry args={[0.5, 3, 0.5]} /> {/* Small tree trunk */}
             <meshStandardMaterial color="#8B4513" />
         </mesh>
         <group position={[0, 2, 0.3]} rotation={[0, 0, 0.2]}>
             <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.6, 0.6, 0.8]} />
                <meshStandardMaterial color="#a8a29e" />
             </mesh>
             <mesh position={[0, 0.4, 0.4]} castShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#d6d3d1" />
             </mesh>
         </group>
      </group>

    </group>
  );
}
