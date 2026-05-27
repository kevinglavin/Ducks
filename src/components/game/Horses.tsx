import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameStore, gameEvents } from '../../store/gameStore';

const HORSE_POSITIONS = [
  new Vector3(14, 0, -5), // Right side, mid-upper
  new Vector3(15, 0, 5),  // Right side, lower
  new Vector3(-13, 0, 8), // Left side
];

export default function Horses() {
  const { status, pause } = useGameStore();

  return (
    <group>
      {HORSE_POSITIONS.map((pos, i) => (
         <Horse key={i} initPos={pos} delay={i * 1.5} />
      ))}
    </group>
  );
}

function Horse({ initPos, delay }: { initPos: Vector3, delay: number }) {
    const groupRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    
    // Logic states
    const [action, setAction] = useState<'graze' | 'cheer' | 'laugh'>('graze');
    const [actionTimer, setActionTimer] = useState(0);
    const isRef = useRef({ action: 'graze', actionTimer: 0 });

    useFrame((state, delta) => {
        const { status, pause } = useGameStore.getState();
        if (status !== 'playing' || pause) return;

        // Consume events
        while (gameEvents.horseEvents.length > 0) {
            const ev = gameEvents.horseEvents.shift() as 'cheer' | 'laugh';
            isRef.current.action = ev;
            isRef.current.actionTimer = 2.0; // perform action for 2 seconds
            setAction(ev);
            setActionTimer(2.0);
        }

        if (isRef.current.actionTimer > 0) {
            isRef.current.actionTimer -= delta;
            if (isRef.current.actionTimer <= 0) {
                isRef.current.action = 'graze';
                setAction('graze');
            }
        }

        const t = state.clock.elapsedTime + delay;

        if (groupRef.current) {
             groupRef.current.lookAt(new Vector3(0, 0, initPos.z)); // Look towards center

             if (isRef.current.action === 'cheer') {
                 // Jump up and down
                 groupRef.current.position.y = Math.abs(Math.sin(t * 10)) * 0.5;
                 if (headRef.current) headRef.current.rotation.x = Math.sin(t * 15) * 0.2;
             } else if (isRef.current.action === 'laugh') {
                 groupRef.current.position.y = 0;
                 // Head bobs back and forth
                 if (headRef.current) headRef.current.rotation.x = Math.sin(t * 12) * 0.4;
             } else {
                 groupRef.current.position.y = 0;
                 // Slow grazing
                 if (headRef.current) {
                     headRef.current.rotation.x = -0.5 + Math.sin(t * 2) * 0.2; // Head down towards grass
                 }
             }
        }
    });

    return (
        <group ref={groupRef} position={initPos}>
            {/* Action Popup */}
            {action !== 'graze' && (
                <Html position={[0, 2, 0]} center wrapperClass="pointer-events-none z-40">
                    <div className="text-white font-black text-xs drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {action === 'cheer' ? 'YEEHAW!' : 'Haha!'}
                    </div>
                </Html>
            )}

            {/* Body */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.6, 1.2]} />
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>

            {/* Legs */}
            <mesh position={[-0.2, 0.15, -0.4]} castShadow>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color="#5C2E0B" />
            </mesh>
            <mesh position={[0.2, 0.15, -0.4]} castShadow>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color="#5C2E0B" />
            </mesh>
            <mesh position={[-0.2, 0.15, 0.4]} castShadow>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color="#5C2E0B" />
            </mesh>
            <mesh position={[0.2, 0.15, 0.4]} castShadow>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color="#5C2E0B" />
            </mesh>

            {/* Neck / Head group (pivot at chest) */}
            <group ref={headRef} position={[0, 0.8, -0.5]}>
                {/* Neck */}
                <mesh position={[0, 0.3, -0.2]} rotation={[0.5, 0, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.6, 0.3]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
                {/* Head */}
                <mesh position={[0, 0.6, -0.4]} castShadow>
                    <boxGeometry args={[0.3, 0.3, 0.5]} />
                    <meshStandardMaterial color="#5C2E0B" />
                </mesh>
                {/* Ears */}
                <mesh position={[0.1, 0.8, -0.3]}>
                    <boxGeometry args={[0.05, 0.15, 0.05]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
                <mesh position={[-0.1, 0.8, -0.3]}>
                    <boxGeometry args={[0.05, 0.15, 0.05]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
            </group>

            {/* Tail */}
            <mesh position={[0, 0.7, 0.6]} rotation={[-0.2, 0, 0]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="#3E1F07" />
            </mesh>
        </group>
    );
}
