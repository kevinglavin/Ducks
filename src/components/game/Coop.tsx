import React from 'react';
import { COOP_POSITION, DUCK_CONFIG } from '../../game/config';

export default function Coop() {
  return (
    <group position={COOP_POSITION}>
      {/* Target Zone indicator (Debug or subtle dirt patch) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[DUCK_CONFIG.COOP_ENTRANCE_RADIUS, 32]} />
        <meshStandardMaterial color="#8B7355" opacity={0.3} transparent />
      </mesh>

      {/* Coop Structure */}
      <group position={[0, 0, -2]}>
        {/* Floor */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[6, 0.1, 4]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>

        {/* Hoop Roof (Lowered full cylinder to act as arch) */}
        <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.8, 2.8, 5, 16]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
        </mesh>
        
        {/* Back wall */}
        <mesh position={[0, 1.4, -4.4]} receiveShadow>
          <boxGeometry args={[5.6, 2.8, 0.2]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>

        {/* Framing & Wire Mesh suggestion */}
        <mesh position={[-2.7, 1.4, 0.5]} receiveShadow>
          <boxGeometry args={[0.2, 2.8, 0.2]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>
        <mesh position={[2.7, 1.4, 0.5]} receiveShadow>
          <boxGeometry args={[0.2, 2.8, 0.2]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>
        <mesh position={[0, 2.8, 0.5]} receiveShadow>
          <boxGeometry args={[5.6, 0.2, 0.2]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>

        {/* Straw inside */}
        <mesh position={[0, 0.15, -0.5]} receiveShadow>
          <boxGeometry args={[5, 0.1, 2.5]} />
          <meshStandardMaterial color="#FFD700" roughness={1.0} />
        </mesh>
      </group>

      {/* Hay bales near entrance */}
      <group position={[-3.5, 0.5, 0]} rotation={[0, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshStandardMaterial color="#DAA520" roughness={1} />
        </mesh>
      </group>
      <group position={[3.5, 0.5, 0.5]} rotation={[0, -0.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshStandardMaterial color="#DAA520" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
