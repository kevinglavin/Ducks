import React from 'react';
import { useGameStore } from '../../store/gameStore';

export default function Eggs() {
  const { eggs } = useGameStore();

  return (
    <group>
      {eggs.map(egg => (
        <mesh key={egg.id} position={[egg.pos.x, 0.2, egg.pos.z]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" roughness={0.1} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
