import React, { useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function DecoyDuck() {
  const { decoyActive, decoyPos } = useGameStore();
  const groupRef = useRef<import('three').Group>(null);

  if (!decoyActive || !decoyPos) return null;

  return (
    <group ref={groupRef} position={decoyPos}>
      <group position={[0, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.4, 0.8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.6, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.3, 0.4]} />
          <meshStandardMaterial color="#A0522D" roughness={0.9} />
        </mesh>
        {/* Beak */}
        <mesh position={[0, 0.5, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.1, 0.3]} />
          <meshStandardMaterial color="#CD853F" roughness={0.9} />
        </mesh>
        {/* Stand */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.6, 0.1, 1.0]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
      </group>
    </group>
  );
}
