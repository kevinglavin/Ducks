import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameRefs } from '../../game/GameContext';
import { WORLD_WIDTH, WORLD_HEIGHT, CHARACTERS } from '../../game/config';
import { useGameStore } from '../../store/gameStore';

export default function Dog() {
  const groupRef = useRef<Group>(null);
  const { dogPos, pointerPos } = useGameRefs();
  const { status, pause, character } = useGameStore();
  const stats = CHARACTERS[character] || CHARACTERS['pyrenees'];
  const DOG_SPEED = stats.speed;

  const keys = useRef({ w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.up = true;
      if (key === 'a' || key === 'arrowleft') keys.current.left = true;
      if (key === 's' || key === 'arrowdown') keys.current.down = true;
      if (key === 'd' || key === 'arrowright') keys.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.up = false;
      if (key === 'a' || key === 'arrowleft') keys.current.left = false;
      if (key === 's' || key === 'arrowdown') keys.current.down = false;
      if (key === 'd' || key === 'arrowright') keys.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (status !== 'playing' || pause) return;

    const dt = Math.min(delta, 0.1);
    const k = keys.current;
    
    let isKeyboard = false;
    const moveVel = new Vector3();

    if (k.up) { moveVel.z -= 1; isKeyboard = true; }
    if (k.down) { moveVel.z += 1; isKeyboard = true; }
    if (k.left) { moveVel.x -= 1; isKeyboard = true; }
    if (k.right) { moveVel.x += 1; isKeyboard = true; }

    if (isKeyboard) {
      if (moveVel.lengthSq() > 0) moveVel.normalize();
      dogPos.current.add(moveVel.multiplyScalar(DOG_SPEED * dt));
      // Reset pointer pos so touch doesn't fight keyboard when switching
      pointerPos.current.copy(dogPos.current); 
    } else {
      // Move towards pointer if far enough
      const dist = dogPos.current.distanceTo(pointerPos.current);
      if (dist > 0.5) {
        const dir = new Vector3().subVectors(pointerPos.current, dogPos.current).normalize();
        
        // easing factor based on distance
        const speed = Math.min(DOG_SPEED, dist * 5.0);
        dogPos.current.add(dir.multiplyScalar(speed * dt));
      }
    }

    // Clanp to bounds
    const limitX = WORLD_WIDTH / 2 - 1;
    const limitZ = WORLD_HEIGHT / 2 - 1;
    dogPos.current.x = Math.max(-limitX, Math.min(limitX, dogPos.current.x));
    dogPos.current.z = Math.max(-limitZ, Math.min(limitZ, dogPos.current.z));

    if (groupRef.current) {
      // Lerp visual position for smoothness
      groupRef.current.position.lerp(dogPos.current, 0.3);
      
      // Look at direction
      const currentPos = groupRef.current.position.clone();
      const lookAtTarget = currentPos.clone().add(
        dogPos.current.clone().sub(currentPos)
      );
      if (lookAtTarget.distanceToSquared(currentPos) > 0.001) {
         groupRef.current.lookAt(lookAtTarget);
      }
    }
  });

  return (
    <group ref={groupRef} position={dogPos.current}>
      <group rotation={[0, Math.PI, 0]}>
        {character === 'pyrenees' && (
          <group position={[0, 0.5, 0]}>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.8, 1.0, 1.6]} />
              <meshStandardMaterial color="#f8f9fa" roughness={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.6, -0.6]} castShadow receiveShadow>
              <boxGeometry args={[0.6, 0.6, 0.6]} />
              <meshStandardMaterial color="#f8f9fa" roughness={0.9} />
            </mesh>
            {/* Snout */}
            <mesh position={[0, 0.4, -0.9]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.3, 0.4]} />
              <meshStandardMaterial color="#eeeeee" roughness={0.8} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.5, -1.1]}>
              <boxGeometry args={[0.15, 0.15, 0.1]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            {/* Ears */}
            <mesh position={[-0.35, 0.7, -0.5]}>
              <boxGeometry args={[0.2, 0.4, 0.3]} />
              <meshStandardMaterial color="#f8f9fa" />
            </mesh>
            <mesh position={[0.35, 0.7, -0.5]}>
              <boxGeometry args={[0.2, 0.4, 0.3]} />
              <meshStandardMaterial color="#f8f9fa" />
            </mesh>
            {/* Tail */}
            <mesh position={[0, 0.2, 0.8]} rotation={[-0.4, 0, 0]}>
              <boxGeometry args={[0.3, 0.3, 0.8]} />
              <meshStandardMaterial color="#f8f9fa" />
            </mesh>
          </group>
        )}

        {character === 'corgi' && (
          <group position={[0, 0.3, 0]}>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.6, 0.6, 1.4]} />
              <meshStandardMaterial color="#d4a373" roughness={0.9} />
            </mesh>
            {/* White Belly */}
            <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.15, 1.2]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.5, -0.6]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#d4a373" roughness={0.9} />
            </mesh>
            {/* Snout */}
            <mesh position={[0, 0.3, -0.8]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 0.2, 0.3]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.35, -0.95]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            {/* Ears */}
            <mesh position={[-0.2, 0.7, -0.5]} rotation={[0.2, 0, -0.2]}>
              <boxGeometry args={[0.2, 0.4, 0.1]} />
              <meshStandardMaterial color="#d4a373" />
            </mesh>
            <mesh position={[0.2, 0.7, -0.5]} rotation={[0.2, 0, 0.2]}>
              <boxGeometry args={[0.2, 0.4, 0.1]} />
              <meshStandardMaterial color="#d4a373" />
            </mesh>
            {/* Lil nub tail */}
            <mesh position={[0, 0.2, 0.7]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial color="#d4a373" />
            </mesh>
          </group>
        )}

        {character === 'farmer' && (
          <group position={[0, 0.9, 0]}>
            {/* Legs */}
            <mesh position={[-0.2, -0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 1.0, 0.3]} />
              <meshStandardMaterial color="#3b5998" /> {/* Jeans */}
            </mesh>
            <mesh position={[0.2, -0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 1.0, 0.3]} />
              <meshStandardMaterial color="#3b5998" />
            </mesh>
            {/* Torso */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.8, 1.0, 0.5]} />
              <meshStandardMaterial color="#cc0000" /> {/* Plaid shirt base */}
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#f1c27d" /> {/* Skin */}
            </mesh>
            {/* Hat Brim */}
            <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
              <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            {/* Hat Top */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
              <meshStandardMaterial color="#8b5a2b" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
