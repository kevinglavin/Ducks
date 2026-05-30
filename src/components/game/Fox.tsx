import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useGameRefs } from '../../game/GameContext';
import { Vector3 } from 'three';

export default function Fox() {
  const groupRef = useRef<import('three').Group>(null);
  const { status, pause } = useGameStore();
  const { dogPos } = useGameRefs();
  
  const pos = useRef(new Vector3(15, 0, 15));
  const vel = useRef(new Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2));

  useFrame((state, dt) => {
     if (status !== 'playing' || pause) return;
     if (!groupRef.current) return;

     // Run away from dog
     const distToDog = pos.current.distanceTo(dogPos.current);
     if (distToDog < 8) {
       vel.current.subVectors(pos.current, dogPos.current).normalize().multiplyScalar(4);
     } else {
       // Random wander
       if (Math.random() < 0.05) {
         vel.current.add(new Vector3((Math.random()-0.5)*2, 0, (Math.random()-0.5)*2));
       }
     }
     
     if (vel.current.lengthSq() > 16) {
        vel.current.normalize().multiplyScalar(4);
     }

     pos.current.add(vel.current.clone().multiplyScalar(dt));
     
     // Bounds
     if (pos.current.x > 20 || pos.current.x < -20) vel.current.x *= -1;
     if (pos.current.z > 20 || pos.current.z < -20) vel.current.z *= -1;

     groupRef.current.position.lerp(pos.current, 0.1);
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.4, 0.8]} />
          <meshStandardMaterial color="#d9534f" roughness={0.8} />
        </mesh>
        {/* White Belly */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.1, 0.7]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.6, -0.4]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#d9534f" roughness={0.8} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, 0.5, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.15, 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.55, -0.75]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.15, 0.8, -0.3]} rotation={[0.2, 0, -0.1]}>
          <boxGeometry args={[0.15, 0.2, 0.1]} />
          <meshStandardMaterial color="#d9534f" />
        </mesh>
        <mesh position={[0.15, 0.8, -0.3]} rotation={[0.2, 0, 0.1]}>
          <boxGeometry args={[0.15, 0.2, 0.1]} />
          <meshStandardMaterial color="#d9534f" />
        </mesh>
        {/* Tail */}
        <mesh position={[0, 0.4, 0.5]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.6]} />
          <meshStandardMaterial color="#d9534f" />
        </mesh>
        {/* White tail tip */}
        <mesh position={[0, 0.35, 0.75]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.15, 0.15, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}
