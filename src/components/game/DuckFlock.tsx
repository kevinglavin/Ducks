import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D } from 'three';
import { useGameRefs, DuckData } from '../../game/GameContext';
import { useGameStore } from '../../store/gameStore';
import { 
  WORLD_WIDTH, WORLD_HEIGHT, COOP_POSITION, DUCK_SPAWN_Z_MIN, DUCK_SPAWN_Z_MAX,
  DUCK_CONFIG, TOTAL_DUCKS, DUCK_TYPES, DUCK_STATS, CHARACTERS
} from '../../game/config';

// Reusable vectors for performance
const currentVel = new Vector3();
const sepForce = new Vector3();
const cohForce = new Vector3();
const alignVel = new Vector3();
const dogForce = new Vector3();
const coopForce = new Vector3();
const tv = new Vector3();

export default function DuckFlock() {
  const { ducksRef, dogPos } = useGameRefs();
  const { status, pause, markDuckSafe, totalDucks, character } = useGameStore();
  const dogStats = CHARACTERS[character];

  const groupRef = useRef<Group>(null);

  // Initialize duck data
  useEffect(() => {
    const initialDucks: DuckData[] = Array.from({ length: totalDucks }, (_, i) => ({
      id: `duck_${i}`,
      pos: new Vector3(
        (Math.random() - 0.5) * 8, 
        0, 
        DUCK_SPAWN_Z_MIN + Math.random() * (DUCK_SPAWN_Z_MAX - DUCK_SPAWN_Z_MIN)
      ),
      vel: new Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize().multiplyScalar(0.5),
      meshRef: React.createRef<Object3D>(),
      isSafe: false,
      type: DUCK_TYPES[i] || 'white'
    }));
    ducksRef.current = initialDucks;
  }, [totalDucks, ducksRef]);

  useFrame((state, delta) => {
    if (status !== 'playing' || pause) return;
    const dt = Math.min(delta, 0.1);
    const ducks = ducksRef.current;
    
    // 1. Calculate active flock center for coop pull
    const flockCenter = new Vector3();
    let activeDucksCount = 0;
    
    for (let i = 0; i < ducks.length; i++) {
      if (!ducks[i].isSafe) {
        flockCenter.add(ducks[i].pos);
        activeDucksCount++;
      }
    }
    
    if (activeDucksCount > 0) flockCenter.divideScalar(activeDucksCount);

    const dirToCoop = tv.subVectors(COOP_POSITION, flockCenter).normalize().clone();
    const dogToFlock = tv.subVectors(flockCenter, dogPos.current).normalize().clone();
    const dogBehindDot = dogToFlock.dot(dirToCoop);
    const isDogBehind = dogBehindDot > 0.4;

    // 2. Update each duck
    for (let i = 0; i < ducks.length; i++) {
        const duck = ducks[i];
        if (duck.isSafe) continue;
        
        const duckStats = DUCK_STATS[duck.type as keyof typeof DUCK_STATS] || DUCK_STATS.white;

        // Check if entered coop
        const distToCoopCenter = duck.pos.distanceTo(COOP_POSITION);
        if (distToCoopCenter < DUCK_CONFIG.COOP_ENTRANCE_RADIUS) {
            duck.isSafe = true;
            markDuckSafe(duckStats.score);
            // Move inside visual
            duck.pos.copy(COOP_POSITION).add(new Vector3((Math.random()-0.5)*2, 0, (Math.random()-0.5)*2 - 2));
            if (duck.meshRef.current) {
                duck.meshRef.current.position.copy(duck.pos);
            }
            continue;
        }

        let neighbors = 0;
        sepForce.set(0,0,0);
        cohForce.set(0,0,0);
        alignVel.set(0,0,0);

        for (let j = 0; j < ducks.length; j++) {
            if (i === j) continue;
            const other = ducks[j];
            if (other.isSafe) continue;
            
            const dist = duck.pos.distanceTo(other.pos);
            if (dist < DUCK_CONFIG.NEIGHBOR_RADIUS) {
                neighbors++;
                cohForce.add(other.pos);
                alignVel.add(other.vel);
                
                if (dist > 0.001) {
                  // Reduced separation force for brown ducks to make them more chaotic
                  const sep = tv.subVectors(duck.pos, other.pos).normalize().divideScalar(dist);
                  sepForce.add(sep);
                }
            }
        }

        let maxSpeed = DUCK_CONFIG.SPEED_CALM * duckStats.speedMult;
        dogForce.set(0,0,0);
        coopForce.set(0,0,0);

        const distToDog = duck.pos.distanceTo(dogPos.current);
        const actualPanicRadius = DUCK_CONFIG.PANIC_RADIUS * dogStats.panic * duckStats.scatterLevel;
        const actualPressureRadius = DUCK_CONFIG.PRESSURE_RADIUS * (dogStats.pressure / 5.0);
        
        if (distToDog < actualPanicRadius) {
            maxSpeed = DUCK_CONFIG.SPEED_PANIC * duckStats.speedMult * 1.2; // Extra speed boost
            dogForce.subVectors(duck.pos, dogPos.current).normalize().multiplyScalar(5.0 * duckStats.scatterLevel);
            // Add severe scatter noise for difficult ducks
            dogForce.add(new Vector3((Math.random()-0.5)*6*duckStats.scatterLevel, 0, (Math.random()-0.5)*6*duckStats.scatterLevel));
        } else if (distToDog < actualPressureRadius) {
            maxSpeed = DUCK_CONFIG.SPEED_PRESSURE * duckStats.speedMult;
            dogForce.subVectors(duck.pos, dogPos.current).normalize().multiplyScalar(2.0);
            
            // Brown ducks are less attracted to the coop, they need more direct herding
            if (isDogBehind) {
                const coopAttraction = 1.5 / duckStats.scatterLevel;
                coopForce.copy(dirToCoop).multiplyScalar(coopAttraction);
            }
        }

        if (neighbors > 0) {
            cohForce.divideScalar(neighbors);
            // Reduced cohesion for brown ducks
            const cohesionStr = 0.5 / duckStats.scatterLevel;
            cohForce.sub(duck.pos).normalize().multiplyScalar(cohesionStr); 
            
            alignVel.divideScalar(neighbors).normalize().multiplyScalar(0.5);
        }

        currentVel.copy(duck.vel);
        currentVel.add(sepForce.multiplyScalar(1.5));
        currentVel.add(cohForce);
        currentVel.add(alignVel);
        currentVel.add(dogForce);
        currentVel.add(coopForce);

        currentVel.y = 0; // lock to 2D plane
        
        if (currentVel.lengthSq() > 0) {
            currentVel.normalize().multiplyScalar(maxSpeed);
        }
        
        // Momentum
        duck.vel.lerp(currentVel, dt * 3.0);
        duck.pos.add(duck.vel.clone().multiplyScalar(dt));

        // Clanp to bounds (avoid getting stuck on walls, bounce off softly)
        const limitX = WORLD_WIDTH / 2 - 1.5;
        const limitZ = WORLD_HEIGHT / 2 - 1.5;
        
        if (duck.pos.x < -limitX) { duck.pos.x = -limitX; duck.vel.x *= -0.5; }
        if (duck.pos.x > limitX) { duck.pos.x = limitX; duck.vel.x *= -0.5; }
        // Keep away from very bottom
        if (duck.pos.z > limitZ) { duck.pos.z = limitZ; duck.vel.z *= -0.5; }
        // Top boundary (beyond coop if they miss)
        if (duck.pos.z < -limitZ) { duck.pos.z = -limitZ; duck.vel.z *= -0.5; }

        if (duck.meshRef.current) {
            duck.meshRef.current.position.copy(duck.pos);
            if (duck.vel.lengthSq() > 0.01) {
                const targetLookAt = duck.pos.clone().add(duck.vel);
                duck.meshRef.current.lookAt(targetLookAt);
            }
        }
    }
  });

  const getDuckColor = (type: string) => {
    if (type === 'brown') return '#8B4513';
    if (type === 'black') return '#222222';
    return '#ffffff';
  };
  const getBeakColor = (type: string) => {
    if (type === 'black') return '#aaaaaa';
    return '#FFaa00';
  }

  return (
    <group ref={groupRef}>
      {ducksRef.current.map((duck) => (
        <group key={duck.id} ref={duck.meshRef} position={duck.pos}>
          {/* Duck model offset slightly so feet are at pos.y=0 and rotated 180 degrees */}
          <group position={[0, 0.2, 0]} rotation={[0, Math.PI, 0]}>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.3, 0.6]} />
              <meshStandardMaterial color={getDuckColor(duck.type)} roughness={0.7} />
            </mesh>
            
            {/* Head */}
            <mesh position={[0, 0.3, -0.3]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color={getDuckColor(duck.type)} roughness={0.7} />
            </mesh>

            {/* Beak */}
            <mesh position={[0, 0.25, -0.5]} castShadow>
              <boxGeometry args={[0.2, 0.1, 0.2]} />
              <meshStandardMaterial color={getBeakColor(duck.type)} roughness={0.5} />
            </mesh>
            
            {/* Eyes */}
            <mesh position={[-0.16, 0.35, -0.35]}>
              <boxGeometry args={[0.05, 0.05, 0.05]} />
              <meshBasicMaterial color="#000" />
            </mesh>
            <mesh position={[0.16, 0.35, -0.35]}>
              <boxGeometry args={[0.05, 0.05, 0.05]} />
              <meshBasicMaterial color="#000" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
