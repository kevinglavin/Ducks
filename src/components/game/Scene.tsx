import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Vector3, Raycaster, Plane, Vector2, Color, Object3D, InstancedMesh } from 'three';
import { GameProvider, useGameRefs } from '../../game/GameContext';
import Dog from './Dog';
import DuckFlock from './DuckFlock';
import Coop from './Coop';
import Environment from './Environment';
import PowerupSpawner from './Powerup';
import Eggs from './Eggs';
import Marshall from './Marshall';
import Turtle from './Turtle';
import GoldenGoose from './GoldenGoose';
import Fox from './Fox';
import Horses from './Horses';
import DecoyDuck from './DecoyDuck';
import { useGameStore, gameEvents } from '../../store/gameStore';
import { TIME_LIMIT, WORLD_WIDTH, WORLD_HEIGHT } from '../../game/config';

// Component to handle touch pointer events on the ground plane
const GroundInput = () => {
  const { pointerPos } = useGameRefs();
  const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
  const raycaster = new Raycaster();
  const { camera, pointer } = useThree();

  const handlePointer = (e: any) => {
    // Only update if playing
    const status = useGameStore.getState().status;
    if (status !== 'playing') return;
    
    // Instead of trusting e.point directly, let's reliably raycast from the current pointer
    // using the camera to the ground plane to avoid missing hits.
    raycaster.setFromCamera(pointer, camera);
    const target = new Vector3();
    raycaster.ray.intersectPlane(groundPlane, target);
    if (target) {
      pointerPos.current.copy(target);
    }
  };

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.05, 0]} 
      visible={false} 
      onPointerDown={handlePointer}
      onPointerMove={(e) => {
        // Only update on drag if pointer is down theoretically, but since it's mobile friendly, 
        // pointerMove is fine to track continuously for touch drag.
        if (e.buttons > 0 || e.pointerType === 'touch') {
          handlePointer(e);
        }
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0.0} />
    </mesh>
  );
};

let chirpCtx: AudioContext | null = null;
const playChirp = () => {
  if (!useGameStore.getState().sfxEnabled) return;
  try {
    if (!chirpCtx) chirpCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (chirpCtx.state === 'suspended') chirpCtx.resume();
    
    const osc = chirpCtx.createOscillator();
    const gainNode = chirpCtx.createGain();
    
    osc.type = 'sine';
    const t = chirpCtx.currentTime;
    
    // Create a lively sweeping chirp
    osc.frequency.setValueAtTime(4000, t);
    osc.frequency.exponentialRampToValueAtTime(6000, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.02, t + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(chirpCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.25);
  } catch(e) {}
};

let windCtx: AudioContext | null = null;
let windGain: GainNode | null = null;

const initWind = () => {
  if (windCtx) return;
  try {
     windCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
     windGain = windCtx.createGain();
     const filter = windCtx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.frequency.value = 400;

     const bufferSize = windCtx.sampleRate * 2;
     const buffer = windCtx.createBuffer(1, bufferSize, windCtx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i=0; i<bufferSize; i++) {
         data[i] = Math.random() * 2 - 1;
     }

     const noise = windCtx.createBufferSource();
     noise.buffer = buffer;
     noise.loop = true;

     noise.connect(filter);
     filter.connect(windGain);
     windGain.connect(windCtx.destination);
     
     windGain.gain.value = 0;
     noise.start();
  } catch(e) {}
};

// Orchestrator for game loop and lighting
const GameLoop = () => {
  const { tickTime, timeRemaining, safeDucks, totalDucks, status, audioEnabled, shadowQuality, weather } = useGameStore();
  const { camera } = useThree();

  const skyColorObj = new Color(0x60a5fa); // bg-blue-400
  const sunsetColorObj = new Color(0xea580c); // orange sunset

  useEffect(() => {
     let timeoutId: NodeJS.Timeout;
     const attemptChirp = () => {
         if (useGameStore.getState().status === 'playing') {
            if (Math.random() < 0.6) playChirp();
         }
         timeoutId = setTimeout(attemptChirp, 3000 + Math.random() * 5000);
     };
     attemptChirp();
     return () => clearTimeout(timeoutId);
  }, []);

  useFrame((state, delta) => {
    tickTime(delta);
    const ratio = Math.max(0, timeRemaining / TIME_LIMIT);
    let targetColor = sunsetColorObj.clone().lerp(skyColorObj, ratio);
    if (weather === 'rain') {
       const rainColor = new Color(0x708090); // Slate gray
       targetColor.lerp(rainColor, 0.7);
    }
    state.scene.background = targetColor;

    if (status === 'playing' || status === 'won' || status === 'lost') {
       const progress = safeDucks / totalDucks;
       const targetY = 36 + progress * 15;
       const targetZ = 30 + progress * 5;
       
       camera.position.y += (targetY - camera.position.y) * 2 * delta;
       camera.position.z += (targetZ - camera.position.z) * 2 * delta;
       
       if (gameEvents.shakeAmount > 0) {
           camera.position.x = (Math.random() - 0.5) * 2.0 * gameEvents.shakeAmount;
           gameEvents.shakeAmount = Math.max(0, gameEvents.shakeAmount - delta * 2.0);
       } else {
           camera.position.x = 0;
       }
    }

    if (audioEnabled && status === 'playing') {
       // Removed wind noise per user request
    } else {
       //
    }
  });

  // Calculate daylight based on time limit (1 is full day, 0 is nightfall)
  const timeRatio = Math.max(0, timeRemaining / TIME_LIMIT);
  const isRain = weather === 'rain';
  const weatherMod = isRain ? 0.3 : 1.0;
  
  const ambientIntensity = Math.max(0.02, timeRatio * 0.8) * (isRain ? 0.8 : 1.0);
  const dirIntensity = timeRatio * 2.0 * weatherMod;

  // Make sunlight warmer and redder as sunset approaches, unless raining (then greyish)
  const sunColor = isRain ? '#aaccff' : `hsl(${20 + timeRatio * 30}, ${80}%, ${40 + timeRatio * 60}%)`;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#e0f0ff" />
      <directionalLight 
        castShadow={shadowQuality === 'high'}
        position={[10, 20, 10]} 
        intensity={dirIntensity} 
        color={sunColor}
        shadow-mapSize-width={shadowQuality === 'high' ? 2048 : 512}
        shadow-mapSize-height={shadowQuality === 'high' ? 2048 : 512}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  );
};

