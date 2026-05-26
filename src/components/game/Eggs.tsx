import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameRefs } from '../../game/GameContext';
import { useGameStore } from '../../store/gameStore';
import { Group } from 'three';

export default function Eggs() {
    const { dogPos } = useGameRefs();
    const { status, pause, addTime, addLog, eggs, removeEgg } = useGameStore();
    const groupRef = useRef<Group>(null);

    useFrame((state, delta) => {
        if (status !== 'playing' || pause) return;

        eggs.forEach(egg => {
            if (dogPos.current.distanceTo(egg.pos) < 1.5) {
                // Collect egg
                removeEgg(egg.id);
                addTime(10); // add 10 seconds
                addLog("COLLECTED GOLDEN EGG! +10 SECONDS");
                // Maybe play a custom sound here
            }
        });
    });

    return (
        <group ref={groupRef}>
            {eggs.map(egg => (
                <group key={egg.id} position={[egg.pos.x, 0.3, egg.pos.z]}>
                    <mesh castShadow>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} emissive="#ffaa00" emissiveIntensity={0.2} />
                    </mesh>
                    <pointLight color="#ffd700" intensity={2} distance={3} />
                </group>
            ))}
        </group>
    );
}
