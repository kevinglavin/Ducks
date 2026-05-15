import React, { createContext, useContext, useRef } from 'react';
import { Vector3, Object3D } from 'three';
import { DOG_SPAWN_POS } from './config';

export interface DuckData {
  id: string;
  pos: Vector3;
  vel: Vector3;
  meshRef: React.RefObject<Object3D | null>;
  isSafe: boolean;
  type: string;
}

interface GameContextProps {
  dogPos: React.MutableRefObject<Vector3>;
  pointerPos: React.MutableRefObject<Vector3>;
  ducksRef: React.MutableRefObject<DuckData[]>;
}

const GameContext = createContext<GameContextProps | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dogPos = useRef(new Vector3().copy(DOG_SPAWN_POS));
  const pointerPos = useRef(new Vector3().copy(DOG_SPAWN_POS));
  const ducksRef = useRef<DuckData[]>([]);

  return (
    <GameContext.Provider value={{ dogPos, pointerPos, ducksRef }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameRefs = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameRefs must be used within GameProvider");
  return ctx;
};
