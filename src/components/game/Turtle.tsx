import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useGameRefs } from '../../game/GameContext';
import { Vector3 } from 'three';

export default function Turtle() {
  const groupRef = useRef<import('three').Group>(null);
  const { status, pause } = useGameStore();
  const { turtlePos } = useGameRefs();
  const vel = useRef(new Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)));

  useFrame((state, dt) => {
     if (status !== 'playing' || pause) return;
     if (!groupRef.current) return;

     if (Math.random() < 0.02) {
       vel.current.set((Math.random()-0.5), 0, (Math.random()-0.5)).normalize().multiplyScalar(0.5);
     }
     
     turtlePos.current.add(vel.current.clone().multiplyScalar(dt));
     
     // Bounds
     if (turtlePos.current.x > 18 || turtlePos.current.x < -18) vel.current.x *= -1;
     if (turtlePos.current.z > 18 || turtlePos.current.z < -18) vel.current.z *= -1;

     groupRef.current.position.copy(turtlePos.current);
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0, 0]}>
        {/* Shell */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.25, 0.8]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.9} />
        </mesh>
        {/* Body/Belly */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.1, 0.7]} />
          <meshStandardMaterial color="#8bc34a" roughness={0.9} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.2, -0.45]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.2, 0.3]} />
          <meshStandardMaterial color="#8bc34a" roughness={0.9} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.1, 0.25, -0.6]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.1, 0.25, -0.6]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.3, 0.1, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshStandardMaterial color="#8bc34a" />
        </mesh>
        <mesh position={[0.3, 0.1, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshStandardMaterial color="#8bc34a" />
        </mesh>
        <mesh position={[-0.3, 0.1, 0.3]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshStandardMaterial color="#8bc34a" />
        </mesh>
        <mesh position={[0.3, 0.1, 0.3]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshStandardMaterial color="#8bc34a" />
        </mesh>
      </group>
    </group>
  );
}
