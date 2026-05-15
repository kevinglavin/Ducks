import React, { useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Vector3, Raycaster, Plane, Vector2 } from 'three';
import { GameProvider, useGameRefs } from '../../game/GameContext';
import Dog from './Dog';
import DuckFlock from './DuckFlock';
import Coop from './Coop';
import Environment from './Environment';
import { useGameStore } from '../../store/gameStore';
import { TIME_LIMIT } from '../../game/config';

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

// Orchestrator for game loop and lighting
const GameLoop = () => {
  const { tickTime, timeRemaining } = useGameStore();

  useFrame((state, delta) => {
    tickTime(delta);
  });

  // Calculate daylight based on time limit (1 is full day, 0 is nightfall)
  const timeRatio = Math.max(0, timeRemaining / TIME_LIMIT);
  const ambientIntensity = 0.4 + timeRatio * 0.4;
  const dirIntensity = 0.5 + timeRatio * 1.5;

  // Make sunlight warmer and redder as sunset approaches
  const sunColor = `hsl(${40 + timeRatio * 10}, ${80}%, ${60 + timeRatio * 40}%)`;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#e0f0ff" />
      <directionalLight 
        castShadow 
        position={[10, 20, 10]} 
        intensity={dirIntensity} 
        color={sunColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
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
        <Coop />
        <Dog />
        <DuckFlock />
      </GameProvider>
    </Canvas>
  );
}
