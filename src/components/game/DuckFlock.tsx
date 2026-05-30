import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D } from 'three';
import { Html } from '@react-three/drei';
import { useGameRefs, DuckData } from '../../game/GameContext';
import { useGameStore, triggerExplosion, triggerCheerEvent } from '../../store/gameStore';
import { 
  WORLD_WIDTH, WORLD_HEIGHT, COOP_POSITION, DUCK_SPAWN_Z_MIN, DUCK_SPAWN_Z_MAX,
  DUCK_CONFIG, TOTAL_DUCKS, DUCK_TYPES, DUCK_STATS, CHARACTERS
} from '../../game/config';

// Web Audio API context for sound effects
let audioCtx: AudioContext | null = null;
const playQuack = () => {
  if (!useGameStore.getState().sfxEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.error(e);
  }
};

// Reusable vectors for performance
const currentVel = new Vector3();
const sepForce = new Vector3();
const cohForce = new Vector3();
const alignVel = new Vector3();
const dogForce = new Vector3();
const coopForce = new Vector3();
const tv = new Vector3();

const ComboText = () => {
    const multiplier = useGameStore(s => s.multiplier);
    const timeRemaining = useGameStore(s => s.timeRemaining);
    const lastDuckSafeTime = useGameStore(s => s.lastDuckSafeTime);
    const { ducksRef } = useGameRefs();
    const groupRef = useRef<Group>(null);
    const isActive = multiplier > 1 && (lastDuckSafeTime - timeRemaining) < 3.0;

    useFrame((state) => {
        if (!groupRef.current || !isActive) return;
        const pulse = (Math.sin(state.clock.elapsedTime * 8) + 1) / 2;
        groupRef.current.scale.setScalar(1 + pulse * 0.2);
    });

    if (!isActive) return null;

    // Position above flock center
    const flockCenter = new Vector3();
    let count = 0;
    ducksRef.current.forEach((d: DuckData) => {
        if (!d.isSafe) {
           flockCenter.add(d.pos);
           count++;
        }
    });
    if (count > 0) flockCenter.divideScalar(count);

    return (
        <group ref={groupRef} position={[flockCenter.x, 3, flockCenter.z]}>
            <Html center wrapperClass="pointer-events-none z-50">
               <div className="text-orange-400 font-black text-3xl drop-shadow-[0_0_15px_rgba(234,88,12,0.8)] whitespace-nowrap animate-in fade-in zoom-in duration-300">
                  COMBO x{multiplier}!
               </div>
            </Html>
        </group>
    );
  };

