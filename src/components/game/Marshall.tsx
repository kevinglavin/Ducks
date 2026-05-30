import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useGameRefs } from '../../game/GameContext';
import { Vector3 } from 'three';

export default function Marshall() {
  const groupRef = useRef<import('three').Group>(null);
  const { status, pause } = useGameStore();
  const { marshallPos } = useGameRefs();
  const vel = useRef(new Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)));

  useFrame((state, dt) => {
     if (status !== 'playing' || pause) return;
     if (!groupRef.current) return;

     if (Math.random() < 0.05) {
       vel.current.set((Math.random()-0.5), 0, (Math.random()-0.5)).normalize().multiplyScalar(2);
     }
     
     marshallPos.current.add(vel.current.clone().multiplyScalar(dt));
     
     // Bounds
     if (marshallPos.current.x > 15 || marshallPos.current.x < -15) vel.current.x *= -1;
     if (marshallPos.current.z > 15 || marshallPos.current.z < -15) vel.current.z *= -1;

     groupRef.current.position.copy(marshallPos.current);
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.5, 0.9]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Spots on body */}
        <mesh position={[0.26, 0.5, 0.2]}>
          <boxGeometry args={[0.02, 0.15, 0.15]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[-0.26, 0.4, -0.2]}>
          <boxGeometry args={[0.02, 0.2, 0.15]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <boxGeometry args={[0.15, 0.02, 0.2]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.7, -0.5]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, 0.6, -0.7]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.2, 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.65, -0.86]}>
          <boxGeometry args={[0.08, 0.08, 0.05]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Ears (Black) */}
        <mesh position={[-0.2, 0.8, -0.4]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.2]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.2, 0.8, -0.4]} rotation={[0, 0, -0.2]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.2]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.15, 0.2, -0.3]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.15, 0.2, -0.3]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.15, 0.2, 0.3]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.15, 0.2, 0.3]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Tail */}
        <mesh position={[0, 0.5, 0.5]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}
