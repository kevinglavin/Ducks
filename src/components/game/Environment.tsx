import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../game/config';

function Rain() {
  const { weather, status, pause } = useGameStore();
  const count = 500;
  const puddleCount = 40;
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const puddleMeshRef = React.useRef<THREE.InstancedMesh>(null);

  const rainData = React.useMemo(() => {
    return Array.from({ length: count }, () => {
      return {
        x: (Math.random() - 0.5) * WORLD_WIDTH * 1.5,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * WORLD_HEIGHT * 1.5,
        speed: 10 + Math.random() * 5
      }
    });
  }, [count]);

  const puddleData = React.useMemo(() => {
    return Array.from({ length: puddleCount }, () => {
      return {
        x: (Math.random() - 0.5) * WORLD_WIDTH * 0.9,
        z: (Math.random() - 0.5) * WORLD_HEIGHT * 0.9,
        scale: 0.5 + Math.random() * 1.5
      }
    });
  }, [puddleCount]);

  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (weather !== 'rain' || status !== 'playing' || pause) return;

    if (meshRef.current) {
        rainData.forEach((drop, i) => {
          drop.y -= drop.speed * delta;
          if (drop.y < 0) {
            drop.y = 20;
            drop.x = (Math.random() - 0.5) * WORLD_WIDTH * 1.5;
            drop.z = (Math.random() - 0.5) * WORLD_HEIGHT * 1.5;
          }
          dummy.position.set(drop.x, drop.y, drop.z);
          dummy.scale.set(1, Math.random() * 2 + 1, 1);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (puddleMeshRef.current) {
        puddleData.forEach((puddle, i) => {
            dummy.position.set(puddle.x, 0.02, puddle.z);
            dummy.scale.set(puddle.scale, 1, puddle.scale);
            // gentle throbbing for wet reflection effect
            dummy.scale.y = 1;
            dummy.rotation.x = -Math.PI / 2;
            dummy.updateMatrix();
            puddleMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        puddleMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (weather !== 'rain') return null;

  return (
    <group>
        <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
          <boxGeometry args={[0.02, 0.4, 0.02]} />
          <meshBasicMaterial color="#aaccff" opacity={0.4} transparent />
        </instancedMesh>
        <instancedMesh ref={puddleMeshRef} args={[undefined as any, undefined as any, puddleCount]} receiveShadow>
          <circleGeometry args={[1, 16]} />
          <meshStandardMaterial color="#4169e1" transparent opacity={0.3} roughness={0.1} />
        </instancedMesh>
    </group>
  );
}

export default function Environment() {
  const boundsX = WORLD_WIDTH / 2;
  const boundsZ = WORLD_HEIGHT / 2;

  // Simple fence generator
  const createFenceLine = (start: [number, number], end: [number, number], segments = 10) => {
    const list = [];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    
    for (let i = 0; i <= segments; i++) {
      const x = start[0] + dx * (i / segments);
      const z = start[1] + dz * (i / segments);
      list.push(
        <group key={`fence_${start[0]}_${start[1]}_${i}`} position={[x, 0.5, z]}>
          {/* Post */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.2, 1, 0.2]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
        </group>
      );
    }
    
    // Rails
    list.push(
      <group key={`rail_${start[0]}_${start[1]}`} position={[start[0] + dx/2, 0.6, start[1] + dz/2]} rotation={[0, Math.atan2(dx, dz), 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.1, Math.sqrt(dx*dx + dz*dz) + 0.2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      </group>
    );

    return list;
  };

  const trees = React.useMemo(() => {
    const list = [];
    [-boundsX - 1.5, boundsX + 1.5].forEach((x, xidx) => {
      [-boundsZ + 4, 0, boundsZ - 4].forEach((z, zidx) => {
        list.push({
          id: `tree_${xidx}_${zidx}`,
          position: [x + (Math.random() - 0.5), 0, z + (Math.random() * 2 - 1)] as [number, number, number]
        });
      });
    });
    return list;
  }, [boundsX, boundsZ]);

  const hayBales = React.useMemo(() => {
     const list = [];
     for(let i=0; i<3; i++) {
         list.push({
             id: `hay_${i}`,
             position: [(Math.random() - 0.5) * (WORLD_WIDTH - 4), 0.4, (Math.random() - 0.5) * (WORLD_HEIGHT - 6)] as [number, number, number],
             rotation: [0, Math.random() * Math.PI, 0] as [number, number, number]
         });
     }
     return list;
  }, []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH + 4, WORLD_HEIGHT + 4]} />
        <meshStandardMaterial color="#6B8E23" roughness={1} />
      </mesh>

      {/* Dirt play area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH, WORLD_HEIGHT]} />
        <meshStandardMaterial color="#9c7a52" roughness={0.9} />
      </mesh>

      {/* Boundaries (Fences) */}
      <group>
        {/* Left */}
        {createFenceLine([-boundsX, boundsZ], [-boundsX, -boundsZ], 12)}
        {/* Right */}
        {createFenceLine([boundsX, boundsZ], [boundsX, -boundsZ], 12)}
        {/* Bottom */}
        {createFenceLine([-boundsX, boundsZ], [boundsX, boundsZ], 8)}
        {/* Top */}
        {createFenceLine([-boundsX, -boundsZ], [boundsX, -boundsZ], 8)}
      </group>

      {/* Trees outside bounds to make it feel like a farm edge */}
      {trees.map((tree) => (
        <group key={tree.id} position={tree.position}>
          {/* Trunk */}
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
            <meshStandardMaterial color="#4A3B2C" />
          </mesh>
          {/* Leaves */}
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color="#228b22" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial color="#2e8b57" roughness={0.8} />
          </mesh>
        </group>
      ))}
      
      {/* Visual props (water tub) */}
      <group position={[boundsX - 2, 0.25, boundsZ - 4]}>
         <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.8, 0.7, 0.5, 12]} />
            <meshStandardMaterial color="#708090" metalness={0.2} roughness={0.6}/>
         </mesh>
         <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.05, 12]} />
            <meshStandardMaterial color="#4169e1" roughness={0.1} />
         </mesh>
      </group>

      {/* Hay Bales */}
      {hayBales.map(bale => (
         <group key={bale.id} position={bale.position} rotation={bale.rotation}>
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.6, 0.6, 1.2, 8]} />
                <meshStandardMaterial color="#e8c351" roughness={1.0} />
            </mesh>
         </group>
      ))}

      <Rain />
    </group>
  );
}