const ParticleSystem = () => {
    const meshRef = useRef<InstancedMesh>(null);
    const maxParticles = 200;
    const dummy = useMemo(() => new Object3D(), []);

    // We generate a local array of particles from the gameEvents
    const particlesData = useRef<{ pos: Vector3, vel: Vector3, life: number, maxLife: number, id: string }[]>([]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Add new particles if needed
        while (gameEvents.particles.length > 0) {
            const ev = gameEvents.particles.shift();
            if (ev) {
                for (let i = 0; i < 20; i++) { // 20 particles per explosion
                    const vel = new Vector3((Math.random() - 0.5) * 10, Math.random() * 8 + 2, (Math.random() - 0.5) * 10);
                    particlesData.current.push({
                        pos: ev.pos.clone(),
                        vel,
                        life: 0,
                        maxLife: 0.5 + Math.random() * 0.5,
                        id: ev.id + '_' + i
                    });
                }
            }
        }

        // Update existing particles
        let instanceCount = 0;
        for (let i = particlesData.current.length - 1; i >= 0; i--) {
            const p = particlesData.current[i];
            p.life += delta;
            if (p.life >= p.maxLife) {
                particlesData.current.splice(i, 1);
            } else {
                p.pos.add(p.vel.clone().multiplyScalar(delta));
                p.vel.y -= 20 * delta; // Gravity
                
                const scale = 1.0 - (p.life / p.maxLife);
                dummy.position.copy(p.pos);
                dummy.scale.setScalar(scale * 0.4);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(instanceCount, dummy.matrix);
                instanceCount++;
            }
        }

        meshRef.current.count = instanceCount;
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, maxParticles]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ffffff" />
        </instancedMesh>
    );
};

export default function Scene() {
  const gameId = useGameStore(state => state.gameId);
  return (
    <Canvas shadows onPointerDown={(e) => {
      const target = e.target as HTMLElement;
      if (target.setPointerCapture) target.setPointerCapture(e.pointerId);
    }}>
      <PerspectiveCamera makeDefault position={[0, 36, 30]} fov={45} rotation={[-0.95, 0, 0]} />
      
      <GameProvider key={gameId}>
        <GameLoop />
        <GroundInput />
        <Environment />
        <Horses />
        <PowerupSpawner />
        <Eggs />
        <Coop />
        <Dog />
        <Marshall />
        <Turtle />
        <GoldenGoose />
        <Fox />
        <DecoyDuck />
        <DuckFlock />
        <ParticleSystem />
      </GameProvider>
    </Canvas>
  );
}
