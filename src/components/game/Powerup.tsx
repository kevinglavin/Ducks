import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';

export default function PowerupSpawner() {
  const { powerupActive, powerupPos } = useGameStore();
  const groupRef = useRef<import('three').Group>(null);

  useFrame((state) => {
    if (groupRef.current && powerupActive) {
      groupRef.current.rotation.y += 0.05;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.2 + 0.5;
    }
  });

  if (!powerupActive || !powerupPos) return null;

  return (
    <group ref={groupRef} position={powerupPos}>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
