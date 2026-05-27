import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

export default function DecoyDuck() {
  const { decoyActive, decoyPos, pause, status } = useGameStore();
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
     if (pause || status !== 'playing' || !decoyActive) return;
     if (groupRef.current) {
        // Bobbing animation to look like it's quacking/calling
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.2;
        groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
     }
  });

  if (!decoyActive || !decoyPos) return null;

  return (
    <group ref={groupRef} position={[decoyPos.x, 0.5, decoyPos.z]}>
        <Html position={[0, 2.0, 0]} center wrapperClass="pointer-events-none z-40">
            <div className="text-purple-400 font-black text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap bg-purple-900/80 px-2 py-1 rounded border border-purple-500 animate-pulse">
                "QUACK! QUACK!"
            </div>
        </Html>
        {/* Wooden Decoy Model */}
        <group>
            {/* Body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.4, 0.8]} />
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            {/* Head/Neck */}
            <mesh position={[0, 0.4, -0.4]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.5, 0.3]} />
                <meshStandardMaterial color="#3E1F07" roughness={0.9} />
            </mesh>
            {/* Beak */}
            <mesh position={[0, 0.5, -0.6]} castShadow receiveShadow>
                <boxGeometry args={[0.25, 0.1, 0.3]} />
                <meshStandardMaterial color="#FF8C00" roughness={0.8} />
            </mesh>
            {/* Base (like it's on a little stand or just wooden bottom) */}
            <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.1, 0.9]} />
                <meshStandardMaterial color="#2d1300" roughness={1.0} />
            </mesh>
        </group>
    </group>
  );
}