export default function DuckFlock() {
  const { ducksRef, dogPos } = useGameRefs();
  const { status, pause, markDuckSafe, totalDucks, character, farmerAPlays } = useGameStore();

  const dogStats = CHARACTERS[character];

  const groupRef = useRef<Group>(null);
  
  const [popups, setPopups] = useState<{id: string, pos: Vector3, score: number}[]>([]);

  const addPopup = (pos: Vector3, score: number) => {
      const id = Date.now().toString() + Math.random().toString();
      setPopups(prev => [...prev, { id, pos: pos.clone(), score }]);
      setTimeout(() => {
          setPopups(prev => prev.filter(p => p.id !== id));
      }, 1500);
  };

  // Initialize duck data
  useEffect(() => {
    const isGoldenGame = character === 'farmer-a' && farmerAPlays % 2 === 0 && farmerAPlays > 0;
    
    const initialDucks: DuckData[] = Array.from({ length: totalDucks }, (_, i) => {
      let duckType = DUCK_TYPES[i] || 'white';
      if (isGoldenGame && i === 0) duckType = 'golden-goose';
      
      const isNamed = DUCK_STATS[duckType]?.name !== undefined;
      const personalities: ('skittish' | 'stubborn' | 'curious' | 'normal')[] = ['skittish', 'stubborn', 'curious', 'normal'];
      const personality = isNamed ? 'normal' : personalities[Math.floor(Math.random() * personalities.length)];

      return {
        id: `duck_${i}`,
        pos: new Vector3(
          (Math.random() - 0.5) * 8, 
          0, 
          DUCK_SPAWN_Z_MIN + Math.random() * (DUCK_SPAWN_Z_MAX - DUCK_SPAWN_Z_MIN)
        ),
        vel: new Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize().multiplyScalar(0.5),
        meshRef: React.createRef<Object3D>(),
        isSafe: false,
        type: duckType,
        fatigue: 0,
        personality
      };
    });
    ducksRef.current = initialDucks;
  }, [totalDucks, ducksRef, farmerAPlays, character]);

  useFrame((state, delta) => {
    const { status, pause } = useGameStore.getState();
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
        
        const currentMultiplier = useGameStore.getState().multiplier;
        
        const duckStats = DUCK_STATS[duck.type as keyof typeof DUCK_STATS] || DUCK_STATS.white;

        // Check if entered coop
        const distToCoopCenter = duck.pos.distanceTo(COOP_POSITION);
        if (distToCoopCenter < DUCK_CONFIG.COOP_ENTRANCE_RADIUS) {
            duck.isSafe = true;
            let scoreToAdd = duckStats.score;
            
            useGameStore.getState().addLog(`${duckStats.name ? duckStats.name.toUpperCase() : duck.type.toUpperCase()} SECURED!`);
            
            // Check if it's the last pekin to be secured
            if (duck.type.startsWith('pekin-')) {
               const remainingPekins = ducks.filter(d => !d.isSafe && d.type.startsWith('pekin-')).length;
               if (remainingPekins === 0) {
                   scoreToAdd += 2000; // ALL PEKINS secured bonus
                   useGameStore.getState().addLog("ALL PEKIN DUCKS SECURED! +2000");
                   triggerExplosion(COOP_POSITION);
               }
            }

            markDuckSafe(scoreToAdd);
            triggerExplosion(duck.pos);
            triggerCheerEvent();
            addPopup(duck.pos, scoreToAdd * currentMultiplier);
            
            playQuack();
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

        const dogStamina = useGameStore.getState().dogStamina;
        const inventory = useGameStore.getState().inventory;
        const isDogTired = dogStamina < 20;

        const barkRadiusMultiplier = 1.0 + ((inventory?.barkRadiusLevel || 1) - 1) * 0.15; // +15% per upgrade level

        const distToDog = duck.pos.distanceTo(dogPos.current);
        let actualPanicRadius = DUCK_CONFIG.PANIC_RADIUS * dogStats.panic * duckStats.scatterLevel * (isDogTired ? 1.5 : 1.0) * barkRadiusMultiplier;
        let actualPressureRadius = DUCK_CONFIG.PRESSURE_RADIUS * (dogStats.pressure / 5.0) * (isDogTired ? 0.3 : 1.0) * barkRadiusMultiplier;

        if (duck.personality === 'skittish') {
            actualPanicRadius *= 1.4;
            actualPressureRadius *= 1.2;
        } else if (duck.personality === 'stubborn') {
            actualPanicRadius *= 0.7;
            actualPressureRadius *= 0.8;
        }
        
        if (duck.type === 'pekin-moby') {
            actualPressureRadius *= 0.5; // Requires dog to be very close
            actualPanicRadius *= 0.5;
        }

        // Fatigue mechanic
        if (distToDog < actualPressureRadius) {
            duck.fatigue = Math.min(1.0, duck.fatigue + dt * 0.15); // Max fatigue in ~6.6 seconds
        } else {
            duck.fatigue = Math.max(0.0, duck.fatigue - dt * 0.1); // Recover in 10 seconds
        }
        
        // Apply fatigue to speed
        const fatigueMultiplier = 1.0 - (duck.fatigue * 0.5);
        const speedMultiplier = fatigueMultiplier;

        if (distToDog < actualPanicRadius) {
            maxSpeed = DUCK_CONFIG.SPEED_PANIC * duckStats.speedMult * 1.2 * speedMultiplier; // Extra speed boost
            dogForce.subVectors(duck.pos, dogPos.current).normalize().multiplyScalar(5.0 * duckStats.scatterLevel);
            // Add severe scatter noise for difficult ducks
            dogForce.add(new Vector3((Math.random()-0.5)*6*duckStats.scatterLevel, 0, (Math.random()-0.5)*6*duckStats.scatterLevel));
            
            if (duck.type === 'pekin-dave' && Math.random() < 0.05) {
                // Dave teleports short distances when panicked
                duck.pos.add(new Vector3((Math.random()-0.5)*4, 0, (Math.random()-0.5)*4));
                triggerExplosion(duck.pos);
                playQuack();
            }
        } else if (distToDog < actualPressureRadius) {
            maxSpeed = DUCK_CONFIG.SPEED_PRESSURE * duckStats.speedMult * speedMultiplier;
            dogForce.subVectors(duck.pos, dogPos.current).normalize().multiplyScalar(2.0);
            
            // Brown ducks and Moby are less attracted to the coop, they need more direct herding
            if (isDogBehind) {
                const coopAttraction = duck.type === 'pekin-moby' ? 0.2 : 1.5 / duckStats.scatterLevel;
                coopForce.copy(dirToCoop).multiplyScalar(coopAttraction);
            }
        } else {
        // Wandering state when not under pressure
            if (duck.personality === 'curious' && distToDog < actualPressureRadius * 2.5 && Math.random() < 0.1) {
                // Moves slightly towards dog
                dogForce.subVectors(dogPos.current, duck.pos).normalize().multiplyScalar(0.5);
                maxSpeed = DUCK_CONFIG.SPEED_CALM * duckStats.speedMult * speedMultiplier;
            } else {
                dogForce.add(new Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5));
                maxSpeed = DUCK_CONFIG.SPEED_CALM * duckStats.speedMult * 0.5 * speedMultiplier;
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
        
        let finalMaxSpeed = maxSpeed;

        if (currentVel.lengthSq() > 0) {
            currentVel.normalize().multiplyScalar(finalMaxSpeed);
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

        const isPanicked = distToDog < actualPanicRadius;

        if (duck.meshRef.current) {
            duck.meshRef.current.position.copy(duck.pos);
            
            // Shiver effect when panicked
            if (isPanicked) {
                duck.meshRef.current.position.x += (Math.random() - 0.5) * 0.15;
                duck.meshRef.current.position.z += (Math.random() - 0.5) * 0.15;
            }

            const speedSq = duck.vel.lengthSq();
            if (speedSq > 0.01) {
                const targetLookAt = duck.pos.clone().add(duck.vel);
                duck.meshRef.current.lookAt(targetLookAt);
                
                // Wing flap animation
                const rootGroup = duck.meshRef.current.children[0];
                if (rootGroup) {
                   const wingL = rootGroup.children.find(c => c.name === 'wingLeft');
                   const wingR = rootGroup.children.find(c => c.name === 'wingRight');
                   if (wingL && wingR) {
                       const flapSpeed = Math.sqrt(speedSq) * 15;
                       const flapAngle = Math.sin(state.clock.elapsedTime * flapSpeed) * 0.5;
                       wingL.rotation.z = flapAngle;
                       wingR.rotation.z = -flapAngle;
                   }
                }
            } else {
                // Reset wings
                const rootGroup = duck.meshRef.current.children[0];
                if (rootGroup) {
                   const wingL = rootGroup.children.find(c => c.name === 'wingLeft');
                   const wingR = rootGroup.children.find(c => c.name === 'wingRight');
                   if (wingL && wingR) {
                       wingL.rotation.z = 0;
                       wingR.rotation.z = 0;
                   }
                }
            }
        }
    }
    
    // Update minimap data
    (window as any).__duckGamePositions = {
        dogPos: dogPos.current,
        ducks: ducks.map(d => ({ pos: d.pos, type: d.type, isSafe: d.isSafe })),
        coopPos: COOP_POSITION,
        farmBounds: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
    };
  });

  const getDuckColor = (type: string) => {
    if (type === 'golden-goose') return '#ffd700';
    if (type === 'brown') return '#8B4513';
    if (type === 'black') return '#222222';
    if (type === 'ninja') return '#111111';
    return '#ffffff';
  };
  const getBeakColor = (type: string) => {
    if (type === 'black' || type === 'ninja') return '#aaaaaa';
    return '#FFaa00';
  }

  return (
    <group ref={groupRef}>
      <ComboText />
      {ducksRef.current.map((duck) => (
        <group key={duck.id} ref={duck.meshRef} position={duck.pos}>
          <group position={[0, 0.2, 0]} rotation={[0, Math.PI, 0]}>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.3, 0.6]} />
              <meshStandardMaterial color={getDuckColor(duck.type)} roughness={0.7} />
            </mesh>
            
            {/* Left Wing */}
            <mesh name="wingLeft" position={[-0.25, 0.05, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.4]} />
              <meshStandardMaterial color={getDuckColor(duck.type)} roughness={0.7} />
            </mesh>
            
            {/* Right Wing */}
            <mesh name="wingRight" position={[0.25, 0.05, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.4]} />
              <meshStandardMaterial color={getDuckColor(duck.type)} roughness={0.7} />
            </mesh>
            
            {/* Head */}
            <mesh position={[0, 0.3, -0.3]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color={getDuckColor(duck.type)} roughness={0.7} />
            </mesh>

            {/* Ninja Headband */}
            {duck.type === 'ninja' && (
              <mesh position={[0, 0.38, -0.3]} castShadow>
                <boxGeometry args={[0.32, 0.08, 0.32]} />
                <meshStandardMaterial color="#ee0000" />
              </mesh>
            )}

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
          {!duck.isSafe && DUCK_STATS[duck.type]?.name && status === 'playing' && !pause && (
              <Html position={[0, 1.2, 0]} center wrapperClass="pointer-events-none z-40">
                  <div className="text-white font-black text-[10px] uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-90">
                      *{DUCK_STATS[duck.type].name}*
                  </div>
              </Html>
          )}
        </group>
      ))}

      {popups.map(p => (
        <group key={p.id} position={[p.pos.x, p.pos.y + 2, p.pos.z]}>
           <Html center wrapperClass="pointer-events-none z-50">
              <div className="text-yellow-400 font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom duration-500 flex flex-col items-center whitespace-nowrap">
                 +{p.score}pts
              </div>
           </Html>
        </group>
      ))}
    </group>
  );
}
