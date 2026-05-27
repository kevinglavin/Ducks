import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';
import { useGameRefs } from '../../game/GameContext';
import { useGameStore, triggerExplosion } from '../../store/gameStore';
import { WORLD_WIDTH, WORLD_HEIGHT, DUCK_CONFIG } from '../../game/config';

export default function Fox() {
  const { dogPos, ducksRef } = useGameRefs();
  const { gameId, status, pause } = useGameStore();

  const groupRef = useRef<Group>(null);
  
  const [active, setActive] = useState(false);
  const timer = useRef(0);
  const foxPos = useRef(new Vector3(100, 0, 100)); // Hidden
  const targetDuckId = useRef<string | null>(null);

  const gameIdRef = useRef(gameId);
  if (gameIdRef.current !== gameId) {
     gameIdRef.current = gameId;
     setActive(false);
     timer.current = 0;
     targetDuckId.current = null;
     foxPos.current.set(100, 0, 100);
  }

  useFrame((state, delta) => {
    if (status !== 'playing' || pause) return;

    timer.current += delta;
    
    // Fox spawns randomly
    if (!active && timer.current > 40) {
       timer.current = 0;
       if (Math.random() > 0.5) {
          // Find vulnerable duck
          const vulnerable = ducksRef.current.filter(d => !d.isSafe);
          if (vulnerable.length > 0) {
             const target = vulnerable[Math.floor(Math.random() * vulnerable.length)];
             targetDuckId.current = target.id;
             setActive(true);
             // Spawn at edge
             const edgeX = Math.random() > 0.5 ? -WORLD_WIDTH/2 : WORLD_WIDTH/2;
             foxPos.current.set(edgeX, 0, target.pos.z);
             useGameStore.getState().addLog("FOX INVASION! Protect the ducks!");
          }
       }
    }

    if (active && groupRef.current) {
        // Scared off by dog bark/presence!
        if (foxPos.current.distanceTo(dogPos.current) < 3.0) {
            useGameStore.getState().addLog("Fox was scared off!");
            triggerExplosion(foxPos.current);
            setActive(false);
            foxPos.current.set(100, 0, 100);
            return;
        }

        // Move towards target duck
        const targetObj = ducksRef.current.find(d => d.id === targetDuckId.current && !d.isSafe);
        if (targetObj) {
            const dir = new Vector3().subVectors(targetObj.pos, foxPos.current).normalize();
            foxPos.current.add(dir.multiplyScalar(delta * 4.0)); // Fox is fast!
            
            groupRef.current.lookAt(foxPos.current.clone().add(dir));
            
            // Check capture
            if (foxPos.current.distanceTo(targetObj.pos) < 1.0) {
                targetObj.isSafe = true; // Stolen! (mark safe to despawn it, but loose points?)
                targetObj.pos.set(100, 0, 100);
                useGameStore.getState().addLog("A duck was stolen by the fox!");
                // we should deduct score or increase lost ducks, but safe=true removes it effectively.
                setActive(false);
                foxPos.current.set(100, 0, 100);
            }
        } else {
            // target lost
            setActive(false);
            foxPos.current.set(100, 0, 100);
        }

        groupRef.current.position.copy(foxPos.current);
        // run animation
        const t = state.clock.elapsedTime;
        groupRef.current.rotation.z = Math.sin(t * 30) * 0.1;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={foxPos.current}>
        <Html position={[0, 1.5, 0]} center wrapperClass="pointer-events-none z-40">
            <div className="text-red-500 font-black text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] px-2 py-1 bg-red-900/80 rounded border border-red-500">
                🦊 FOX!
            </div>
        </Html>
        <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.5, 0.4, 1.0]} />
            <meshStandardMaterial color="#c2410c" />
        </mesh>
        <mesh position={[0, 0.6, -0.5]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.4]} />
            <meshStandardMaterial color="#c2410c" />
        </mesh>
        <mesh position={[0, 0.5, 0.6]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.6]} />
            <meshStandardMaterial color="#fff" />
        </mesh>
    </group>
  );
}
