import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D, InstancedMesh } from 'three';
import { SpotLight } from '@react-three/drei';
import { useGameRefs } from '../../game/GameContext';
import { WORLD_WIDTH, WORLD_HEIGHT, CHARACTERS } from '../../game/config';
import { useGameStore } from '../../store/gameStore';

let audioCtx: AudioContext | null = null;
const playBark = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch(e) {
    console.error(e);
  }
};

export default function Dog() {
  const groupRef = useRef<Group>(null);
  const { dogPos, pointerPos } = useGameRefs();
  const { status, pause, character } = useGameStore();
  const stats = CHARACTERS[character] || CHARACTERS['pyrenees'];
  const DOG_SPEED = stats.speed;

  const keys = useRef({ w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false });

  const DUST_COUNT = 30;
  const dustRef = useRef<InstancedMesh>(null);
  const ringRef = useRef<import('three').Mesh>(null);
  const ringMaterialRef = useRef<import('three').MeshBasicMaterial>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const particles = useRef(Array.from({ length: DUST_COUNT }, () => ({
    pos: new Vector3(0, -10, 0),
    vel: new Vector3(),
    age: 99,
    maxAge: 0.3 + Math.random() * 0.2
  })));
  const dustIdx = useRef(0);
  const lastPos = useRef(new Vector3());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.up = true;
      if (key === 'a' || key === 'arrowleft') keys.current.left = true;
      if (key === 's' || key === 'arrowdown') keys.current.down = true;
      if (key === 'd' || key === 'arrowright') keys.current.right = true;
      if (key === ' ') {
        playBark();
      }
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

    const speedMultiplier = useGameStore.getState().powerupActive ? 2.0 : 1.0;
    const currentDogSpeed = DOG_SPEED * speedMultiplier;

    if (isKeyboard) {
      if (moveVel.lengthSq() > 0) moveVel.normalize();
      dogPos.current.add(moveVel.multiplyScalar(currentDogSpeed * dt));
      // Reset pointer pos so touch doesn't fight keyboard when switching
      pointerPos.current.copy(dogPos.current); 
    } else {
      // Move towards pointer if far enough
      const dist = dogPos.current.distanceTo(pointerPos.current);
      if (dist > 0.5) {
        const dir = new Vector3().subVectors(pointerPos.current, dogPos.current).normalize();
        
        // easing factor based on distance
        const speed = Math.min(currentDogSpeed, dist * 5.0 * speedMultiplier);
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

    const movedDist = dogPos.current.distanceTo(lastPos.current);
    const speed = movedDist / dt;

    if (speed > 1) {
      // Drain stamina
      const currentStamina = useGameStore.getState().dogStamina;
      const drainRate = useGameStore.getState().weather === 'rain' ? 40 : 25;
      if (currentStamina > 0) {
         useGameStore.getState().setDogStamina(Math.max(0, currentStamina - dt * drainRate));
      }
    } else {
      // Recover stamina
      const currentStamina = useGameStore.getState().dogStamina;
      if (currentStamina < 100) {
         useGameStore.getState().setDogStamina(Math.min(100, currentStamina + dt * 15)); // Recovers in ~6.5 secs
      }
    }

    const isTired = useGameStore.getState().dogStamina < 20;

    if (ringRef.current && ringMaterialRef.current) {
        if (isTired) {
           ringRef.current.visible = true;
           const pulse = (Math.sin(state.clock.elapsedTime * 10) + 1) / 2;
           ringRef.current.scale.setScalar(1 + pulse * 0.5);
           ringMaterialRef.current.opacity = 0.3 + pulse * 0.4;
        } else {
           ringRef.current.visible = false;
        }
    }

    if (speed > 3) {
      if (Math.random() < 0.5) { // Spawn rate limit
        const p = particles.current[dustIdx.current];
        p.pos.copy(dogPos.current);
        p.pos.y = 0.1;
        p.vel.set((Math.random()-0.5)*2, Math.random()*2, (Math.random()-0.5)*2);
        p.age = 0;
        dustIdx.current = (dustIdx.current + 1) % DUST_COUNT;
      }
    }
    lastPos.current.copy(dogPos.current);

    if (dustRef.current) {
      particles.current.forEach((p, i) => {
        p.age += dt;
        if (p.age < p.maxAge) {
          p.pos.add(p.vel.clone().multiplyScalar(dt));
          const scale = 1 - (p.age / p.maxAge);
          dummy.position.copy(p.pos);
          dummy.scale.setScalar(scale * 0.3);
          dummy.updateMatrix();
          dustRef.current!.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.position.set(0, -10, 0);
          dummy.updateMatrix();
          dustRef.current!.setMatrixAt(i, dummy.matrix);
        }
      });
      dustRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Dust Cloud */}
      <instancedMesh ref={dustRef} args={[undefined, undefined, DUST_COUNT]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#c2b280" opacity={0.6} transparent />
      </instancedMesh>

      <group ref={groupRef} position={dogPos.current}>
        {/* Danger Ring */}
        <mesh ref={ringRef} position={[0, -0.4, 0]} rotation={[-Math.PI/2, 0, 0]} visible={false}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial ref={ringMaterialRef} color="#ef4444" transparent opacity={0.5} depthWrite={false} />
        </mesh>

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

        {character === 'farmer-r' && (
          <group position={[0, 0, 0]}>
            {/* Tractor Body */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.8, 2.0]} />
              <meshStandardMaterial color="#228b22" roughness={0.7} />
            </mesh>
            {/* Engine block */}
            <mesh position={[0, 0.8, -1.2]} castShadow receiveShadow>
              <boxGeometry args={[1.0, 0.6, 1.0]} />
              <meshStandardMaterial color="#228b22" roughness={0.7} />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, 1.4, 0.5]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 1.0, 1.0]} />
              <meshStandardMaterial color="#228b22" roughness={0.7} />
              <meshStandardMaterial attach="material-0" color="#333" opacity={0.5} transparent />
              <meshStandardMaterial attach="material-1" color="#333" opacity={0.5} transparent />
              <meshStandardMaterial attach="material-4" color="#333" opacity={0.5} transparent />
              <meshStandardMaterial attach="material-5" color="#333" opacity={0.5} transparent />
            </mesh>
            {/* Rear Wheels */}
            <mesh position={[-0.8, 0.6, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
              <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            <mesh position={[0.8, 0.6, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
              <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Front Wheels */}
            <mesh position={[-0.6, 0.3, -1.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
              <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            <mesh position={[0.6, 0.3, -1.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
              <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Exhaust */}
            <mesh position={[0.4, 1.5, -1.0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
              <meshStandardMaterial color="#708090" roughness={0.4} />
            </mesh>
            
            {/* Farmer R inside */}
            <group position={[0, 1.0, 0.5]}>
              <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.8, 0.4]} />
                <meshStandardMaterial color="#cc0000" />
              </mesh>
              <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#f1c27d" />
              </mesh>
              <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
            </group>

            {/* Headlights */}
            <group position={[0, 0.8, -1.7]}>
              <mesh position={[-0.4, 0, 0]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color="#ffffaa" />
              </mesh>
              <mesh position={[0.4, 0, 0]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color="#ffffaa" />
              </mesh>
              {/* Actual Spotlights */}
              <SpotLight position={[-0.4, 0, 0]} target={[0, 0, -10]} angle={0.4} penumbra={0.7} intensity={3} distance={20} color="#ffeedd" />
              <SpotLight position={[0.4, 0, 0]} target={[0, 0, -10]} angle={0.4} penumbra={0.7} intensity={3} distance={20} color="#ffeedd" />
            </group>
          </group>
        )}

        {character === 'farmer-a' && (
          <group position={[0, 0, 0]}>
            {/* Donkey */}
            <group position={[0, 0, 0]}>
              {/* Legs */}
              <mesh position={[-0.2, 0.5, 0.6]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.0, 0.2]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh position={[0.2, 0.5, 0.6]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.0, 0.2]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh position={[-0.2, 0.5, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.0, 0.2]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh position={[0.2, 0.5, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.0, 0.2]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              {/* Body */}
              <mesh position={[0, 1.1, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.6, 1.6]} />
                <meshStandardMaterial color="#7a7a7a" />
              </mesh>
              {/* Neck & Head */}
              <mesh position={[0, 1.5, -0.8]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 0.6, 0.4]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh position={[0, 1.7, -1.0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.4, 0.6]} />
                <meshStandardMaterial color="#7a7a7a" />
              </mesh>
              {/* Donkey Ears */}
              <mesh position={[-0.15, 2.0, -0.7]} rotation={[-0.2, 0, 0.2]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.5, 0.2]} />
                <meshStandardMaterial color="#666666" />
              </mesh>
              <mesh position={[0.15, 2.0, -0.7]} rotation={[-0.2, 0, -0.2]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.5, 0.2]} />
                <meshStandardMaterial color="#666666" />
              </mesh>
            </group>
            
            {/* Farmer Rider */}
            <group position={[0, 1.4, 0.2]}>
              <mesh position={[-0.35, -0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.8, 0.2]} />
                <meshStandardMaterial color="#3b5998" /> {/* Jeans */}
              </mesh>
              <mesh position={[0.35, -0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 0.8, 0.2]} />
                <meshStandardMaterial color="#3b5998" />
              </mesh>
              <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.8, 0.4]} />
                <meshStandardMaterial color="#cc0000" /> {/* Plaid shirt */}
              </mesh>
              <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#f1c27d" /> {/* Skin */}
              </mesh>
              {/* Hat Brim */}
              <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
              {/* Hat Top */}
              <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
            </group>
          </group>
        )}

        {character === 'farmer-c' && (
          <group position={[0, 0, 0]}>
            {/* Horse */}
            <group position={[0, 0, 0]}>
              {/* Legs */}
              <mesh position={[-0.3, 0.6, 0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#5c3a21" />
              </mesh>
              <mesh position={[0.3, 0.6, 0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#5c3a21" />
              </mesh>
              <mesh position={[-0.3, 0.6, -0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#5c3a21" />
              </mesh>
              <mesh position={[0.3, 0.6, -0.7]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#5c3a21" />
              </mesh>
              
              {/* Body */}
              <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 2.0]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
              
              {/* Neck & Head */}
              <mesh position={[0, 2.0, -0.9]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.8, 0.6]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
              <mesh position={[0, 2.1, -1.3]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 0.4, 0.5]} />
                <meshStandardMaterial color="#5c3a21" />
              </mesh>
              {/* Tail */}
              <mesh position={[0, 1.4, 1.1]} castShadow receiveShadow rotation={[0.5, 0, 0]}>
                <boxGeometry args={[0.2, 0.8, 0.2]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
            </group>
            
            {/* Farmer on top */}
            <group position={[0, 2.3, 0.2]}>
              {/* Torso */}
              <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 1.0, 0.5]} />
                <meshStandardMaterial color="#cc0000" />
              </mesh>
              {/* Head */}
              <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#f1c27d" />
              </mesh>
              {/* Hat Brim */}
              <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
              {/* Hat Top */}
              <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
                <meshStandardMaterial color="#8b5a2b" />
              </mesh>
              {/* Legs straddling */}
              <mesh position={[-0.45, -0.3, 0]} castShadow receiveShadow rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.2, 0.8, 0.3]} />
                <meshStandardMaterial color="#3b5998" />
              </mesh>
              <mesh position={[0.45, -0.3, 0]} castShadow receiveShadow rotation={[0, 0, -0.3]}>
                <boxGeometry args={[0.2, 0.8, 0.3]} />
                <meshStandardMaterial color="#3b5998" />
              </mesh>
            </group>
          </group>
        )}
      </group>
    </group>
    </>
  );
}
